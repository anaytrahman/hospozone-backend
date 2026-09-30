// controllers/appointmentController.js
// ─────────────────────────────────────────────────────────────
//   GET    /api/appointments                 list (filtered by role)
//   GET    /api/appointments/:id             one appointment
//   POST   /api/appointments                 book (logged-in patient or staff)
//   POST   /api/appointments/public-booking  book from the website without logging in
//   PUT    /api/appointments/:id             update / confirm / cancel / complete
//   DELETE /api/appointments/:id             delete (admin)
// ─────────────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');
const generateId = require('../utils/generateId');
const notify = require('../utils/notify');
const { ownerFilter, canSee, safeBody, pick } = require('../utils/access');

// ── Helpers ──────────────────────────────────────────────────

// Is this doctor already booked at this date + time? (cancelled ones don't count)
async function isSlotTaken(doctorId, date, time, ignoreAppointmentId) {
  const clash = await Appointment.findOne({
    doctorId, date, time,
    status: { $ne: 'Cancelled' },
    id: { $ne: ignoreAppointmentId || '' }
  });
  return Boolean(clash);
}

// Checks shared by both booking routes. Returns an error message, or null if OK.
async function validateBooking({ doctorId, date, time }) {
  if (!doctorId || !date || !time) return 'Doctor, date and time are required';
  const doctor = await Doctor.findOne({ id: doctorId });
  if (!doctor || doctor.status !== 'Active') return 'This doctor is not available';
  if (await isSlotTaken(doctorId, date, time)) return 'That slot was just taken. Please pick another time';
  return null;
}

// ── Controllers ──────────────────────────────────────────────

// GET /api/appointments
async function getAppointments(req, res, next) {
  try {
    const appointments = await Appointment.find(ownerFilter(req.user)).sort({ date: -1, time: -1 });
    res.json({ success: true, message: 'Appointments fetched successfully', data: appointments });
  } catch (error) {
    next(error);
  }
}

// GET /api/appointments/:id
async function getAppointmentById(req, res, next) {
  try {
    const appointment = await Appointment.findOne({ id: req.params.id });
    if (!appointment || !canSee(req.user, appointment)) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, message: 'Appointment fetched successfully', data: appointment });
  } catch (error) {
    next(error);
  }
}

// POST /api/appointments
async function createAppointment(req, res, next) {
  try {
    const data = safeBody(req.body);

    // Patients can only book for themselves
    if (req.user.role === 'patient') {
      data.patientId = req.user.refId;
      data.bookedBy = 'patient';
      data.status = 'Pending';
    }

    const problem = await validateBooking(data);
    if (problem) {
      return res.status(409).json({ success: false, message: problem });
    }

    const id = await generateId('APT');
    const appointment = await Appointment.create({ ...data, id, code: id });
    res.status(201).json({ success: true, message: 'Appointment booked successfully', data: appointment });
  } catch (error) {
    next(error);
  }
}

// POST /api/appointments/public-booking   (no login needed)
// body: { patient: { name, email, phone, gender, age }, doctorId, departmentId, date, time, reason, type }
async function publicBooking(req, res, next) {
  try {
    const { patient: patientInfo, doctorId, departmentId, date, time, reason, type } = req.body;

    if (!patientInfo || !patientInfo.name || !patientInfo.email || !patientInfo.phone) {
      return res.status(400).json({ success: false, message: 'Patient name, email and phone are required' });
    }
    const problem = await validateBooking({ doctorId, date, time });
    if (problem) {
      return res.status(409).json({ success: false, message: problem });
    }

    // 1) Find the patient by email, or register them (with a default portal password)
    const email = patientInfo.email.trim().toLowerCase();
    let patient = await Patient.findOne({ email });
    if (!patient) {
      const birthYear = new Date().getFullYear() - (Number(patientInfo.age) || 30);
      patient = await Patient.create({
        id: await generateId('PAT'),
        name: patientInfo.name, email, phone: patientInfo.phone,
        gender: patientInfo.gender || 'Other', dob: `${birthYear}-01-01`
      });
      await User.create({
        id: 'U-' + patient.id, name: patient.name, email,
        passwordHash: await bcrypt.hash('patient123', 10), role: 'patient', refId: patient.id
      });
    }

    // 2) Create the appointment
    const id = await generateId('APT');
    const appointment = await Appointment.create({
      id, code: id, patientId: patient.id, doctorId, departmentId, date, time,
      reason: reason || '', type: type || 'New Consultation', status: 'Pending', bookedBy: 'online'
    });

    // 3) Tell the front desk, the doctor and the patient
    const when = `${date} at ${time}`;
    await notify('appointment_new', 'New appointment request', `${patient.name} booked online for ${when}.`, { roles: ['admin', 'receptionist'] }, '/admin/appointments');
    await notify('appointment_new', 'New appointment', `${patient.name} is booked with you on ${when}.`, { doctorId }, '/admin/appointments');
    await notify('appointment_new', 'Appointment request received', `Your request ${id} for ${when} has been received.`, { patientId: patient.id }, '/patient/appointments');

    res.status(201).json({ success: true, message: 'Appointment booked successfully', data: { appointment, patient } });
  } catch (error) {
    next(error);
  }
}

// PUT /api/appointments/:id
async function updateAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findOne({ id: req.params.id });
    if (!appointment || !canSee(req.user, appointment)) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    let updates = safeBody(req.body);

    // Patients may only cancel their own appointment
    if (req.user.role === 'patient') {
      updates = pick(updates, ['status']);
      if (updates.status !== 'Cancelled') {
        return res.status(403).json({ success: false, message: 'Patients can only cancel appointments' });
      }
    }
    // Doctors may change status and notes of their own appointments
    if (req.user.role === 'doctor') {
      updates = pick(updates, ['status', 'notes']);
    }

    // If date / time / doctor changes, make sure the new slot is free
    const newDoctor = updates.doctorId || appointment.doctorId;
    const newDate = updates.date || appointment.date;
    const newTime = updates.time || appointment.time;
    const slotChanged = newDoctor !== appointment.doctorId || newDate !== appointment.date || newTime !== appointment.time;
    if (slotChanged && (await isSlotTaken(newDoctor, newDate, newTime, appointment.id))) {
      return res.status(409).json({ success: false, message: 'That slot is already booked' });
    }

    Object.assign(appointment, updates);
    await appointment.save(); // save() runs the schema validators

    res.json({ success: true, message: 'Appointment updated successfully', data: appointment });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/appointments/:id
async function deleteAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findOneAndDelete({ id: req.params.id });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, message: 'Appointment deleted successfully', data: { id: appointment.id } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAppointments, getAppointmentById, createAppointment, publicBooking, updateAppointment, deleteAppointment };

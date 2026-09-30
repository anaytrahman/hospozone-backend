// controllers/patientController.js
// ─────────────────────────────────────────────────────────────
//   GET    /api/patients        list (admin/receptionist: all, doctor: own patients, patient: self)
//   GET    /api/patients/:id    one patient
//   POST   /api/patients        register a patient at the front desk (admin/receptionist)
//   PUT    /api/patients/:id    update (staff: any, patient: own profile only)
//   DELETE /api/patients/:id    delete (admin, only if no history)
// ─────────────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const generateId = require('../utils/generateId');
const { safeBody, pick } = require('../utils/access');

// Password given to accounts created by staff (patient can change it later)
const DEFAULT_PATIENT_PASSWORD = 'patient123';

// Which patients may this user see?
async function patientFilterFor(user) {
  if (user.role === 'patient') return { id: user.refId };
  if (user.role === 'doctor') {
    // a doctor's patients = everyone who has an appointment with that doctor
    const patientIds = await Appointment.distinct('patientId', { doctorId: user.refId });
    return { id: { $in: patientIds } };
  }
  return {}; // admin & receptionist see everyone
}

// GET /api/patients
async function getPatients(req, res, next) {
  try {
    const filter = await patientFilterFor(req.user);
    const patients = await Patient.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, message: 'Patients fetched successfully', data: patients });
  } catch (error) {
    next(error);
  }
}

// GET /api/patients/:id
async function getPatientById(req, res, next) {
  try {
    const filter = await patientFilterFor(req.user);
    const patient = await Patient.findOne({ ...filter, id: req.params.id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.json({ success: true, message: 'Patient fetched successfully', data: patient });
  } catch (error) {
    next(error);
  }
}

// POST /api/patients
async function createPatient(req, res, next) {
  try {
    const data = safeBody(req.body);
    const patient = await Patient.create({ ...data, id: await generateId('PAT') });

    // Give the patient a login too, so they can use the patient portal
    await User.create({
      id: 'U-' + patient.id,
      name: patient.name,
      email: patient.email,
      passwordHash: await bcrypt.hash(req.body.password || DEFAULT_PATIENT_PASSWORD, 10),
      role: 'patient',
      refId: patient.id
    });

    res.status(201).json({ success: true, message: 'Patient created successfully', data: patient });
  } catch (error) {
    next(error);
  }
}

// PUT /api/patients/:id
async function updatePatient(req, res, next) {
  try {
    const isPatient = req.user.role === 'patient';

    // A patient may only edit their own profile, and not their status or email
    if (isPatient && req.user.refId !== req.params.id) {
      return res.status(403).json({ success: false, message: 'You can only update your own profile' });
    }
    let updates = safeBody(req.body);
    if (isPatient) {
      updates = pick(updates, ['name', 'dob', 'gender', 'phone', 'address', 'city', 'emergencyContact', 'bloodGroup', 'heightCm', 'weightKg', 'allergies', 'chronicConditions']);
    }

    const patient = await Patient.findOneAndUpdate({ id: req.params.id }, updates, { new: true, runValidators: true });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Keep the login account in sync (name, email, active flag)
    await User.updateOne(
      { refId: patient.id, role: 'patient' },
      { name: patient.name, email: patient.email, isActive: patient.status === 'Active' }
    );

    res.json({ success: true, message: 'Patient updated successfully', data: patient });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/patients/:id
async function deletePatient(req, res, next) {
  try {
    // Medical history must be kept — deactivate such patients instead of deleting
    const hasHistory = (await Appointment.exists({ patientId: req.params.id })) || (await Invoice.exists({ patientId: req.params.id }));
    if (hasHistory) {
      return res.status(400).json({ success: false, message: 'Patient has appointments or bills. Deactivate instead of deleting' });
    }

    const patient = await Patient.findOneAndDelete({ id: req.params.id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    await User.deleteOne({ refId: patient.id, role: 'patient' });

    res.json({ success: true, message: 'Patient deleted successfully', data: { id: patient.id } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPatients, getPatientById, createPatient, updatePatient, deletePatient };

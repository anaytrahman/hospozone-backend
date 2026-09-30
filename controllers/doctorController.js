// controllers/doctorController.js
// ─────────────────────────────────────────────────────────────
//   GET    /api/doctors        public — the website lists doctors
//   GET    /api/doctors/:id    public — doctor profile page
//   POST   /api/doctors        admin — also creates the doctor's login
//   PUT    /api/doctors/:id    admin
//   DELETE /api/doctors/:id    admin — only if the doctor has no appointments
// ─────────────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const generateId = require('../utils/generateId');
const { safeBody } = require('../utils/access');

const DEFAULT_DOCTOR_PASSWORD = 'doctor123';

// GET /api/doctors
async function getDoctors(req, res, next) {
  try {
    const doctors = await Doctor.find().sort({ name: 1 });
    res.json({ success: true, message: 'Doctors fetched successfully', data: doctors });
  } catch (error) {
    next(error);
  }
}

// GET /api/doctors/:id
async function getDoctorById(req, res, next) {
  try {
    const doctor = await Doctor.findOne({ id: req.params.id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, message: 'Doctor fetched successfully', data: doctor });
  } catch (error) {
    next(error);
  }
}

// POST /api/doctors
async function createDoctor(req, res, next) {
  try {
    const data = safeBody(req.body);
    const doctor = await Doctor.create({ ...data, id: await generateId('DOC') });

    // Login account for the doctor (password can be sent as "password", otherwise the default)
    await User.create({
      id: 'U-' + doctor.id,
      name: doctor.name,
      email: doctor.email,
      passwordHash: await bcrypt.hash(req.body.password || DEFAULT_DOCTOR_PASSWORD, 10),
      role: 'doctor',
      refId: doctor.id,
      avatar: doctor.photo
    });

    res.status(201).json({ success: true, message: 'Doctor created successfully', data: doctor });
  } catch (error) {
    next(error);
  }
}

// PUT /api/doctors/:id
async function updateDoctor(req, res, next) {
  try {
    const doctor = await Doctor.findOneAndUpdate({ id: req.params.id }, safeBody(req.body), { new: true, runValidators: true });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // keep the login account in sync
    await User.updateOne(
      { refId: doctor.id, role: 'doctor' },
      { name: doctor.name, email: doctor.email, avatar: doctor.photo, isActive: doctor.status === 'Active' }
    );

    res.json({ success: true, message: 'Doctor updated successfully', data: doctor });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/doctors/:id
async function deleteDoctor(req, res, next) {
  try {
    if (await Appointment.exists({ doctorId: req.params.id })) {
      return res.status(400).json({ success: false, message: 'Doctor has appointments. Deactivate instead of deleting' });
    }
    const doctor = await Doctor.findOneAndDelete({ id: req.params.id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    await User.deleteOne({ refId: doctor.id, role: 'doctor' });
    res.json({ success: true, message: 'Doctor deleted successfully', data: { id: doctor.id } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor };

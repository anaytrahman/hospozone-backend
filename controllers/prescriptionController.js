// controllers/prescriptionController.js
// ─────────────────────────────────────────────────────────────
//   GET    /api/prescriptions        list (patient: own, doctor: own, admin: all)
//   GET    /api/prescriptions/:id
//   POST   /api/prescriptions        admin / doctor
//   PUT    /api/prescriptions/:id    admin / doctor (own)
//   DELETE /api/prescriptions/:id    admin / doctor (own)
// ─────────────────────────────────────────────────────────────
const Prescription = require('../models/Prescription');
const generateId = require('../utils/generateId');
const { ownerFilter, canSee, safeBody } = require('../utils/access');

// GET /api/prescriptions
async function getPrescriptions(req, res, next) {
  try {
    const prescriptions = await Prescription.find(ownerFilter(req.user)).sort({ date: -1 });
    res.json({ success: true, message: 'Prescriptions fetched successfully', data: prescriptions });
  } catch (error) {
    next(error);
  }
}

// GET /api/prescriptions/:id
async function getPrescriptionById(req, res, next) {
  try {
    const prescription = await Prescription.findOne({ id: req.params.id });
    if (!prescription || !canSee(req.user, prescription)) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    res.json({ success: true, message: 'Prescription fetched successfully', data: prescription });
  } catch (error) {
    next(error);
  }
}

// POST /api/prescriptions
async function createPrescription(req, res, next) {
  try {
    const data = safeBody(req.body);
    if (req.user.role === 'doctor') data.doctorId = req.user.refId;
    if (!Array.isArray(data.medicines) || data.medicines.length === 0) {
      return res.status(400).json({ success: false, message: 'Add at least one medicine' });
    }

    const id = await generateId('RX');
    const prescription = await Prescription.create({ ...data, id, code: id });
    res.status(201).json({ success: true, message: 'Prescription created successfully', data: prescription });
  } catch (error) {
    next(error);
  }
}

// PUT /api/prescriptions/:id
async function updatePrescription(req, res, next) {
  try {
    const prescription = await Prescription.findOne({ id: req.params.id });
    if (!prescription || !canSee(req.user, prescription)) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    Object.assign(prescription, safeBody(req.body));
    if (req.user.role === 'doctor') prescription.doctorId = req.user.refId;
    await prescription.save();
    res.json({ success: true, message: 'Prescription updated successfully', data: prescription });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/prescriptions/:id
async function deletePrescription(req, res, next) {
  try {
    const prescription = await Prescription.findOne({ id: req.params.id });
    if (!prescription || !canSee(req.user, prescription)) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    await prescription.deleteOne();
    res.json({ success: true, message: 'Prescription deleted successfully', data: { id: prescription.id } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPrescriptions, getPrescriptionById, createPrescription, updatePrescription, deletePrescription };

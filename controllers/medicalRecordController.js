// controllers/medicalRecordController.js
// ─────────────────────────────────────────────────────────────
//   GET    /api/medical-records        list (patient: own, doctor: own, admin: all)
//   GET    /api/medical-records/:id
//   POST   /api/medical-records        admin / doctor
//   PUT    /api/medical-records/:id    admin / doctor (own)
//   DELETE /api/medical-records/:id    admin / doctor (own)
// ─────────────────────────────────────────────────────────────
const MedicalRecord = require('../models/MedicalRecord');
const generateId = require('../utils/generateId');
const { ownerFilter, canSee, safeBody } = require('../utils/access');

// GET /api/medical-records
async function getRecords(req, res, next) {
  try {
    const records = await MedicalRecord.find(ownerFilter(req.user)).sort({ visitDate: -1 });
    res.json({ success: true, message: 'Medical records fetched successfully', data: records });
  } catch (error) {
    next(error);
  }
}

// GET /api/medical-records/:id
async function getRecordById(req, res, next) {
  try {
    const record = await MedicalRecord.findOne({ id: req.params.id });
    if (!record || !canSee(req.user, record)) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }
    res.json({ success: true, message: 'Medical record fetched successfully', data: record });
  } catch (error) {
    next(error);
  }
}

// POST /api/medical-records
async function createRecord(req, res, next) {
  try {
    const data = safeBody(req.body);
    if (req.user.role === 'doctor') data.doctorId = req.user.refId; // doctors write their own records

    const record = await MedicalRecord.create({ ...data, id: await generateId('MR') });
    res.status(201).json({ success: true, message: 'Medical record created successfully', data: record });
  } catch (error) {
    next(error);
  }
}

// PUT /api/medical-records/:id
async function updateRecord(req, res, next) {
  try {
    const record = await MedicalRecord.findOne({ id: req.params.id });
    if (!record || !canSee(req.user, record)) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }
    Object.assign(record, safeBody(req.body));
    if (req.user.role === 'doctor') record.doctorId = req.user.refId;
    await record.save();
    res.json({ success: true, message: 'Medical record updated successfully', data: record });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/medical-records/:id
async function deleteRecord(req, res, next) {
  try {
    const record = await MedicalRecord.findOne({ id: req.params.id });
    if (!record || !canSee(req.user, record)) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }
    await record.deleteOne();
    res.json({ success: true, message: 'Medical record deleted successfully', data: { id: record.id } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getRecords, getRecordById, createRecord, updateRecord, deleteRecord };

// controllers/labReportController.js
// ─────────────────────────────────────────────────────────────
//   GET    /api/lab-reports        list (patient: own, doctor: own, admin: all)
//   GET    /api/lab-reports/:id
//   POST   /api/lab-reports        admin / doctor — order a test
//   PUT    /api/lab-reports/:id    admin / doctor — enter result, change status
//   DELETE /api/lab-reports/:id    admin / doctor (own)
// ─────────────────────────────────────────────────────────────
const LabReport = require('../models/LabReport');
const generateId = require('../utils/generateId');
const { ownerFilter, canSee, safeBody } = require('../utils/access');

// GET /api/lab-reports
async function getLabReports(req, res, next) {
  try {
    const reports = await LabReport.find(ownerFilter(req.user)).sort({ testDate: -1 });
    res.json({ success: true, message: 'Lab reports fetched successfully', data: reports });
  } catch (error) {
    next(error);
  }
}

// GET /api/lab-reports/:id
async function getLabReportById(req, res, next) {
  try {
    const report = await LabReport.findOne({ id: req.params.id });
    if (!report || !canSee(req.user, report)) {
      return res.status(404).json({ success: false, message: 'Lab report not found' });
    }
    res.json({ success: true, message: 'Lab report fetched successfully', data: report });
  } catch (error) {
    next(error);
  }
}

// POST /api/lab-reports
async function createLabReport(req, res, next) {
  try {
    const data = safeBody(req.body);
    if (req.user.role === 'doctor') data.doctorId = req.user.refId;

    const id = await generateId('LAB');
    const report = await LabReport.create({ ...data, id, code: id });
    res.status(201).json({ success: true, message: 'Lab test ordered successfully', data: report });
  } catch (error) {
    next(error);
  }
}

// PUT /api/lab-reports/:id
async function updateLabReport(req, res, next) {
  try {
    const report = await LabReport.findOne({ id: req.params.id });
    if (!report || !canSee(req.user, report)) {
      return res.status(404).json({ success: false, message: 'Lab report not found' });
    }
    Object.assign(report, safeBody(req.body));
    await report.save();

    res.json({ success: true, message: 'Lab report updated successfully', data: report });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/lab-reports/:id
async function deleteLabReport(req, res, next) {
  try {
    const report = await LabReport.findOne({ id: req.params.id });
    if (!report || !canSee(req.user, report)) {
      return res.status(404).json({ success: false, message: 'Lab report not found' });
    }
    await report.deleteOne();
    res.json({ success: true, message: 'Lab report deleted successfully', data: { id: report.id } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getLabReports, getLabReportById, createLabReport, updateLabReport, deleteLabReport };

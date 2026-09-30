// controllers/staffController.js
// ─────────────────────────────────────────────────────────────
// Hospital staff directory (nurses, receptionists, lab technicians …).
// Admin only — see routes/staffRoutes.js
// ─────────────────────────────────────────────────────────────
const Staff = require('../models/Staff');
const generateId = require('../utils/generateId');
const { safeBody } = require('../utils/access');

// GET /api/staff
async function getStaff(req, res, next) {
  try {
    const staff = await Staff.find().sort({ name: 1 });
    res.json({ success: true, message: 'Staff fetched successfully', data: staff });
  } catch (error) {
    next(error);
  }
}

// GET /api/staff/:id
async function getStaffById(req, res, next) {
  try {
    const member = await Staff.findOne({ id: req.params.id });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.json({ success: true, message: 'Staff member fetched successfully', data: member });
  } catch (error) {
    next(error);
  }
}

// POST /api/staff
async function createStaff(req, res, next) {
  try {
    const member = await Staff.create({ ...safeBody(req.body), id: await generateId('STF') });
    res.status(201).json({ success: true, message: 'Staff member added successfully', data: member });
  } catch (error) {
    next(error);
  }
}

// PUT /api/staff/:id
async function updateStaff(req, res, next) {
  try {
    const member = await Staff.findOneAndUpdate({ id: req.params.id }, safeBody(req.body), { new: true, runValidators: true });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.json({ success: true, message: 'Staff member updated successfully', data: member });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/staff/:id
async function deleteStaff(req, res, next) {
  try {
    const member = await Staff.findOneAndDelete({ id: req.params.id });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.json({ success: true, message: 'Staff member removed successfully', data: { id: member.id } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getStaff, getStaffById, createStaff, updateStaff, deleteStaff };

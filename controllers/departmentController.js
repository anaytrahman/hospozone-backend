// controllers/departmentController.js
// ─────────────────────────────────────────────────────────────
//   GET    /api/departments        public
//   GET    /api/departments/:id    public
//   POST   /api/departments        admin
//   PUT    /api/departments/:id    admin
//   DELETE /api/departments/:id    admin — only if no doctors are assigned
// ─────────────────────────────────────────────────────────────
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const generateId = require('../utils/generateId');
const { safeBody } = require('../utils/access');

// "General Medicine" → "general-medicine" (used in website URLs)
function makeSlug(name) {
  return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// GET /api/departments
async function getDepartments(req, res, next) {
  try {
    const departments = await Department.find().sort({ id: 1 });
    res.json({ success: true, message: 'Departments fetched successfully', data: departments });
  } catch (error) {
    next(error);
  }
}

// GET /api/departments/:id
async function getDepartmentById(req, res, next) {
  try {
    const department = await Department.findOne({ id: req.params.id });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.json({ success: true, message: 'Department fetched successfully', data: department });
  } catch (error) {
    next(error);
  }
}

// POST /api/departments
async function createDepartment(req, res, next) {
  try {
    const data = safeBody(req.body);
    if (!data.name) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }
    const department = await Department.create({
      ...data,
      id: await generateId('DEP'),
      slug: data.slug || makeSlug(data.name)
    });
    res.status(201).json({ success: true, message: 'Department created successfully', data: department });
  } catch (error) {
    next(error);
  }
}

// PUT /api/departments/:id
async function updateDepartment(req, res, next) {
  try {
    const updates = safeBody(req.body);
    if (updates.name && !updates.slug) updates.slug = makeSlug(updates.name);

    const department = await Department.findOneAndUpdate({ id: req.params.id }, updates, { new: true, runValidators: true });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.json({ success: true, message: 'Department updated successfully', data: department });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/departments/:id
async function deleteDepartment(req, res, next) {
  try {
    if (await Doctor.exists({ departmentId: req.params.id })) {
      return res.status(400).json({ success: false, message: 'Move this department\'s doctors first, or deactivate it instead' });
    }
    const department = await Department.findOneAndDelete({ id: req.params.id });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.json({ success: true, message: 'Department deleted successfully', data: { id: department.id } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment };

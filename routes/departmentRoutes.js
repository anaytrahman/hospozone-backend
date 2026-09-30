// routes/departmentRoutes.js
const express = require('express');
const { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Public — the website lists departments
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);

// Admin only
router.post('/', protect, allowRoles('admin'), createDepartment);
router.put('/:id', protect, allowRoles('admin'), updateDepartment);
router.delete('/:id', protect, allowRoles('admin'), deleteDepartment);

module.exports = router;

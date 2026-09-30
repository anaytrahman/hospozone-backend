// routes/doctorRoutes.js
const express = require('express');
const { getDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor } = require('../controllers/doctorController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Public — the website shows doctors to visitors
router.get('/', getDoctors);
router.get('/:id', getDoctorById);

// Admin only
router.post('/', protect, allowRoles('admin'), createDoctor);
router.put('/:id', protect, allowRoles('admin'), updateDoctor);
router.delete('/:id', protect, allowRoles('admin'), deleteDoctor);

module.exports = router;

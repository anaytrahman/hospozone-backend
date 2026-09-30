// routes/labReportRoutes.js
const express = require('express');
const { getLabReports, getLabReportById, createLabReport, updateLabReport, deleteLabReport } = require('../controllers/labReportController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', allowRoles('admin', 'doctor', 'patient'), getLabReports);
router.get('/:id', allowRoles('admin', 'doctor', 'patient'), getLabReportById);
router.post('/', allowRoles('admin', 'doctor'), createLabReport);
router.put('/:id', allowRoles('admin', 'doctor'), updateLabReport);
router.delete('/:id', allowRoles('admin', 'doctor'), deleteLabReport);

module.exports = router;

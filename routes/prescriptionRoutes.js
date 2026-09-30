// routes/prescriptionRoutes.js
const express = require('express');
const {
  getPrescriptions, getPrescriptionById, createPrescription, updatePrescription, deletePrescription
} = require('../controllers/prescriptionController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', allowRoles('admin', 'doctor', 'patient'), getPrescriptions);
router.get('/:id', allowRoles('admin', 'doctor', 'patient'), getPrescriptionById);
router.post('/', allowRoles('admin', 'doctor'), createPrescription);
router.put('/:id', allowRoles('admin', 'doctor'), updatePrescription);
router.delete('/:id', allowRoles('admin', 'doctor'), deletePrescription);

module.exports = router;

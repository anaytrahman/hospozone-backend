// routes/patientRoutes.js
const express = require('express');
const { getPatients, getPatientById, createPatient, updatePatient, deletePatient } = require('../controllers/patientController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // every patient route needs a logged-in user

router.get('/', getPatients);                                            // list is filtered by role inside the controller
router.get('/:id', getPatientById);
router.post('/', allowRoles('admin', 'receptionist'), createPatient);
router.put('/:id', allowRoles('admin', 'receptionist', 'patient'), updatePatient);
router.delete('/:id', allowRoles('admin'), deletePatient);

module.exports = router;

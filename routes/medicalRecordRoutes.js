// routes/medicalRecordRoutes.js
const express = require('express');
const { getRecords, getRecordById, createRecord, updateRecord, deleteRecord } = require('../controllers/medicalRecordController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', allowRoles('admin', 'doctor', 'patient'), getRecords);
router.get('/:id', allowRoles('admin', 'doctor', 'patient'), getRecordById);
router.post('/', allowRoles('admin', 'doctor'), createRecord);
router.put('/:id', allowRoles('admin', 'doctor'), updateRecord);
router.delete('/:id', allowRoles('admin', 'doctor'), deleteRecord);

module.exports = router;

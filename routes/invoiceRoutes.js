// routes/invoiceRoutes.js
const express = require('express');
const { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice } = require('../controllers/invoiceController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', getInvoices);                // filtered by role in the controller
router.get('/:id', getInvoiceById);
router.post('/', allowRoles('admin', 'receptionist', 'doctor'), createInvoice);
router.put('/:id', allowRoles('admin', 'receptionist', 'doctor', 'patient'), updateInvoice);
router.delete('/:id', allowRoles('admin'), deleteInvoice);

module.exports = router;

// routes/paymentRoutes.js
const express = require('express');
const { getPayments, createPayment } = require('../controllers/paymentController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, allowRoles('admin', 'receptionist', 'patient'));

router.get('/', getPayments);
router.post('/', createPayment);

module.exports = router;

// controllers/paymentController.js
// ─────────────────────────────────────────────────────────────
//   GET  /api/payments     patient: own · admin/receptionist: all
//   POST /api/payments     record a payment or refund against an invoice
// Payments are a history log, so there is no update or delete.
// ─────────────────────────────────────────────────────────────
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const generateId = require('../utils/generateId');
const { safeBody, todayString } = require('../utils/access');

// GET /api/payments
async function getPayments(req, res, next) {
  try {
    const filter = req.user.role === 'patient' ? { patientId: req.user.refId } : {};
    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, message: 'Payments fetched successfully', data: payments });
  } catch (error) {
    next(error);
  }
}

// POST /api/payments
async function createPayment(req, res, next) {
  try {
    const data = safeBody(req.body);

    const invoice = await Invoice.findOne({ id: data.invoiceId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    // A patient can only pay their own bill, and cannot record refunds
    if (req.user.role === 'patient' && (invoice.patientId !== req.user.refId || data.type === 'Refund')) {
      return res.status(403).json({ success: false, message: 'You can only pay your own invoices' });
    }

    const id = await generateId('PAY');
    const payment = await Payment.create({
      ...data, id, code: id,
      patientId: invoice.patientId,           // always taken from the invoice
      date: data.date || todayString()
    });
    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: payment });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPayments, createPayment };

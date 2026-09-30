// controllers/invoiceController.js
// ─────────────────────────────────────────────────────────────
//   GET    /api/invoices        list (patient: own, doctor: own, admin/receptionist: all)
//   GET    /api/invoices/:id
//   POST   /api/invoices        admin / receptionist / doctor (auto-bill when a visit is completed)
//   PUT    /api/invoices/:id    staff: any field · patient: only amountPaid + status of own bill (demo payment)
//   DELETE /api/invoices/:id    admin
// ─────────────────────────────────────────────────────────────
const Invoice = require('../models/Invoice');
const generateId = require('../utils/generateId');
const { ownerFilter, canSee, safeBody, pick } = require('../utils/access');

// Total = (all charges − discount) + tax.  Same formula as the Angular app.
function invoiceTotal(invoice) {
  const otherTotal = (invoice.otherServices || []).reduce((sum, line) => sum + (line.amount || 0), 0);
  const subtotal = invoice.consultationCharge + invoice.labCharges + invoice.medicineCharges + otherTotal - invoice.discount;
  return Math.round(subtotal * (1 + invoice.taxPercent / 100));
}

// GET /api/invoices
async function getInvoices(req, res, next) {
  try {
    const invoices = await Invoice.find(ownerFilter(req.user)).sort({ date: -1 });
    res.json({ success: true, message: 'Invoices fetched successfully', data: invoices });
  } catch (error) {
    next(error);
  }
}

// GET /api/invoices/:id
async function getInvoiceById(req, res, next) {
  try {
    const invoice = await Invoice.findOne({ id: req.params.id });
    if (!invoice || !canSee(req.user, invoice)) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Invoice fetched successfully', data: invoice });
  } catch (error) {
    next(error);
  }
}

// POST /api/invoices
async function createInvoice(req, res, next) {
  try {
    const data = safeBody(req.body);

    // One invoice per appointment
    if (data.appointmentId && (await Invoice.exists({ appointmentId: data.appointmentId }))) {
      return res.status(409).json({ success: false, message: 'This appointment already has an invoice' });
    }

    const id = await generateId('INV');
    const invoice = await Invoice.create({ ...data, id, code: id });
    res.status(201).json({ success: true, message: 'Invoice created successfully', data: invoice });
  } catch (error) {
    next(error);
  }
}

// PUT /api/invoices/:id
async function updateInvoice(req, res, next) {
  try {
    const invoice = await Invoice.findOne({ id: req.params.id });
    if (!invoice || !canSee(req.user, invoice)) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    let updates = safeBody(req.body);
    if (req.user.role === 'patient') {
      updates = pick(updates, ['amountPaid', 'status']); // patient can only pay
    }

    Object.assign(invoice, updates);

    if (invoice.amountPaid > invoiceTotal(invoice)) {
      return res.status(400).json({ success: false, message: 'Amount paid cannot be more than the invoice total' });
    }

    await invoice.save();
    res.json({ success: true, message: 'Invoice updated successfully', data: invoice });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/invoices/:id
async function deleteInvoice(req, res, next) {
  try {
    const invoice = await Invoice.findOneAndDelete({ id: req.params.id });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Invoice deleted successfully', data: { id: invoice.id } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice, invoiceTotal };

// models/Invoice.js
// The total is NOT stored — it is calculated from the charges, discount and tax
// (see invoiceTotal in controllers/invoiceController.js). One source of truth.
const mongoose = require('mongoose');
const schemaOptions = require('../utils/schemaOptions');

const invoiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },               // INV-9001
    code: String,
    patientId: { type: String, required: [true, 'Patient is required'] },
    appointmentId: String,
    doctorId: { type: String, required: [true, 'Doctor is required'] },
    date: { type: String, required: true },
    consultationCharge: { type: Number, default: 0 },
    labCharges: { type: Number, default: 0 },
    medicineCharges: { type: Number, default: 0 },
    otherServices: [{ description: String, amount: Number, _id: false }],
    discount: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 5 },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: ['Paid', 'Pending', 'Partially Paid', 'Refunded'], default: 'Pending' },
    dueDate: String,
    createdAt: { type: Date, default: Date.now }
  },
  schemaOptions
);

module.exports = mongoose.model('Invoice', invoiceSchema);

// models/Payment.js
const mongoose = require('mongoose');
const schemaOptions = require('../utils/schemaOptions');

const paymentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },               // PAY-4001
    code: String,
    invoiceId: { type: String, required: [true, 'Invoice is required'] },
    patientId: { type: String, required: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: 0 },
    method: { type: String, enum: ['Cash', 'UPI', 'Card', 'Insurance', 'Net Banking'], default: 'UPI' },
    date: { type: String, required: true },
    reference: { type: String, default: '' },
    type: { type: String, enum: ['Payment', 'Refund'], default: 'Payment' },
    createdAt: { type: Date, default: Date.now }
  },
  schemaOptions
);

module.exports = mongoose.model('Payment', paymentSchema);

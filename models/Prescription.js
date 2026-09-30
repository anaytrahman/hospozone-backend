// models/Prescription.js
const mongoose = require('mongoose');
const schemaOptions = require('../utils/schemaOptions');

// One line of the prescription (one medicine)
const medicineSchema = new mongoose.Schema(
  {
    medicine: { type: String, required: [true, 'Medicine name is required'] },
    dosage: { type: String, default: '' },
    frequency: { type: String, default: '' },
    duration: { type: String, default: '' },
    instructions: { type: String, default: '' }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },               // RX-7001
    code: String,
    patientId: { type: String, required: [true, 'Patient is required'] },
    doctorId: { type: String, required: [true, 'Doctor is required'] },
    appointmentId: String,
    date: { type: String, required: [true, 'Date is required'] },
    diagnosis: { type: String, required: [true, 'Diagnosis is required'] },
    medicines: { type: [medicineSchema], default: [] },
    advice: String,
    createdAt: { type: Date, default: Date.now }
  },
  schemaOptions
);

module.exports = mongoose.model('Prescription', prescriptionSchema);

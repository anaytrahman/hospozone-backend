// models/MedicalRecord.js
const mongoose = require('mongoose');
const schemaOptions = require('../utils/schemaOptions');

const medicalRecordSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },               // MR-5001
    patientId: { type: String, required: [true, 'Patient is required'] },
    doctorId: { type: String, required: [true, 'Doctor is required'] },
    appointmentId: String,
    visitDate: { type: String, required: [true, 'Visit date is required'] },
    symptoms: { type: [String], default: [] },
    diagnosis: { type: String, required: [true, 'Diagnosis is required'] },
    medicalHistory: { type: String, default: '' },
    doctorNotes: { type: String, default: '' },
    treatment: { type: String, default: '' },
    vitals: { bp: String, pulse: Number, tempF: Number, spo2: Number },
    followUpDate: String,
    createdAt: { type: Date, default: Date.now }
  },
  schemaOptions
);

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);

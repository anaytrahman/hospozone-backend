// models/LabReport.js
const mongoose = require('mongoose');
const schemaOptions = require('../utils/schemaOptions');

const labReportSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },               // LAB-3001
    code: String,
    patientId: { type: String, required: [true, 'Patient is required'] },
    doctorId: { type: String, required: [true, 'Doctor is required'] },
    departmentId: { type: String, default: '' },
    testName: { type: String, required: [true, 'Test name is required'] },
    testDate: { type: String, required: [true, 'Test date is required'] },
    result: { type: String, default: '—' },
    referenceRange: { type: String, default: '' },
    flag: { type: String, enum: ['Normal', 'High', 'Low'] },
    status: { type: String, enum: ['Pending', 'Processing', 'Completed'], default: 'Pending' },
    charge: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  },
  schemaOptions
);

module.exports = mongoose.model('LabReport', labReportSchema);

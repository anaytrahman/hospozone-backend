// models/Patient.js
const mongoose = require('mongoose');
const schemaOptions = require('../utils/schemaOptions');

const patientSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },               // PAT-1001
    name: { type: String, required: [true, 'Patient name is required'], trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    dob: { type: String, required: [true, 'Date of birth is required'] }, // 'yyyy-MM-dd'
    phone: { type: String, required: [true, 'Phone is required'] },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    bloodGroup: { type: String, default: 'O+' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    emergencyContact: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    allergies: { type: [String], default: [] },
    chronicConditions: { type: [String], default: [] },
    heightCm: Number,
    weightKg: Number,
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    avatar: String,
    createdAt: { type: Date, default: Date.now }
  },
  schemaOptions
);

module.exports = mongoose.model('Patient', patientSchema);

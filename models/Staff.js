// models/Staff.js
const mongoose = require('mongoose');
const schemaOptions = require('../utils/schemaOptions');

const staffSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },               // STF-601
    name: { type: String, required: [true, 'Name is required'], trim: true },
    role: {
      type: String,
      enum: ['Receptionist', 'Nurse', 'Lab Technician', 'Pharmacist', 'Administrator', 'Support Staff'],
      required: [true, 'Role is required']
    },
    departmentId: String,
    phone: { type: String, default: '' },
    email: { type: String, required: [true, 'Email is required'], lowercase: true, trim: true },
    shift: { type: String, enum: ['Morning', 'Evening', 'Night', 'General'], default: 'General' },
    joinedOn: String,
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    createdAt: { type: Date, default: Date.now }
  },
  schemaOptions
);

module.exports = mongoose.model('Staff', staffSchema);

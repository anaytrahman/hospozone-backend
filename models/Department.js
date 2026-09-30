// models/Department.js
const mongoose = require('mongoose');
const schemaOptions = require('../utils/schemaOptions');

const departmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },               // DEP-01
    name: { type: String, required: [true, 'Department name is required'], trim: true },
    slug: { type: String, required: true, unique: true },             // 'general-medicine' (used in URLs)
    icon: { type: String, default: 'hospital' },                      // bootstrap-icon name
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    services: { type: [String], default: [] },
    facilities: { type: [String], default: [] },
    floor: { type: String, default: '' },
    headDoctorId: String,
    image: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    createdAt: { type: Date, default: Date.now }
  },
  schemaOptions
);

module.exports = mongoose.model('Department', departmentSchema);

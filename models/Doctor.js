// models/Doctor.js
const mongoose = require('mongoose');
const schemaOptions = require('../utils/schemaOptions');

const doctorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },               // DOC-01
    name: { type: String, required: [true, 'Doctor name is required'], trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    qualification: { type: String, required: [true, 'Qualification is required'] },
    specialization: { type: String, required: [true, 'Specialization is required'] },
    departmentId: { type: String, required: [true, 'Department is required'] }, // DEP-01
    experienceYears: { type: Number, default: 0 },
    consultationFee: { type: Number, required: [true, 'Consultation fee is required'] },
    availableDays: { type: [String], default: [] },                   // ['Mon', 'Wed', 'Fri']
    startTime: { type: String, default: '09:00' },                    // 'HH:mm'
    endTime: { type: String, default: '14:00' },
    slotMinutes: { type: Number, default: 20 },
    room: { type: String, default: '' },
    about: { type: String, default: '' },
    education: [{ degree: String, institute: String, year: Number, _id: false }],
    experience: [{ role: String, place: String, years: String, _id: false }],
    languages: { type: [String], default: [] },
    rating: { type: Number, default: 4.5 },
    phone: { type: String, default: '' },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    photo: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    acceptingAppointments: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  },
  schemaOptions
);

module.exports = mongoose.model('Doctor', doctorSchema);

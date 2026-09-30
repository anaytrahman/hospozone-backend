// models/Appointment.js
// Dates are stored as simple text 'yyyy-MM-dd' and times as 'HH:mm'.
// That keeps them exactly as the user picked them (no timezone surprises).
const mongoose = require('mongoose');
const schemaOptions = require('../utils/schemaOptions');

const appointmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },               // APT-20001
    code: { type: String },                                           // same as id (shown to users)
    patientId: { type: String, required: [true, 'Patient is required'] },
    doctorId: { type: String, required: [true, 'Doctor is required'] },
    departmentId: { type: String, required: [true, 'Department is required'] },
    date: { type: String, required: [true, 'Date is required'] },
    time: { type: String, required: [true, 'Time is required'] },
    type: { type: String, enum: ['New Consultation', 'Follow-up', 'Teleconsult', 'Procedure'], default: 'New Consultation' },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], default: 'Pending' },
    notes: String,
    bookedBy: { type: String, enum: ['patient', 'staff', 'online'], default: 'online' },
    createdAt: { type: Date, default: Date.now }
  },
  schemaOptions
);

module.exports = mongoose.model('Appointment', appointmentSchema);

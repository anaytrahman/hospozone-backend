// models/Notification.js
// "audience" decides who sees a notification:
//   { roles: ['admin','receptionist'] }  → everyone with those roles
//   { patientId: 'PAT-1001' }            → only that patient
//   { doctorId: 'DOC-01' }               → only that doctor
const mongoose = require('mongoose');
const schemaOptions = require('../utils/schemaOptions');

const notificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },               // N-1
    type: {
      type: String,
      enum: ['appointment_new', 'appointment_confirmed', 'appointment_cancelled', 'lab_ready', 'payment_received', 'prescription_created', 'system'],
      default: 'system'
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    audience: {
      roles: [String],
      patientId: String,
      doctorId: String
    },
    link: String,
    readBy: { type: [String], default: [] },                          // user ids who have read it
    createdAt: { type: Date, default: Date.now }
  },
  schemaOptions
);

module.exports = mongoose.model('Notification', notificationSchema);

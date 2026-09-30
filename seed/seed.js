// seed/seed.js
// ─────────────────────────────────────────────────────────────
// Fills the database with the same demo data the Angular app shows
// (22 patients, 14 doctors, 12 departments, 36 appointments …)
// and creates login accounts for everyone.
//
//   npm run seed
//
// ⚠️  It DELETES existing data in these collections first.
//
// The demo data was exported on "generatedOn". Every date is moved
// forward by the number of days since then, so the dashboard always
// has appointments "today", "upcoming", "last week", etc.
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const seed = require('./seed-data.json');

const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const LabReport = require('../models/LabReport');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Staff = require('../models/Staff');
const Notification = require('../models/Notification');
const Counter = require('../models/Counter');

// Demo passwords (shown on the login page of the Angular app)
const PASSWORDS = { admin: 'admin123', receptionist: 'reception123', doctor: 'doctor123', patient: 'patient123' };
const EMAIL_DOMAIN = seed.doctors[0].email.split('@')[1]; // e.g. hospozone.in

// ── Date shifting ────────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;
const shiftDays = Math.round((Date.now() - new Date(seed.generatedOn + 'T00:00:00Z').getTime()) / DAY_MS);
const DATE_FIELDS = ['date', 'visitDate', 'followUpDate', 'testDate', 'dueDate', 'joinedOn'];

function shiftDateString(value) {           // 'yyyy-MM-dd' → moved by shiftDays
  const date = new Date(value + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + shiftDays);
  return date.toISOString().slice(0, 10);
}

function shiftRecord(record) {
  const copy = { ...record };
  for (const field of DATE_FIELDS) {
    if (typeof copy[field] === 'string' && copy[field].length === 10) copy[field] = shiftDateString(copy[field]);
  }
  if (copy.createdAt) copy.createdAt = new Date(new Date(copy.createdAt).getTime() + shiftDays * DAY_MS);
  return copy;
}

const shiftAll = list => list.map(shiftRecord);

// Highest number used for a prefix, e.g. PAT-1022 → 1022 (so new ids continue after it)
function maxNumber(list) {
  return Math.max(0, ...list.map(item => parseInt(String(item.id).replace(/\D/g, ''), 10) || 0));
}

// ── Main ─────────────────────────────────────────────────────
async function run() {
  await connectDB();
  console.log(`Seeding… (dates shifted by ${shiftDays} day(s))`);

  // 1) Empty every collection
  const models = [User, Patient, Doctor, Department, Appointment, MedicalRecord, Prescription, LabReport, Invoice, Payment, Staff, Notification, Counter];
  for (const model of models) await model.deleteMany({});

  // 2) Insert the demo records
  await Department.insertMany(shiftAll(seed.departments));
  await Doctor.insertMany(shiftAll(seed.doctors));
  await Patient.insertMany(shiftAll(seed.patients));
  await Appointment.insertMany(shiftAll(seed.appointments));
  await MedicalRecord.insertMany(shiftAll(seed.medicalRecords));
  await Prescription.insertMany(shiftAll(seed.prescriptions));
  await LabReport.insertMany(shiftAll(seed.labReports));
  await Invoice.insertMany(shiftAll(seed.invoices));
  await Payment.insertMany(shiftAll(seed.payments));
  await Staff.insertMany(shiftAll(seed.staff));
  await Notification.insertMany(shiftAll(seed.notifications));

  // 3) Login accounts (passwords are hashed with bcrypt)
  const hash = password => bcrypt.hash(password, 10);
  const users = [
    { id: 'U-admin', name: 'Kunal Bhatia', email: `admin@${EMAIL_DOMAIN}`, passwordHash: await hash(PASSWORDS.admin), role: 'admin' },
    { id: 'U-receptionist', name: 'Ritika Sharma', email: `reception@${EMAIL_DOMAIN}`, passwordHash: await hash(PASSWORDS.receptionist), role: 'receptionist' }
  ];
  const doctorHash = await hash(PASSWORDS.doctor);
  for (const doctor of seed.doctors) {
    users.push({ id: 'U-' + doctor.id, name: doctor.name, email: doctor.email, passwordHash: doctorHash, role: 'doctor', refId: doctor.id, avatar: doctor.photo, isActive: doctor.status === 'Active' });
  }
  const patientHash = await hash(PASSWORDS.patient);
  for (const patient of seed.patients) {
    users.push({ id: 'U-' + patient.id, name: patient.name, email: patient.email, passwordHash: patientHash, role: 'patient', refId: patient.id, isActive: patient.status === 'Active' });
  }
  await User.insertMany(users);

  // 4) Id counters continue after the seeded ids
  const counters = [
    ['PAT', seed.patients], ['DOC', seed.doctors], ['DEP', seed.departments], ['APT', seed.appointments],
    ['MR', seed.medicalRecords], ['RX', seed.prescriptions], ['LAB', seed.labReports], ['INV', seed.invoices],
    ['PAY', seed.payments.filter(p => !String(p.id).endsWith('-R'))], ['STF', seed.staff], ['N', seed.notifications]
  ];
  for (const [prefix, list] of counters) {
    await Counter.create({ _id: prefix, seq: maxNumber(list) });
  }

  console.log(`✅ Seed complete: ${seed.patients.length} patients, ${seed.doctors.length} doctors, ${seed.appointments.length} appointments, ${users.length} user accounts`);
  console.log(`   Admin login: admin@${EMAIL_DOMAIN} / ${PASSWORDS.admin}`);
  await mongoose.disconnect();
}

run().catch(async error => {
  console.error('❌ Seed failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});

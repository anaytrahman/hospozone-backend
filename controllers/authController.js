// controllers/authController.js
// ─────────────────────────────────────────────────────────────
//   POST /api/auth/register  → new patient signs up
//   POST /api/auth/login     → any user logs in, gets a JWT
//   GET  /api/auth/me        → who am I? (used when the page is refreshed)
// ─────────────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const generateId = require('../utils/generateId');

const STAFF_ROLES = ['admin', 'doctor', 'receptionist'];

// Creates the login token. Only the user id and role go inside it — never the password.
function createToken(user) {
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });
  const { exp } = jwt.decode(token); // expiry time in seconds
  return { token, expiresAt: exp * 1000 };
}

// The shape the Angular app expects for the logged-in user
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, refId: user.refId, avatar: user.avatar };
}

// Patient / doctor accounts are blocked if their record was deactivated by the admin
async function linkedRecordIsActive(user) {
  if (user.role === 'patient') {
    const patient = await Patient.findOne({ id: user.refId });
    return patient && patient.status === 'Active';
  }
  if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ id: user.refId });
    return doctor && doctor.status === 'Active';
  }
  return true;
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, phone, password, gender, dob } = req.body;

    if (!name || !email || !phone || !password || !dob) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, date of birth and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const alreadyExists = await User.findOne({ email: cleanEmail });
    if (alreadyExists) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    // 1) the patient record (what admins see in Patient Management)
    const patient = await Patient.create({
      id: await generateId('PAT'),
      name, email: cleanEmail, phone, gender: gender || 'Other', dob
    });

    // 2) the login account linked to it
    const user = await User.create({
      id: 'U-' + patient.id,
      name: patient.name,
      email: cleanEmail,
      passwordHash: await bcrypt.hash(password, 10), // 10 = hashing strength
      role: 'patient',
      refId: patient.id
    });

    const { token, expiresAt } = createToken(user);
    res.status(201).json({ success: true, message: 'Account created successfully', data: { token, expiresAt, user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login   body: { email, password, portal: 'patient' | 'staff' }
async function login(req, res, next) {
  try {
    const { email, password, portal } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    // Same message for "no user" and "wrong password" so attackers can't guess emails
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Patients use the patient login page, staff use the staff login page
    if (portal === 'patient' && user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Please use the Admin / Staff login' });
    }
    if (portal === 'staff' && !STAFF_ROLES.includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Please use the Patient login' });
    }

    if (!user.isActive || !(await linkedRecordIsActive(user))) {
      return res.status(403).json({ success: false, message: 'This account is inactive. Please contact the front desk' });
    }

    const { token, expiresAt } = createToken(user);
    res.json({ success: true, message: 'Logged in successfully', data: { token, expiresAt, user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me  (protected)
async function getMe(req, res, next) {
  try {
    if (!(await linkedRecordIsActive(req.user))) {
      return res.status(401).json({ success: false, message: 'This account is inactive' });
    }
    res.json({ success: true, message: 'Current user', data: publicUser(req.user) });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, getMe };

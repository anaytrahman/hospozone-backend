// server.js
// ─────────────────────────────────────────────────────────────
// Entry point of the Hospozone API.
//   1. Load settings from .env
//   2. Connect to MongoDB Atlas
//   3. Create the Express app, add middleware and routes
//   4. Start listening on PORT
// ─────────────────────────────────────────────────────────────
require('dotenv').config(); // reads .env into process.env — must be the first line

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// ── Middleware ───────────────────────────────────────────────
// Allow the Angular app (another port/domain) to call this API
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:4200' }));
// Turn JSON request bodies into req.body objects
app.use(express.json());

// ── Health check (open http://localhost:5000/api/health in the browser) ──
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Hospozone API is running' });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/medical-records', require('./routes/medicalRecordRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/lab-reports', require('./routes/labReportRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ── Errors (must be registered AFTER the routes) ─────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Hospozone API listening on http://localhost:${PORT}`));
});

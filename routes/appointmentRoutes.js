// routes/appointmentRoutes.js
const express = require('express');
const {
  getAppointments, getAppointmentById, createAppointment, publicBooking, updateAppointment, deleteAppointment
} = require('../controllers/appointmentController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Public — visitors can book from the website without an account
// (must be declared BEFORE router.use(protect) below)
router.post('/public-booking', publicBooking);

router.use(protect); // everything below needs a login

router.get('/', getAppointments);        // filtered by role in the controller
router.get('/:id', getAppointmentById);
router.post('/', createAppointment);     // patients book for themselves, staff for anyone
router.put('/:id', updateAppointment);   // role rules are inside the controller
router.delete('/:id', allowRoles('admin'), deleteAppointment);

module.exports = router;

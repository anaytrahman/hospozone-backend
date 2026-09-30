// routes/authRoutes.js
const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register); // public
router.post('/login', login);       // public
router.get('/me', protect, getMe);  // needs a valid token

module.exports = router;

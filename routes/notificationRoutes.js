// routes/notificationRoutes.js
const express = require('express');
const { getNotifications, createNotification, markAsRead, deleteNotification } = require('../controllers/notificationController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', getNotifications);
router.post('/', createNotification);
router.put('/:id', markAsRead);
router.delete('/:id', allowRoles('admin'), deleteNotification);

module.exports = router;

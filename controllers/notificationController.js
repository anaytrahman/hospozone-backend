// controllers/notificationController.js
// ─────────────────────────────────────────────────────────────
//   GET    /api/notifications        only the ones meant for the logged-in user
//   POST   /api/notifications        create (any logged-in user — e.g. "new booking" alert)
//   PUT    /api/notifications/:id    mark as read by the logged-in user
//   DELETE /api/notifications/:id    admin
// ─────────────────────────────────────────────────────────────
const Notification = require('../models/Notification');
const generateId = require('../utils/generateId');
const { safeBody } = require('../utils/access');

// Is this notification meant for this user? (same rule as the Angular app)
function isForUser(notification, user) {
  const audience = notification.audience || {};
  if (user.role === 'patient') return audience.patientId === user.refId;
  if (user.role === 'doctor' && audience.doctorId === user.refId) return true;
  if (user.role === 'doctor' && audience.doctorId) return false;
  return (audience.roles || []).includes(user.role);
}

// GET /api/notifications
async function getNotifications(req, res, next) {
  try {
    const all = await Notification.find().sort({ createdAt: -1 }).limit(500);
    const mine = all.filter(notification => isForUser(notification, req.user));
    res.json({ success: true, message: 'Notifications fetched successfully', data: mine });
  } catch (error) {
    next(error);
  }
}

// POST /api/notifications
async function createNotification(req, res, next) {
  try {
    const data = safeBody(req.body);
    const notification = await Notification.create({ ...data, id: await generateId('N'), readBy: [] });
    res.status(201).json({ success: true, message: 'Notification created successfully', data: notification });
  } catch (error) {
    next(error);
  }
}

// PUT /api/notifications/:id  → adds the current user to "readBy"
async function markAsRead(req, res, next) {
  try {
    const notification = await Notification.findOne({ id: req.params.id });
    if (!notification || !isForUser(notification, req.user)) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    if (!notification.readBy.includes(req.user.id)) {
      notification.readBy.push(req.user.id);
      await notification.save();
    }
    res.json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/notifications/:id
async function deleteNotification(req, res, next) {
  try {
    const notification = await Notification.findOneAndDelete({ id: req.params.id });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted successfully', data: { id: notification.id } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getNotifications, createNotification, markAsRead, deleteNotification };

// utils/notify.js
// Creates a notification document. Used by controllers that run without a
// logged-in user (e.g. a visitor booking an appointment on the website).
const Notification = require('../models/Notification');
const generateId = require('./generateId');

async function notify(type, title, message, audience, link) {
  return Notification.create({ id: await generateId('N'), type, title, message, audience, link });
}

module.exports = notify;

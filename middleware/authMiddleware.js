// middleware/authMiddleware.js
// ─────────────────────────────────────────────────────────────
// Two small middleware functions used in the route files:
//
//   protect          → the request must carry a valid login token (JWT)
//   allowRoles(...)  → the logged-in user must have one of these roles
//
// Example in a route file:
//   router.post('/', protect, allowRoles('admin'), createDoctor);
// ─────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1) Is the user logged in?
async function protect(req, res, next) {
  try {
    // The Angular app sends:  Authorization: Bearer <token>
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Please log in to continue' });
    }

    // jwt.verify throws if the token was changed or has expired
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Load the user again from the database so deactivated users are blocked immediately
    const user = await User.findOne({ id: payload.userId });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account is not active' });
    }

    req.user = user; // controllers can now use req.user.role, req.user.refId …
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again' });
  }
}

// 2) Does the user have the right role?
function allowRoles(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to do this' });
    }
    next();
  };
}

module.exports = { protect, allowRoles };

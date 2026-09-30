// middleware/errorMiddleware.js
// ─────────────────────────────────────────────────────────────
// Every controller calls next(error) when something goes wrong.
// Express then jumps here, and we always answer with the same JSON shape:
//   { "success": false, "message": "..." }
// ─────────────────────────────────────────────────────────────

// 404 for URLs that don't match any route
function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler — Express recognises it because it has 4 parameters
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong';

  // Mongoose: a required field is missing or a value is invalid
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map(e => e.message).join(', ');
  }

  // MongoDB: a unique field (like email) already exists
  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue || {})[0] || 'value';
    message = `This ${field} is already in use`;
  }

  if (statusCode === 500) console.error('💥', error); // log unexpected errors for debugging

  res.status(statusCode).json({ success: false, message });
}

module.exports = { notFound, errorHandler };

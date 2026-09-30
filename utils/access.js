// utils/access.js
// ─────────────────────────────────────────────────────────────
// Helpers that answer "which records may this user see / change?"
// Keeping these rules in ONE file makes the controllers short and easy to read.
// ─────────────────────────────────────────────────────────────

/**
 * MongoDB filter that limits a list to the logged-in user's own records.
 *   patient → only records with their patientId
 *   doctor  → only records with their doctorId
 *   admin / receptionist → everything ({} = no filter)
 */
function ownerFilter(user) {
  if (user.role === 'patient') return { patientId: user.refId };
  if (user.role === 'doctor') return { doctorId: user.refId };
  return {};
}

/** true if the user may open this single record (same rule as ownerFilter) */
function canSee(user, record) {
  if (user.role === 'patient') return record.patientId === user.refId;
  if (user.role === 'doctor') return record.doctorId === user.refId;
  return true;
}

/**
 * Removes fields the client must never set directly (id, createdAt, Mongo _id).
 * Returns a NEW object — req.body itself is not changed.
 */
function safeBody(body) {
  const copy = { ...body };
  delete copy._id;
  delete copy.id;
  delete copy.createdAt;
  return copy;
}

/** Keeps only the listed fields, e.g. pick(req.body, ['status']) */
function pick(body, allowedFields) {
  const result = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) result[field] = body[field];
  }
  return result;
}

/** 'yyyy-MM-dd' for today (server time) */
function todayString() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = { ownerFilter, canSee, safeBody, pick, todayString };

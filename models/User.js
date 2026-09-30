// models/User.js
// ─────────────────────────────────────────────────────────────
// A login account. Every person who can sign in has one User.
//   role    → admin | doctor | receptionist | patient
//   refId   → links to the Patient or Doctor record (PAT-1001, DOC-01)
// The password is NEVER stored — only its bcrypt hash.
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const schemaOptions = require('../utils/schemaOptions');

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },            // e.g. 'U-PAT-1001', 'U-admin'
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'doctor', 'receptionist', 'patient'], required: true },
    refId: { type: String },                                          // PAT-xxxx / DOC-xx (empty for admin & receptionist)
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  },
  {
    ...schemaOptions,
    toJSON: {
      transform(doc, ret) {
        delete ret._id;
        delete ret.passwordHash; // never send the hash to the browser
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('User', userSchema);

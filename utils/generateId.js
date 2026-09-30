// utils/generateId.js
// ─────────────────────────────────────────────────────────────
// Creates the next readable id for a record type.
//
//   await generateId('PAT')  →  'PAT-1023'
//   await generateId('DOC')  →  'DOC-15'
//
// START and PAD below decide how the numbers look for each prefix.
// ─────────────────────────────────────────────────────────────
const Counter = require('../models/Counter');

const ID_RULES = {
  PAT: { start: 1000, pad: 0 },   // PAT-1001
  DOC: { start: 0, pad: 2 },      // DOC-01
  DEP: { start: 0, pad: 2 },      // DEP-01
  APT: { start: 20000, pad: 0 },  // APT-20001
  MR: { start: 5000, pad: 0 },    // MR-5001
  RX: { start: 7000, pad: 0 },    // RX-7001
  LAB: { start: 3000, pad: 0 },   // LAB-3001
  INV: { start: 9000, pad: 0 },   // INV-9001
  PAY: { start: 4000, pad: 0 },   // PAY-4001
  STF: { start: 600, pad: 0 },    // STF-601
  N: { start: 0, pad: 0 }         // N-1 (notifications)
};

async function generateId(prefix) {
  const rule = ID_RULES[prefix] || { start: 0, pad: 0 };

  // First time we see this prefix → create its counter at the start value
  const existing = await Counter.findById(prefix);
  if (!existing) {
    await Counter.create({ _id: prefix, seq: rule.start });
  }

  // Atomically add 1 and get the new value back
  const counter = await Counter.findByIdAndUpdate(prefix, { $inc: { seq: 1 } }, { new: true });

  const number = String(counter.seq).padStart(rule.pad, '0');
  return `${prefix}-${number}`;
}

module.exports = generateId;

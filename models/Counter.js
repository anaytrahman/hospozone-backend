// models/Counter.js
// Stores the last number used for each id prefix, e.g. { _id: 'PAT', seq: 1022 }
// Used by utils/generateId.js to create PAT-1023, PAT-1024 …
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // the prefix: 'PAT', 'DOC', 'APT' …
    seq: { type: Number, default: 0 }
  },
  { versionKey: false }
);

module.exports = mongoose.model('Counter', counterSchema);

// utils/schemaOptions.js
// ─────────────────────────────────────────────────────────────
// Options shared by every Mongoose schema.
//
// MongoDB gives every document a hidden "_id". Our Angular app uses readable
// ids instead (PAT-1001, DOC-01, APT-20001 …), stored in the "id" field.
// So when a document is turned into JSON for the API response we:
//   • remove "_id"  (the frontend never needs it)
//   • remove "__v"  (Mongoose's internal version counter)
// ─────────────────────────────────────────────────────────────
const schemaOptions = {
  versionKey: false,
  toJSON: {
    transform(doc, ret) {
      delete ret._id;
      return ret;
    }
  }
};

module.exports = schemaOptions;

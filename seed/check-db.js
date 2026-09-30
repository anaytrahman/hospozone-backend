// npm run check-db  — only tests the connection (does not change any data)
const mongoose = require('mongoose');
const connectDB = require('../config/db');

(async () => {
  await connectDB();
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`📚 Collections found: ${collections.length}${collections.length ? ' → ' + collections.map(c => c.name).join(', ') : ' (empty — run npm run seed)'}`);
  await mongoose.disconnect();
})();

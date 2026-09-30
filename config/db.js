// config/db.js
// ─────────────────────────────────────────────────────────────
// Connects Mongoose to MongoDB Atlas.
// The connection string comes from the .env file, so the password
// is never written inside our source code.
//
// Beginner-friendly extras:
//  • loads backend/.env even if you start node from another folder
//  • accepts MONGODB_URI (preferred) or MONGO_URI (common name)
//  • adds the database name "hospozone" if you forgot it
//  • prints a clear "what to do" hint for the usual Atlas errors
// ─────────────────────────────────────────────────────────────
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const DEFAULT_DB_NAME = 'hospozone';

// Returns a cleaned-up URI, or exits with a helpful message.
function readUri() {
  let uri = (process.env.MONGODB_URI || process.env.MONGO_URI || '').trim();
  uri = uri.replace(/^["']|["']$/g, ''); // remove accidental quotes

  if (!uri) {
    console.error('❌ MONGODB_URI is missing.');
    console.error('   → Open backend/.env, add  MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/hospozone?retryWrites=true&w=majority');
    console.error('   → Then SAVE the file (Ctrl+S).');
    process.exit(1);
  }

  if (uri.includes('<') || uri.includes('>')) {
    console.error('❌ Your MONGODB_URI still contains <placeholders> such as <username>, <password> or <cluster>.');
    console.error('   → Replace them with the real values and remove the < > brackets. Then save .env.');
    process.exit(1);
  }

  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    console.error('❌ MONGODB_URI must start with mongodb+srv:// or mongodb://');
    process.exit(1);
  }

  // Add the database name when the URI has none  (…mongodb.net/?x=y  or  …mongodb.net)
  const afterHost = uri.replace(/^mongodb(\+srv)?:\/\/[^/]+/, '');
  if (!/^\/[^/?]+/.test(afterHost)) {
    const [base, query] = uri.split('?');
    uri = base.replace(/\/$/, '') + '/' + DEFAULT_DB_NAME + (query ? '?' + query : '');
  }
  return uri;
}

// Turns a technical error into a simple instruction.
function explain(error) {
  const msg = String(error.message || '');
  const hint = [];

  if (/bad auth|Authentication failed/i.test(msg)) {
    hint.push('Username or password is wrong. Atlas → Database Access → Edit user → set a new password (letters + numbers only), then update MONGODB_URI.');
  } else if (/whitelist|IP|Could not connect to any servers|ReplicaSetNoPrimary|Server selection timed out/i.test(msg)) {
    hint.push('Atlas is blocking this computer (or the cluster is paused).');
    hint.push('1) Atlas → Security → Network Access → Add IP Address → "Allow access from anywhere" (0.0.0.0/0) → Confirm. Wait until the status is Active (1-2 min).');
    hint.push('2) Atlas → Database → if your cluster shows "Resume", click it (free clusters pause when unused).');
    hint.push('3) Turn OFF VPN / try another network (mobile hotspot). Some networks block port 27017.');
  } else if (/querySrv|ENOTFOUND|ECONNREFUSED.*_mongodb/i.test(msg)) {
    hint.push('Your network/DNS could not look up the Atlas address.');
    hint.push('Check the cluster host in MONGODB_URI, turn off VPN, or switch DNS to 8.8.8.8.');
    hint.push('Or use Atlas → Connect → Drivers → "Standard connection string" (starts with mongodb://) instead of mongodb+srv://.');
  }
  return hint;
}

async function connectDB() {
  const uri = readUri();

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000, // fail in 15s instead of hanging
      family: 4                        // use IPv4 — avoids a common Windows/ISP problem
    });
    console.log(`✅ MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    explain(error).forEach(line => console.error('   → ' + line));
    process.exit(1);
  }
}

module.exports = connectDB;

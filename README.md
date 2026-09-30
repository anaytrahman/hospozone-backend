# Hospozone API: Node.js + Express + MongoDB Atlas

This is a beginner-friendly REST API for the Hospozone Angular app. It uses plain JavaScript (CommonJS), `async/await`, and one controller per module. Every response has the same JSON shape.

```json
{ "success": true,  "message": "Patient created successfully", "data": { } }
{ "success": false, "message": "Patient not found" }
```

---

## 1. First-time setup

### a) Create a free MongoDB Atlas database
1. Go to https://www.mongodb.com/cloud/atlas and create a free **M0** cluster.
2. **Database Access** → *Add New Database User*. Pick a username and password.
3. **Network Access** → *Add IP Address* → *Allow access from anywhere* (`0.0.0.0/0`). This is fine for learning. Restrict it later.
4. **Connect** → *Drivers* → copy the connection string. It looks like this:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### b) Create your `.env`
```bash
cd backend
cp .env.example .env        # Windows (PowerShell): copy .env.example .env
```
Open `.env` and fill in the values:
- `MONGODB_URI`: your string, with the real password. Add the database name **`hospozone`** before the `?`:
  `mongodb+srv://anayt:MyPass123@cluster0.xxxxx.mongodb.net/hospozone?retryWrites=true&w=majority`
- `JWT_SECRET`: any long random text.

> `.env` is in `.gitignore`, so your password is never pushed to GitHub.

### c) Install, seed and run
```bash
npm install        # installs express, mongoose, dotenv, cors, bcryptjs, jsonwebtoken, nodemon
npm run seed       # fills Atlas with the demo data + login accounts (deletes old data first!)
npm run dev        # starts the API with auto-restart → http://localhost:5000
```
To check that it works, open http://localhost:5000/api/health. You should see `{"success":true,"message":"Hospozone API is running"}`.

### Demo logins (created by `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | admin@hospozone.in | admin123 |
| Receptionist | reception@hospozone.in | reception123 |
| Doctor | dr.arjun@hospozone.in (any doctor) | doctor123 |
| Patient | aarav.sharma@gmail.com (any patient) | patient123 |

---

## 2. Folder structure

```
backend/
├── server.js              ← starts Express, connects DB, registers routes
├── .env / .env.example    ← secrets & settings (never commit .env)
├── config/db.js           ← mongoose.connect(MONGODB_URI)
├── models/                ← Mongoose schemas = shape of each collection
├── controllers/           ← the actual logic (read/write database, build JSON response)
├── routes/                ← URL + HTTP method → controller, with auth checks
├── middleware/
│   ├── authMiddleware.js  ← protect (valid JWT?) and allowRoles('admin', …)
│   └── errorMiddleware.js ← one place that turns errors into { success:false, message }
├── utils/
│   ├── generateId.js      ← readable ids: PAT-1023, DOC-15, APT-20037 …
│   ├── access.js          ← "which records may this user see?" rules
│   ├── schemaOptions.js   ← hides Mongo's _id/__v in JSON
│   ├── notify.js          ← create a notification
└── seed/                  ← seed.js + seed-data.json (same dummy data as the Angular app)
```

**How a request flows:**
```
Angular service → HTTP → routes/patientRoutes.js → protect → allowRoles → controllers/patientController.js → models/Patient.js (Mongoose) → MongoDB Atlas
```

---

## 3. Important concepts (short version)

- **Express route**: `router.get('/', getPatients)` means "when someone calls GET /api/patients, run `getPatients`".
- **Middleware**: a function that runs *before* the controller. `protect` checks the login token. `allowRoles('admin')` checks the role. If a check fails, it answers with 401/403 and the controller never runs.
- **Mongoose model**: `Patient.find()`, `Patient.create()` and `Patient.findOneAndUpdate()` talk to the `patients` collection. The schema adds validation, e.g. `required: [true, 'Email is required']`.
- **Password hashing (bcrypt)**: we store `bcrypt.hash(password)`, never the password itself. At login, `bcrypt.compare()` checks it.
- **JWT**: after login the server signs a token `{ userId, role }` with `JWT_SECRET`. Angular sends it back on every request as `Authorization: Bearer <token>`. The server verifies it with `jwt.verify()`. It expires after `JWT_EXPIRES_IN` (8h).
- **Readable ids**: MongoDB still has its own `_id`, but the app uses `id` fields like `PAT-1001`. That keeps the Angular code simple, and relations are stored as these ids (`appointment.patientId = 'PAT-1001'`).
- **Dates** are stored as text `'yyyy-MM-dd'`. That avoids timezone bugs, and sorting as text still works.

---

## 4. API reference

🔓 = public · 🔒 = login required · roles are shown in brackets.

### Auth
| Method | URL | Who | Notes |
|---|---|---|---|
| POST | /api/auth/register | 🔓 | new patient → returns `{ token, expiresAt, user }` |
| POST | /api/auth/login | 🔓 | body `{ email, password, portal: 'patient' \| 'staff' }` |
| GET | /api/auth/me | 🔒 | current user (used after page refresh) |

### Main modules
| Resource | GET list / :id | POST | PUT :id | DELETE :id |
|---|---|---|---|---|
| /api/patients | 🔒 admin & receptionist: all · doctor: own patients · patient: self | admin, receptionist | staff; patient: own profile | admin (only if no history) |
| /api/doctors | 🔓 | admin | admin | admin (only if no appointments) |
| /api/departments | 🔓 | admin | admin | admin (only if no doctors) |
| /api/appointments | 🔒 patient: own · doctor: own · staff: all | 🔒 patient books for self, staff for anyone | staff; doctor: status/notes; patient: cancel only | admin |
| /api/appointments/public-booking | | 🔓 visitor booking (creates the patient if new) | | |
| /api/medical-records | 🔒 admin, doctor (own), patient (own) | admin, doctor | admin, doctor | admin, doctor |
| /api/prescriptions | same as medical records | admin, doctor | admin, doctor | admin, doctor |
| /api/lab-reports | same as medical records | admin, doctor | admin, doctor | admin, doctor |
| /api/invoices | 🔒 patient: own · doctor: own · admin/receptionist: all | admin, receptionist, doctor | staff; patient: pay own bill | admin |
| /api/payments | 🔒 admin, receptionist, patient (own) | admin, receptionist, patient (own bill) | — | — |
| /api/staff | 🔒 admin | admin | admin | admin |
| /api/notifications | 🔒 only yours | any logged-in user | mark as read | admin |

### Try it with curl
```bash
# login → copy "token" from the response
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
     -d '{"email":"admin@hospozone.in","password":"admin123","portal":"staff"}'

# use the token
curl http://localhost:5000/api/patients -H "Authorization: Bearer PASTE_TOKEN_HERE"
```

---

## 5. Adding a new module (the pattern)
1. `models/Thing.js`: the schema.
2. `controllers/thingController.js`: `getThings`, `createThing` … each with `try/catch` + `next(error)`.
3. `routes/thingRoutes.js`: map URLs to controllers, add `protect` / `allowRoles`.
4. `server.js`: `app.use('/api/things', require('./routes/thingRoutes'));`
5. Angular: give the service an API path, `super('things', 'THG', () => [], { path: '/things' })`.

## 6. Common problems
| Message | Fix |
|---|---|
| `MONGODB_URI is missing` | `.env` not created, or it's not inside `backend/` |
| `MongoDB connection failed: bad auth` | wrong username/password in the URI (special characters in the password must be URL-encoded) |
| `querySrv ENOTFOUND` / timeout | Atlas → Network Access → allow your IP |
| Angular shows *Cannot reach the server* | backend not running, or `apiUrl` in `src/environments/environment.development.ts` is wrong |
| CORS error in the browser | set `CLIENT_URL` in `.env` to the Angular URL (default `http://localhost:4200`) |

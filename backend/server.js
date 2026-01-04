const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcrypt');
require('dotenv').config();
const db = require('./db');
const fs = require('fs');

const app = express();

/* -------------------- CORS -------------------- */
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

/* -------------------- ROOT (optional but useful) -------------------- */
app.get('/', (req, res) => {
  res.json({
    service: 'ZgenAi Backend',
    status: 'running',
    endpoints: {
      health: '/health',
      listApplications: 'GET /applications',
      submitApplication: 'POST /applications'
    }
  });
});

/* -------------------- FILE UPLOAD SETUP -------------------- */
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

/* -------------------- GET APPLICATIONS -------------------- */
const getApplications = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM applications ORDER BY created_at DESC'
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('GET /applications DB ERROR:', err);
    res.status(500).json({
      error: 'Failed to fetch applications'
    });
  }
};

app.get('/applications', getApplications);
app.get('/api/applications', getApplications);

/* -------------------- POST APPLICATION -------------------- */
const submitApplication = async (req, res) => {
  const { fullName, email, phone, aboutMe, password } = req.body;
  const resumePath = req.file ? `/uploads/${req.file.filename}` : null;

  /* -------- Input Validation -------- */
  if (!fullName || !email || !phone) {
    return res.status(400).json({
      error: 'fullName, email, and phone are required'
    });
  }

  try {
    // If a password was provided with the application, create a user record
    if (password) {
      try {
        const hashed = await bcrypt.hash(password, 10);
        await db.query(
          `INSERT INTO users (email, password_hash, full_name, role)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) DO NOTHING;`,
          [email, hashed, fullName, 'student']
        );
      } catch (uerr) {
        console.error('User create error (non-fatal):', uerr.message || uerr);
        // proceed — user insertion failure should not block application submission
      }
    }

    const result = await db.query(
      `INSERT INTO applications
       (full_name, email, phone, about_me, resume_path)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [fullName, email, phone, aboutMe || null, resumePath]
    );

    res.status(201).json({
      message: 'Application submitted successfully',
      user: result.rows[0]
    });

  } catch (err) {
    console.error('POST /applications DB ERROR:', err);

    /* -------- Clear & Accurate Errors -------- */
    if (err.code === '23505') {
      // PostgreSQL unique constraint violation
      return res.status(409).json({
        error: 'Email already exists'
      });
    }

    if (err.code === '42P01') {
      return res.status(500).json({
        error: 'Database table not found'
      });
    }

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

app.post('/applications', upload.single('resume'), submitApplication);
app.post('/api/applications', upload.single('resume'), submitApplication);

/* -------------------- AUTH ENDPOINTS -------------------- */
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const userRes = await db.query('SELECT id, email, password_hash, full_name, role FROM users WHERE email=$1', [email]);
    if (userRes.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = userRes.rows[0];

    const stored = user.password_hash || '';
    let ok = false;
    if (stored.startsWith('$2')) {
      ok = await bcrypt.compare(password, stored);
    } else {
      // fallback to plaintext comparison for legacy accounts
      ok = password === stored;
    }

    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Return basic user info (no token for now)
    return res.json({ message: 'Login successful', user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });

  } catch (err) {
    console.error('/auth/login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* -------------------- HEALTH CHECK -------------------- */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

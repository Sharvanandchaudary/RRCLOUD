const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');
const fs = require('fs');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

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

/* -------------------- GET SINGLE APPLICATION BY EMAIL -------------------- */
app.get('/api/applications/:email', verifyToken, async (req, res) => {
  const { email } = req.params;
  
  try {
    const result = await db.query(
      'SELECT * FROM applications WHERE email = $1',
      [email]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /api/applications/:email error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* -------------------- UPDATE APPLICATION -------------------- */
app.put('/api/applications/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, about_me } = req.body;

  try {
    const result = await db.query(
      `UPDATE applications 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           about_me = COALESCE($3, about_me),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [full_name || null, phone || null, about_me || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/applications/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* -------------------- GENERATE ACCOUNT SETUP LINK -------------------- */
app.post('/api/applications/:id/generate-setup-link', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Fetch application
    const appResult = await db.query('SELECT * FROM applications WHERE id = $1', [id]);
    if (appResult.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = appResult.rows[0];

    // Mark as approved without creating account yet
    const updatedApp = await db.query(
      `UPDATE applications 
       SET is_approved = TRUE, 
           approved_date = CURRENT_TIMESTAMP,
           approved_by = $1,
           status = 'approved'
       WHERE id = $2
       RETURNING *`,
      ['admin@zgenai.com', id]
    );

    // Generate JWT token valid for 7 days for account setup
    const setupToken = jwt.sign(
      { 
        email: application.email, 
        fullName: application.full_name,
        applicationId: id,
        purpose: 'account_setup'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Setup link generated',
      setupToken: setupToken,
      email: application.email,
      fullName: application.full_name
    });

  } catch (err) {
    console.error('POST /api/applications/:id/generate-setup-link error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* -------------------- VERIFY SETUP TOKEN -------------------- */
app.post('/api/auth/verify-setup-token', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.purpose !== 'account_setup') {
      return res.status(400).json({ error: 'Invalid token purpose' });
    }

    res.json({
      valid: true,
      email: decoded.email,
      fullName: decoded.fullName,
      applicationId: decoded.applicationId
    });

  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

/* -------------------- CREATE ACCOUNT WITH SETUP TOKEN -------------------- */
app.post('/api/auth/create-account-from-token', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.purpose !== 'account_setup') {
      return res.status(400).json({ error: 'Invalid token purpose' });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Create user account
    await db.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
      [decoded.email, hashed, decoded.fullName, 'student']
    );

    res.json({
      message: 'Account created successfully',
      email: decoded.email
    });

  } catch (err) {
    console.error('POST /api/auth/create-account-from-token error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/* -------------------- APPROVE APPLICATION & CREATE STUDENT ACCOUNT -------------------- */
app.post('/api/applications/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { password, approvedBy } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    // Fetch application
    const appResult = await db.query('SELECT * FROM applications WHERE id = $1', [id]);
    if (appResult.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = appResult.rows[0];
    const hashed = await bcrypt.hash(password, 10);

    // Create user account
    try {
      await db.query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
        [application.email, hashed, application.full_name, 'student']
      );
    } catch (uerr) {
      console.error('User creation error:', uerr.message);
      return res.status(500).json({ error: 'Failed to create user account' });
    }

    // Update application as approved
    const updatedApp = await db.query(
      `UPDATE applications 
       SET is_approved = TRUE, 
           approved_date = CURRENT_TIMESTAMP,
           approved_by = $1,
           status = 'approved'
       WHERE id = $2
       RETURNING *`,
      [approvedBy || 'admin@rrcloud.com', id]
    );

    res.json({
      message: 'Student approved and account created',
      application: updatedApp.rows[0]
    });

  } catch (err) {
    console.error('POST /api/applications/:id/approve error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* -------------------- REJECT APPLICATION -------------------- */
app.post('/api/applications/:id/reject', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE applications 
       SET status = 'rejected'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({
      message: 'Application rejected',
      application: result.rows[0]
    });
  } catch (err) {
    console.error('POST /api/applications/:id/reject error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* -------------------- AUTH ENDPOINTS -------------------- */

// Simple middleware to verify Bearer JWT
function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

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

    // Sign JWT and return token + user info
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });

  } catch (err) {
    console.error('/auth/login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint to fetch current authenticated user
app.get('/auth/me', verifyToken, async (req, res) => {
  try {
    const id = req.user?.id;
    const userRes = await db.query('SELECT id, email, full_name, role FROM users WHERE id=$1', [id]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userRes.rows[0] });
  } catch (err) {
    console.error('/auth/me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint to change password
app.post('/auth/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new passwords are required' });
  }

  try {
    // Fetch current user
    const userRes = await db.query('SELECT id, password_hash FROM users WHERE id=$1', [userId]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });

    const user = userRes.rows[0];
    const stored = user.password_hash || '';

    // Verify current password
    let passwordMatch = false;
    if (stored.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(currentPassword, stored);
    } else {
      passwordMatch = currentPassword === stored;
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedNewPassword, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('/auth/change-password error:', err);
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

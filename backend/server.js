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

// Auto-initialize database on startup (v2)
async function ensureDatabase() {
  try {
    console.log('🗄️  Checking database schema...');
    
    // Check if users table exists
    const checkUsers = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (!checkUsers.rows[0].exists) {
      console.log('Creating users table...');
      await db.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'student',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Check if applications table exists
    const checkApps = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'applications'
      )
    `);
    
    if (!checkApps.rows[0].exists) {
      console.log('Creating applications table...');
      await db.query(`
        CREATE TABLE applications (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(50),
          about_me TEXT,
          resume_path VARCHAR(500),
          resume_filename VARCHAR(255),
          resume_data BYTEA,
          status VARCHAR(50) DEFAULT 'pending',
          is_approved BOOLEAN DEFAULT FALSE,
          approved_date TIMESTAMP,
          approved_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      // Add missing columns
      try {
        await db.query('ALTER TABLE applications ADD COLUMN resume_data BYTEA');
        console.log('✅ Added resume_data column');
      } catch (err) {
        if (err.code === '42701' || err.message.includes('already exists')) {
          console.log('✅ resume_data column already exists');
        } else {
          console.log('⚠️ Error adding resume_data:', err.message);
        }
      }
      try {
        await db.query('ALTER TABLE applications ADD COLUMN resume_filename VARCHAR(255)');
        console.log('✅ Added resume_filename column');
      } catch (err) {
        if (err.code === '42701' || err.message.includes('already exists')) {
          console.log('✅ resume_filename column already exists');
        } else {
          console.log('⚠️ Error adding resume_filename:', err.message);
        }
      }
      try {
        await db.query('ALTER TABLE applications ADD COLUMN is_approved BOOLEAN DEFAULT FALSE');
        console.log('✅ Added is_approved column');
      } catch (err) {
        if (err.code === '42701' || err.message.includes('already exists')) {
          console.log('✅ is_approved column already exists');
        } else {
          console.log('⚠️ Error adding is_approved:', err.message);
        }
      }
      try {
        await db.query('ALTER TABLE applications ADD COLUMN approved_date TIMESTAMP');
        console.log('✅ Added approved_date column');
      } catch (err) {
        if (err.code === '42701' || err.message.includes('already exists')) {
          console.log('✅ approved_date column already exists');
        } else {
          console.log('⚠️ Error adding approved_date:', err.message);
        }
      }
      try {
        await db.query('ALTER TABLE applications ADD COLUMN approved_by VARCHAR(255)');
        console.log('✅ Added approved_by column');
      } catch (err) {
        if (err.code === '42701' || err.message.includes('already exists')) {
          console.log('✅ approved_by column already exists');
        } else {
          console.log('⚠️ Error adding approved_by:', err.message);
        }
      }
    }
    
    // Check if admin exists
    const checkAdmin = await db.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@zgenai.com']
    );
    
    if (checkAdmin.rowCount === 0) {
      console.log('Creating admin user...');
      await db.query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)`,
        ['admin@zgenai.com', 'admin123', 'System Admin', 'admin']
      );
    }
    
    console.log('✅ Database schema is ready');
  } catch (err) {
    console.error('❌ Database setup error:', err.message);
    throw err;
  }
}

/* -------------------- HEALTH CHECK -------------------- */
app.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: err.message
    });
  }
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
    console.log('GET /applications called');
    const result = await db.query(
      `SELECT * FROM applications ORDER BY created_at DESC`
    );
    console.log('Applications found:', result.rowCount);
    
    // Add is_approved field to each application if missing
    const applications = result.rows.map(app => ({
      ...app,
      is_approved: app.is_approved || false
    }));
    
    res.status(200).json(applications);
  } catch (err) {
    console.error('GET /applications DB ERROR:', err);
    console.error('Error code:', err.code);
    res.status(500).json({
      error: 'Failed to fetch applications',
      details: err.message
    });
  }
};

app.get('/applications', getApplications);
app.get('/api/applications', getApplications);

/* -------------------- POST APPLICATION -------------------- */
const submitApplication = async (req, res) => {
  const { fullName, email, phone, aboutMe, password } = req.body;
  let resumePath = null;
  let resumeFilename = null;
  let resumeData = null;

  // Convert resume file to base64 for storage in database
  if (req.file) {
    resumeFilename = req.file.originalname;
    resumeData = req.file.buffer;
    // Also keep path format for compatibility
    resumePath = `/api/applications/resume/${email}`;
  }

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
       (full_name, email, phone, about_me, resume_path, resume_filename, resume_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [fullName, email, phone, aboutMe || null, resumePath, resumeFilename, resumeData]
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

/* -------------------- GET RESUME -------------------- */
app.get('/api/applications/resume/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await db.query(
      'SELECT resume_data, resume_filename FROM applications WHERE email = $1',
      [email]
    );

    if (result.rowCount === 0 || !result.rows[0].resume_data) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const { resume_data, resume_filename } = result.rows[0];
    
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${resume_filename}"`);
    res.send(resume_data);

  } catch (err) {
    console.error('GET /resume error:', err);
    res.status(500).json({ error: 'Failed to retrieve resume' });
  }
});

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

    // Prepare email message (will be used by admin to manually send)
    const emailContent = {
      to: application.email,
      subject: '🎉 Congratulations! Your Application Has Been Approved',
      html: `
        <h2>Welcome to RRCloud, ${application.full_name}!</h2>
        <p>We're excited to inform you that your application has been approved!</p>
        <p><strong>Your login credentials:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${application.email}</li>
          <li><strong>Password:</strong> ${password}</li>
          <li><strong>Login URL:</strong> https://rrcloud-frontend-nsmgws4u4a-uc.a.run.app/student-login</li>
        </ul>
        <p><strong>Important:</strong> Please keep these credentials safe and change your password after first login.</p>
        <p>You are now enrolled in our program. Log in to view your dashboard and details.</p>
        <br>
        <p>Best regards,<br>RRCloud Team</p>
      `
    };

    console.log(`📧 [EMAIL SHOULD BE SENT] To: ${application.email}`);
    console.log(`   Subject: ${emailContent.subject}`);
    console.log(`   Credentials: ${application.email} / ${password}`);

    res.json({
      message: 'Student approved and account created',
      application: updatedApp.rows[0],
      emailContent: emailContent,
      note: 'Email content generated. In production, this would be sent via email service.'
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

/* -------------------- RESET ADMIN (TEMPORARY - FOR SETUP ONLY) -------------------- */
app.post('/api/admin/reset-credentials', async (req, res) => {
  // This endpoint should be removed in production
  // It's only for emergency credential reset
  try {
    console.log('Reset admin credentials called');
    const email = 'admin@zgenai.com';
    const password = 'admin123'; // Plaintext for legacy fallback
    
    // Delete existing admin
    console.log('Deleting existing admin...');
    await db.query('DELETE FROM users WHERE email = $1', [email]);
    
    // Insert new admin
    console.log('Inserting new admin...');
    const result = await db.query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, password, 'System Admin', 'admin']
    );

    console.log('Admin reset successful:', result.rows[0]);

    res.json({ 
      message: 'Admin credentials reset successfully',
      email: email,
      password: password,
      user: result.rows[0]
    });

  } catch (err) {
    console.error('Admin reset error:', err.message);
    res.status(500).json({ 
      error: 'Failed to reset admin credentials',
      details: err.message
    });
  }
});

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 5001;// Backend v2.3 - Fixed deployment
// Initialize database tables on startup
const initDB = async () => {
  try {
    console.log('🗄️  Initializing database tables...');
    
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create applications table
    await db.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        about_me TEXT,
        resume_path VARCHAR(500),
        status VARCHAR(50) DEFAULT 'pending',
        is_approved BOOLEAN DEFAULT FALSE,
        approved_date TIMESTAMP,
        approved_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default admin
    await db.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ('admin@zgenai.com', 'admin123', 'System Admin', 'admin')
       ON CONFLICT (email) DO NOTHING`
    );
    
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  }
};

// Initialize before starting server
// v2.2 - Force backend rebuild with defaults
ensureDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

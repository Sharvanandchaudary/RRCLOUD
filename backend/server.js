const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();
const db = require('./db');
const fs = require('fs');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

/* -------------------- GOOGLE CLOUD STORAGE CONFIGURATION -------------------- */
let storage, bucket;
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'rrcloud-resumes-bucket';

try {
  storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID || 'rrcloud-platform'
  });
  bucket = storage.bucket(BUCKET_NAME);
  console.log(`✅ Google Cloud Storage initialized - Bucket: ${BUCKET_NAME}`);
} catch (error) {
  console.log('⚠️ Google Cloud Storage not available, using local storage fallback:', error.message);
}

/* -------------------- EMAIL CONFIGURATION -------------------- */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER || 'admin@zgenai.org',
    pass: process.env.SMTP_PASSWORD || 'default_app_password'
  }
});

// Verify email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.warn('WARNING: Email service not configured:', error.message);
    console.log('    Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD environment variables');
  } else {
    console.log('INFO: Email service ready');
  }
});

/* -------------------- CORS -------------------- */
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Dedicated file download route with Cloud Storage and database fallback
app.get('/uploads/:filename', async (req, res) => {
  const filename = req.params.filename;
  
  console.log(`File download request: ${filename}`);
  
  // First, try Cloud Storage
  if (bucket) {
    try {
      const file = bucket.file(`resumes/${filename}`);
      const [exists] = await file.exists();
      
      if (exists) {
        console.log(`Serving from Cloud Storage: ${filename}`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${decodeURIComponent(filename)}"`);
        
        const stream = file.createReadStream();
        return stream.pipe(res);
      }
    } catch (gcsError) {
      console.log(`Cloud Storage error: ${gcsError.message}`);
    }
  }
  
  // Second, try local filesystem
  const filePath = `./uploads/${filename}`;
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`Serving from filesystem: ${stats.size} bytes`);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${decodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', stats.size);
    
    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(res);
  }
  
  // Third, try database fallback
  try {
    console.log(`File not found in filesystem, checking database...`);
    const dbResult = await db.query(
      'SELECT resume_data, resume_filename FROM applications WHERE resume_path LIKE $1 OR resume_filename = $2',
      [`%${filename}%`, filename]
    );
    
    if (dbResult.rows.length > 0 && dbResult.rows[0].resume_data) {
      const resumeData = dbResult.rows[0].resume_data;
      const originalFilename = dbResult.rows[0].resume_filename || filename;
      
      console.log(`Serving from database: ${resumeData.length} bytes`);
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${decodeURIComponent(originalFilename)}"`);
      res.setHeader('Content-Length', resumeData.length);
      
      return res.send(resumeData);
    }
    
    console.log(`File not found in database either`);
    return res.status(404).json({ 
      error: 'Resume not found',
      message: 'Resume file is not available. This may happen if the file was uploaded before our latest system update.',
      suggestion: 'Please contact the applicant to resubmit their resume if needed.'
    });
    
  } catch (dbError) {
    console.error('Database error while fetching file:', dbError);
    return res.status(500).json({ error: 'Failed to retrieve file from database' });
  }
});

// Handle old API format resume downloads
app.get('/api/applications/resume/:email', async (req, res) => {
  const email = req.params.email;
  
  console.log(`Resume request for email: ${email}`);
  
  try {
    const dbResult = await db.query(
      'SELECT resume_data, resume_filename, full_name FROM applications WHERE email = $1',
      [email]
    );
    
    if (dbResult.rows.length > 0 && dbResult.rows[0].resume_data) {
      const resumeData = dbResult.rows[0].resume_data;
      const originalFilename = dbResult.rows[0].resume_filename || `resume_${dbResult.rows[0].full_name}.pdf`;
      
      console.log(`✅ Serving resume from database: ${resumeData.length} bytes`);
      
      // Set proper headers for file download
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}"`);
      res.setHeader('Content-Length', resumeData.length);
      res.setHeader('Cache-Control', 'no-cache');
      
      return res.send(resumeData);
    }
    
    console.log(`❌ No resume found for ${email}`);
    return res.status(404).json({ 
      error: 'Resume not found',
      message: 'Resume file is not available. This may happen if the file was uploaded before our latest system update.',
      suggestion: 'Please contact the applicant to resubmit their resume if needed.'
    });
    
  } catch (dbError) {
    console.error('Database error while fetching resume:', dbError);
    return res.status(500).json({ error: 'Failed to retrieve resume from database' });
  }
});

// Debug endpoint to check resume data availability
app.get('/api/debug/resume-data', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, resume_path, resume_filename, LENGTH(resume_data) as data_size FROM applications WHERE resume_path IS NOT NULL ORDER BY id DESC LIMIT 10'
    );
    
    const resumeInfo = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      resume_path: row.resume_path,
      filename: row.resume_filename,
      has_data: row.data_size > 0,
      data_size_bytes: row.data_size || 0
    }));
    
    res.json({
      message: 'Resume data status',
      total_with_paths: result.rows.length,
      resumes: resumeInfo
    });
  } catch (error) {
    console.error('Error checking resume data:', error);
    res.status(500).json({ error: 'Failed to check resume data' });
  }
});

// Debug endpoint to list uploaded files
app.get('/api/debug/uploads', (req, res) => {
  try {
    if (!fs.existsSync('./uploads')) {
      return res.json({ message: 'Uploads directory does not exist', files: [] });
    }
    
    const files = fs.readdirSync('./uploads');
    const fileDetails = files.map(file => {
      const stats = fs.statSync(`./uploads/${file}`);
      return {
        name: file,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    });
    
    res.json({
      message: 'Files in uploads directory',
      count: files.length,
      files: fileDetails,
      note: 'Cloud Run containers are stateless. Files uploaded before the latest deployment may not be available.',
      troubleshooting: {
        resumeIssues: 'If resume downloads fail, files were likely uploaded before recent system updates',
        solution: 'Ask applicants to resubmit resumes, or implement Cloud Storage for persistence'
      }
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Auto-initialize database on startup (v2)
async function ensureDatabase() {
  try {
    console.log('INFO: Checking database schema...');
    
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

    // Create test student user
    const checkStudent = await db.query(
      'SELECT * FROM users WHERE email = $1',
      ['user1@example.com']
    );
    
    if (checkStudent.rowCount === 0) {
      console.log('Creating test student user...');
      await db.query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)`,
        ['user1@example.com', 'password', 'Student User', 'student']
      );
    }

    // Create test recruiter user
    const checkRecruiter = await db.query(
      'SELECT * FROM users WHERE email = $1',
      ['user2@example.com']
    );
    
    if (checkRecruiter.rowCount === 0) {
      console.log('Creating test recruiter user...');
      await db.query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)`,
        ['user2@example.com', 'password', 'Recruiter User', 'recruiter']
      );
    }

    // Create test admin user
    const checkTestAdmin = await db.query(
      'SELECT * FROM users WHERE email = $1',
      ['user3@example.com']
    );
    
    if (checkTestAdmin.rowCount === 0) {
      console.log('Creating test admin user...');
      await db.query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)`,
        ['user3@example.com', 'password', 'Admin User', 'admin']
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

// Custom storage that saves to both local and Cloud Storage
const customStorage = multer.memoryStorage(); // Store in memory first

const upload = multer({ 
  storage: customStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper function to upload file to Cloud Storage
async function uploadToCloudStorage(buffer, filename, originalname) {
  if (!bucket) {
    console.log('Cloud Storage not available, skipping upload');
    return null;
  }
  
  try {
    const file = bucket.file(`resumes/${filename}`);
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/octet-stream',
        metadata: {
          originalName: originalname
        }
      }
    });
    
    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => {
        console.log(`✅ Uploaded ${filename} to Cloud Storage`);
        resolve(`resumes/${filename}`);
      });
      stream.end(buffer);
    });
  } catch (error) {
    console.log(`⚠️ Cloud Storage upload failed: ${error.message}`);
    return null;
  }
}

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
  let cloudStoragePath = null;

  // Handle resume file upload
  if (req.file) {
    resumeFilename = req.file.originalname;
    resumeData = req.file.buffer;
    
    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${req.file.originalname}`;
    
    // Upload to Cloud Storage
    try {
      cloudStoragePath = await uploadToCloudStorage(req.file.buffer, uniqueFilename, req.file.originalname);
      if (cloudStoragePath) {
        resumePath = `/uploads/${uniqueFilename}`;
        console.log(`✅ Resume uploaded to Cloud Storage: ${uniqueFilename}`);
      } else {
        // Fallback to local storage path format
        resumePath = `/api/applications/resume/${email}`;
        console.log(`⚠️ Using database fallback for: ${email}`);
      }
    } catch (uploadError) {
      console.log(`⚠️ Cloud Storage upload failed: ${uploadError.message}`);
      resumePath = `/api/applications/resume/${email}`;
    }
    
    // Also save to local storage as backup (will be lost on deployment but useful for development)
    try {
      const localPath = `./uploads/${uniqueFilename}`;
      fs.writeFileSync(localPath, req.file.buffer);
      console.log(`✅ Resume also saved locally: ${uniqueFilename}`);
    } catch (localError) {
      console.log(`⚠️ Local storage backup failed: ${localError.message}`);
    }
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
       [approvedBy || 'admin@zgenai.org', id]
    );

    // Prepare email content
    const emailContent = {
      from: 'admin@zgenai.org',
      to: application.email,
      subject: 'Welcome to ZgenAI - Account Activation',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e3a8a; font-size: 28px; margin: 0; font-weight: 700;">Welcome to ZgenAI</h1>
              <div style="height: 3px; background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%); width: 100px; margin: 15px auto;"></div>
            </div>
            
            <p style="color: #374151; line-height: 1.7; font-size: 16px;">Dear ${application.full_name},</p>
            
            <p style="color: #374151; line-height: 1.7; font-size: 16px;">Congratulations! We are excited to inform you that your application has been approved and you are now part of the ZgenAI family.</p>
            
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #1e40af;">
              <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 18px;">About ZgenAI</h3>
              <p style="color: #4b5563; line-height: 1.6; margin: 0; font-size: 14px;">ZgenAI is a leading technology company focused on artificial intelligence and machine learning solutions. We empower businesses and individuals with cutting-edge AI technologies, innovative training programs, and comprehensive development resources. Join our community of innovators and shape the future of AI.</p>
            </div>
            
            <h3 style="color: #1e3a8a; margin: 25px 0 15px 0; font-size: 18px;">Your Account Details</h3>
            <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #1e3a8a;">Login Email:</strong> ${application.email}</p>
              <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #1e3a8a;">Temporary Password:</strong> ${password}</p>
              <p style="margin: 8px 0; color: #374151; font-size: 15px;"><strong style="color: #1e3a8a;">Portal Access:</strong> <a href="https://rrcloud-frontend-415414350152.us-central1.run.app/student-login" style="color: #1e40af; text-decoration: none; font-weight: 600;">Click here to login</a></p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
              <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">🔐 Important Security Steps</h4>
              <ol style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Login with the temporary credentials above</li>
                <li>You will be prompted to create a new secure password</li>
                <li>Keep your login credentials confidential</li>
                <li>Contact support if you face any issues</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 1px solid #e2e8f0;">
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">Welcome to the future of AI innovation</p>
              <p style="color: #374151; font-weight: 600; margin: 10px 0;">ZgenAI Administration Team</p>
              <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      `,
      text: `Welcome to ZgenAI - Account Activation

Dear ${application.full_name},

Congratulations! We are excited to inform you that your application has been approved and you are now part of the ZgenAI family.

About ZgenAI:
ZgenAI is a leading technology company focused on artificial intelligence and machine learning solutions. We empower businesses and individuals with cutting-edge AI technologies, innovative training programs, and comprehensive development resources.

Your Account Details:
Login Email: ${application.email}
Temporary Password: ${password}
Portal Access: https://rrcloud-frontend-415414350152.us-central1.run.app/student-login

Important Security Steps:
1. Login with the temporary credentials above
2. You will be prompted to create a new secure password
3. Keep your login credentials confidential
4. Contact support if you face any issues

Welcome to the future of AI innovation!

Best regards,
ZgenAI Administration Team`
    };

    // Send email
    try {
      await transporter.sendMail(emailContent);
      console.log(`INFO: Email sent to: ${application.email}`);
    } catch (emailErr) {
      console.warn(`WARNING: Email failed to send to ${application.email}:`, emailErr.message);
      console.log('   Email will need to be sent manually or service needs configuration');
    }

    res.json({
      message: 'Student approved and account created',
      application: updatedApp.rows[0],
      emailContent: emailContent,
      emailSent: true,
      note: 'Email has been sent to the student'
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
  const { email, password, role } = req.body;
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

    // Role-based access control
    if (role && user.role !== role) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: `Your account does not have ${role} permissions. You are registered as: ${user.role}` 
      });
    }

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

/* -------------------- USER MANAGEMENT ENDPOINTS -------------------- */

// Get all users (Admin only)
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Try with all columns first, fall back if columns don't exist
    let result;
    try {
      result = await db.query(`
        SELECT id, email, full_name, role, 
               COALESCE(status, 'active') as status,
               phone, created_at
        FROM users 
        ORDER BY created_at DESC
      `);
    } catch (err) {
      // Fallback for databases without phone/status columns
      console.log('Falling back to basic user query (missing columns)');
      result = await db.query(`
        SELECT id, email, full_name, role, created_at,
               'active' as status, null as phone
        FROM users 
        ORDER BY created_at DESC
      `);
    }

    res.json({ users: result.rows });
  } catch (err) {
    console.error('/api/users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (Admin only)
app.post('/api/users', verifyToken, async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, email, phone, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user with default password
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    let result;
    try {
      // Try with all columns
      result = await db.query(
        `INSERT INTO users (email, password_hash, full_name, role, phone, status) 
         VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
        [email, hashedPassword, name, role, phone || null]
      );
    } catch (err) {
      // Fallback for databases without phone/status columns
      console.log('Falling back to basic user creation (missing columns)');
      result = await db.query(
        `INSERT INTO users (email, password_hash, full_name, role) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [email, hashedPassword, name, role]
      );
    }

    // Send welcome email with credentials
    try {
      const dashboardUrl = role === 'admin' ? '/admin' : 
                          role === 'recruiter' ? '/recruiter-dashboard' :
                          role === 'trainer' ? '/trainer-dashboard' : '/student-dashboard';

      const mailOptions = {
        from: process.env.SMTP_USER || 'admin@zgenai.org',
        to: email,
        subject: '🎉 Welcome to ZgenAI - Your Account is Ready!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px;">
            <h1 style="text-align: center; margin-bottom: 30px;">🚀 Welcome to ZgenAI!</h1>
            
            <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 10px; margin: 20px 0;">
              <h2>👤 Your Account Details</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            </div>

            <div style="background: rgba(255,255,255,0.15); padding: 25px; border-radius: 10px; margin: 20px 0;">
              <h2>🔐 Login Credentials</h2>
              <p><strong>Login URL:</strong> <a href="https://rrcloud-frontend-nsmgws4u4a-uc.a.run.app/login" style="color: #FFD700;">ZgenAI Login</a></p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> password123</p>
              <p><strong>Your Dashboard:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard</p>
            </div>

            <div style="background: rgba(255,193,7,0.2); padding: 20px; border-radius: 10px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <h3>⚠️ Important Security Notice</h3>
              <p>Please change your password after your first login for security purposes.</p>
              <p>Your account has been created by the ZgenAI admin team.</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://rrcloud-frontend-nsmgws4u4a-uc.a.run.app/login" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">🚀 Login to ZgenAI</a>
            </div>

            <p style="text-align: center; margin-top: 30px; font-size: 12px; opacity: 0.8;">
              This email was sent by the ZgenAI Admin Team<br>
              If you have any questions, please contact support.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
    } catch (emailErr) {
      console.error('Error sending welcome email:', emailErr);
      // Don't fail the request if email fails
    }

    res.json({ 
      message: 'User created successfully and welcome email sent',
      user: result.rows[0] 
    });
  } catch (err) {
    console.error('/api/users POST error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send credentials email (Admin only)
app.post('/api/users/send-credentials', verifyToken, async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { email, name, role, password } = req.body;
    if (!email || !name || !role) {
      return res.status(400).json({ error: 'Email, name, and role are required' });
    }

    const dashboardUrl = role === 'admin' ? '/admin' : 
                        role === 'recruiter' ? '/recruiter-dashboard' :
                        role === 'trainer' ? '/trainer-dashboard' : '/student-dashboard';

    const mailOptions = {
      from: process.env.SMTP_USER || 'admin@zgenai.org',
      to: email,
      subject: '🎉 ZgenAI Account - Login Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px;">
          <h1 style="text-align: center; margin-bottom: 30px;">🔐 Your ZgenAI Login Credentials</h1>
          
          <div style="background: rgba(255,255,255,0.1); padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h2>👤 Account Information</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
          </div>

          <div style="background: rgba(255,255,255,0.15); padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h2>🚀 Login Details</h2>
            <p><strong>Login URL:</strong> <a href="https://rrcloud-frontend-nsmgws4u4a-uc.a.run.app/login" style="color: #FFD700;">ZgenAI Platform</a></p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password || 'password123'}</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://rrcloud-frontend-nsmgws4u4a-uc.a.run.app/login" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Login Now</a>
          </div>

          <p style="text-align: center; margin-top: 30px; font-size: 12px; opacity: 0.8;">
            Sent by ZgenAI Admin Team
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ 
      message: 'Credentials email sent successfully',
      recipient: email 
    });
  } catch (err) {
    console.error('/api/users/send-credentials error:', err);
    res.status(500).json({ error: 'Failed to send credentials email' });
  }
});

// Block/Unblock user (Admin only)
app.put('/api/users/:id/block', verifyToken, async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { blocked } = req.body;

    const status = blocked ? 'blocked' : 'active';
    
    const result = await db.query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`,
      user: result.rows[0] 
    });
  } catch (err) {
    console.error('/api/users/:id/block error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Admin only)
app.delete('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'User deleted successfully',
      user: result.rows[0] 
    });
  } catch (err) {
    console.error('/api/users/:id DELETE error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send rating email (Admin only)
app.post('/api/users/send-rating-email', verifyToken, async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userIds, message } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    // Get users to email
    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
    const users = await db.query(
      `SELECT email, full_name, phone FROM users WHERE id IN (${placeholders})`,
      userIds
    );

    if (users.rowCount === 0) {
      return res.status(404).json({ error: 'No users found' });
    }

    // Send emails
    const emailPromises = users.rows.map(user => {
      const mailOptions = {
        from: process.env.SMTP_USER || 'admin@zgenai.org',
        to: user.email,
        subject: 'ZgenAI - Account Rating Request',
        html: `
          <h2>Dear ${user.full_name},</h2>
          <p>We hope this email finds you well.</p>
          <p>${message || 'We would like to request you to rate your experience with our platform.'}</p>
          <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
            <p><strong>Your Details:</strong></p>
            <p>Name: ${user.full_name}</p>
            <p>Email: ${user.email}</p>
            <p>Phone: ${user.phone || 'Not provided'}</p>
          </div>
          <p>Please take a moment to provide your feedback.</p>
          <p>Best regards,<br>ZgenAI Team</p>
        `
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);

    res.json({ 
      message: `Rating emails sent successfully to ${users.rowCount} users`,
      recipients: users.rows.length 
    });
  } catch (err) {
    console.error('/api/users/send-rating-email error:', err);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

// Delete application (Admin only)
app.delete('/api/applications/:id', verifyToken, async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM applications WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ 
      message: 'Application deleted successfully',
      application: result.rows[0] 
    });
  } catch (err) {
    console.error('/api/applications/:id DELETE error:', err);
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
const PORT = process.env.PORT || 8080;
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
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'student',
        status VARCHAR(50) DEFAULT 'active',
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

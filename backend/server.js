const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const db = require('./db');
const app = express();

// Configure CORS for production and development
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- THE FIX: HANDLE BOTH URL PATHS ---

// 1. Handle Admin Dashboard (GET)
const getApplications = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM applications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
// Listen on BOTH paths
app.get('/api/applications', getApplications);
app.get('/applications', getApplications);

// 2. Handle Student Apply (POST)
const submitApplication = async (req, res) => {
  const { fullName, email, phone, aboutMe } = req.body;
  const resumePath = req.file ? '/uploads/' + req.file.filename : null;

  try {
    const result = await db.query(
      'INSERT INTO applications (full_name, email, phone, about_me, resume_path) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [fullName, email, phone, aboutMe, resumePath]
    );
    res.status(201).json({ message: "Application submitted!", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit. Email might be duplicate." });
  }
};
// Listen on BOTH paths
app.post('/api/applications', upload.single('resume'), submitApplication);
app.post('/applications', upload.single('resume'), submitApplication);

// Health check endpoint for GCP
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  const fs = require('fs');
  if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
});

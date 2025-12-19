const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const app = express();

// In-memory storage for local testing (no database needed)
let applications = [
  {
    id: 1,
    full_name: "John Doe",
    email: "john@example.com",
    phone: "1234567890",
    about_me: "Sample application for testing",
    resume_path: null,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    full_name: "Jane Smith",
    email: "jane@example.com",
    phone: "0987654321",
    about_me: "Another test application",
    resume_path: null,
    created_at: new Date().toISOString()
  }
];
let nextId = 3;

// Configure CORS
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

// Get all applications
const getApplications = async (req, res) => {
  try {
    console.log(`📋 Fetching ${applications.length} applications`);
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
app.get('/api/applications', getApplications);
app.get('/applications', getApplications);

// Submit new application
const submitApplication = async (req, res) => {
  const { fullName, email, phone, aboutMe } = req.body;
  const resumePath = req.file ? '/uploads/' + req.file.filename : null;

  try {
    // Check for duplicate email
    const existing = applications.find(app => app.email === email);
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const newApplication = {
      id: nextId++,
      full_name: fullName,
      email: email,
      phone: phone,
      about_me: aboutMe,
      resume_path: resumePath,
      created_at: new Date().toISOString()
    };
    
    applications.push(newApplication);
    console.log(`✅ New application from ${fullName} (${email})`);
    
    res.status(201).json({ message: "Application submitted!", user: newApplication });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit application." });
  }
};
app.post('/api/applications', upload.single('resume'), submitApplication);
app.post('/applications', upload.single('resume'), submitApplication);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'in-memory',
    applications: applications.length
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api/applications`);
  console.log(`🗄️  Mode: In-Memory Storage (${applications.length} sample applications)`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
  const fs = require('fs');
  if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
});

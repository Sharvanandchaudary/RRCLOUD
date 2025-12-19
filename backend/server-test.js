const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();

// Configure CORS
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check endpoint (no database needed)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Backend is running! (Test mode - no database)'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Mock applications endpoint for frontend testing
app.get('/api/applications', (req, res) => {
  res.json([
    { id: 1, full_name: 'Test User', email: 'test@example.com', phone: '1234567890', about_me: 'Test application', created_at: new Date() }
  ]);
});

app.post('/api/applications', (req, res) => {
  const { fullName, email, phone, aboutMe } = req.body;
  res.status(201).json({ 
    message: "Application submitted! (Test mode - not saved to database)", 
    data: { fullName, email, phone, aboutMe }
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ TEST SERVER running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`\n⚠️  Running in TEST MODE - No database connection required\n`);
});

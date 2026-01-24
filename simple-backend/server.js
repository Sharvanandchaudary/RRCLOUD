const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Mock data for demonstration
const mockUsers = [
  { id: 1, full_name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', role: 'student', status: 'active', created_at: '2024-01-15T10:30:00Z' },
  { id: 2, full_name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321', role: 'recruiter', status: 'active', created_at: '2024-01-16T11:00:00Z' },
  { id: 3, full_name: 'Bob Wilson', email: 'bob@example.com', phone: '555-123-4567', role: 'trainer', status: 'blocked', created_at: '2024-01-17T09:15:00Z' },
  { id: 4, full_name: 'Admin User', email: 'admin@zgenai.com', phone: '111-222-3333', role: 'admin', status: 'active', created_at: '2024-01-01T00:00:00Z' },
  { id: 5, full_name: 'Sarah Johnson', email: 'sarah@example.com', phone: '777-888-9999', role: 'student', status: 'active', created_at: '2024-01-18T14:20:00Z' },
  { id: 6, full_name: 'Mike Davis', email: 'mike@example.com', phone: '333-444-5555', role: 'recruiter', status: 'active', created_at: '2024-01-19T16:45:00Z' }
];

const mockApplications = [
  {
    id: 1,
    full_name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '+1-555-0201',
    about_me: 'Passionate about AI and machine learning with 3 years of experience in Python and TensorFlow.',
    resume_path: '/uploads/alice_resume.pdf',
    is_approved: false,
    status: 'APPLIED',
    created_at: '2024-01-20T10:00:00Z'
  },
  {
    id: 2,
    full_name: 'Bob Smith',
    email: 'bob@example.com',
    phone: '+1-555-0202',
    about_me: 'Data science enthusiast with strong background in statistics and machine learning algorithms.',
    resume_path: '/uploads/bob_resume.pdf',
    is_approved: true,
    status: 'APPROVED',
    approved_date: '2024-01-22T15:30:00Z',
    created_at: '2024-01-19T14:30:00Z'
  },
  {
    id: 3,
    full_name: 'Charlie Davis',
    email: 'charlie@example.com',
    phone: '+1-555-0203',
    about_me: 'Full stack developer transitioning to AI with experience in React, Node.js, and Python.',
    resume_path: '/uploads/charlie_resume.pdf',
    is_approved: false,
    status: 'REJECTED',
    created_at: '2024-01-18T09:15:00Z'
  },
  {
    id: 4,
    full_name: 'Emma Wilson',
    email: 'emma@example.com',
    phone: '+1-555-0204',
    about_me: 'Recent computer science graduate interested in deep learning and neural networks.',
    resume_path: '/uploads/emma_resume.pdf',
    is_approved: false,
    status: 'APPLIED',
    created_at: '2024-01-21T11:30:00Z'
  },
  {
    id: 5,
    full_name: 'Alex Rodriguez',
    email: 'alex@example.com',
    phone: '+1-555-0205',
    about_me: 'Data analyst with 2 years experience looking to advance into AI and machine learning roles.',
    resume_path: '/uploads/alex_resume.pdf',
    is_approved: true,
    status: 'APPROVED',
    approved_date: '2024-01-23T09:45:00Z',
    created_at: '2024-01-20T08:20:00Z'
  },
  {
    id: 6,
    full_name: 'Lisa Chen',
    email: 'lisa@example.com',
    phone: '+1-555-0206',
    about_me: 'Software engineer with expertise in cloud computing wanting to specialize in AI solutions.',
    resume_path: '/uploads/lisa_resume.pdf',
    is_approved: false,
    status: 'APPLIED',
    created_at: '2024-01-22T16:10:00Z'
  },
  {
    id: 7,
    full_name: 'Tom Anderson',
    email: 'tom@example.com',
    phone: '+1-555-0207',
    about_me: 'Mathematics PhD student with strong analytical skills and programming experience in R and Python.',
    resume_path: '/uploads/tom_resume.pdf',
    is_approved: true,
    status: 'APPROVED',
    approved_date: '2024-01-23T14:20:00Z',
    created_at: '2024-01-21T13:45:00Z'
  },
  {
    id: 8,
    full_name: 'Maria Garcia',
    email: 'maria@example.com',
    phone: '+1-555-0208',
    about_me: 'Business analyst transitioning to data science with MBA and coding bootcamp experience.',
    resume_path: null,
    is_approved: false,
    status: 'APPLIED',
    created_at: '2024-01-23T10:30:00Z'
  }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', users: mockUsers.length });
});

// Admin login
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@zgenai.com' && password === 'admin123') {
    res.json({ 
      token: 'mock-admin-token', 
      user: { email, role: 'admin' },
      message: 'Login successful' 
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Get users (for admin dashboard)
app.get('/api/users', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer mock-admin-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({ users: mockUsers, total: mockUsers.length });
});

// Get applications
app.get('/applications', (req, res) => {
  res.json(mockApplications);
});

// Create user
app.post('/api/users', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer mock-admin-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { name, email, phone, role } = req.body;
  const newUser = {
    id: mockUsers.length + 1,
    full_name: name,
    email,
    phone,
    role,
    status: 'active',
    created_at: new Date().toISOString()
  };
  
  mockUsers.push(newUser);
  res.json({ message: 'User created successfully', user: newUser });
});

// Send credentials endpoint
app.post('/api/users/send-credentials', (req, res) => {
  const { email, name, role, password } = req.body;
  console.log(`Mock: Sending credentials to ${email}`, { name, role });
  res.json({ message: 'Credentials sent successfully' });
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer mock-admin-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const userId = parseInt(req.params.id);
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  mockUsers.splice(userIndex, 1);
  res.json({ message: 'User deleted successfully' });
});

// Delete application
app.delete('/api/applications/:id', (req, res) => {
  const appId = parseInt(req.params.id);
  const appIndex = mockApplications.findIndex(a => a.id === appId);
  
  if (appIndex === -1) {
    return res.status(404).json({ message: 'Application not found' });
  }
  
  mockApplications.splice(appIndex, 1);
  res.json({ message: 'Application deleted successfully' });
});

// Approve application
app.post('/api/applications/:id/approve', (req, res) => {
  const appId = parseInt(req.params.id);
  const { password, approvedBy } = req.body;
  
  const application = mockApplications.find(a => a.id === appId);
  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }
  
  application.is_approved = true;
  application.status = 'APPROVED';
  application.approved_date = new Date().toISOString();
  
  res.json({ 
    message: 'Application approved successfully', 
    application 
  });
});

// Reject application
app.post('/api/applications/:id/reject', (req, res) => {
  const appId = parseInt(req.params.id);
  
  const application = mockApplications.find(a => a.id === appId);
  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }
  
  application.is_approved = false;
  application.status = 'REJECTED';
  
  res.json({ 
    message: 'Application rejected successfully', 
    application 
  });
});

// Block/Unblock user
app.put('/api/users/:id/block', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer mock-admin-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const userId = parseInt(req.params.id);
  const { blocked } = req.body;
  const user = mockUsers.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  user.status = blocked ? 'blocked' : 'active';
  res.json({ message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`, user });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple backend server running on port ${PORT}`);
  console.log(`✅ Admin dashboard available at http://localhost:${PORT}/admin-dashboard`);
  console.log(`✅ Mock users loaded: ${mockUsers.length}`);
  console.log(`✅ Mock applications loaded: ${mockApplications.length}`);
});
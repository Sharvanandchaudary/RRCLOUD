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
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', role: 'student', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321', role: 'recruiter', status: 'active' },
  { id: 3, name: 'Bob Wilson', email: 'bob@example.com', phone: '555-123-4567', role: 'trainer', status: 'blocked' },
  { id: 4, name: 'Admin User', email: 'admin@zgenai.com', phone: '111-222-3333', role: 'admin', status: 'active' }
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

// Create user
app.post('/api/users', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer mock-admin-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { name, email, phone, role } = req.body;
  const newUser = {
    id: mockUsers.length + 1,
    name,
    email,
    phone,
    role,
    status: 'active'
  };
  
  mockUsers.push(newUser);
  res.json({ message: 'User created successfully', user: newUser });
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

// Block/Unblock user
app.put('/api/users/:id/status', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer mock-admin-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const userId = parseInt(req.params.id);
  const user = mockUsers.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  user.status = user.status === 'active' ? 'blocked' : 'active';
  res.json({ message: `User ${user.status === 'active' ? 'unblocked' : 'blocked'} successfully`, user });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple backend server running on port ${PORT}`);
  console.log(`✅ Admin dashboard available at http://localhost:${PORT}/admin-dashboard`);
  console.log(`✅ Mock users loaded: ${mockUsers.length}`);
});
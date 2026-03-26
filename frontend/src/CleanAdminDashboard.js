import React, { useState, useEffect } from 'react';

export default function CleanAdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState('applications'); // applications, users
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: 'student' });
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({ student_id: '', trainer_id: '', recruiter_id: '' });
  const [assignments, setAssignments] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApps, setSelectedApps] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [testEmail, setTestEmail] = useState('');
  
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (currentView === 'applications') {
        loadApplications();
      } else if (currentView === 'users') {
        loadUsers();
        loadTrainersAndRecruiters();
      } else if (currentView === 'assignments') {
        loadAssignments();
        loadUsers();
        loadTrainersAndRecruiters();
      }
    }
  }, [isAuthenticated, currentView]);

  const checkAuthentication = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    const userDataString = localStorage.getItem('auth_user') || localStorage.getItem('user');
    const directEmail = localStorage.getItem('userEmail');
    
    let userData = null;
    try {
      if (userDataString) {
        userData = JSON.parse(userDataString);
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
    
    const adminEmail = userData?.email || directEmail;
    const userRole = userData?.role;
    
    console.log('🔐 Auth Check:', { 
      hasToken: !!token, 
      adminEmail, 
      userRole,
      userData,
      tokenPreview: token ? token.substring(0, 20) + '...' : null 
    });
    
    if (token && adminEmail && userRole === 'admin') {
      setAuthToken(token);
      setIsAuthenticated(true);
    } else if (!token) {
      setError('Please login with your admin credentials first');
    } else if (!adminEmail) {
      setError('Admin email not found. Please login again.');
    } else if (userRole !== 'admin') {
      setError('Admin role required. Please login as admin.');
    } else {
      setError('Please login as admin first');
    }
  };

  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      const res = await fetch(`${backendUrl}/api/applications`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      console.error('Error loading applications:', err);
      setError('Failed to load applications: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, skipping user load');
      return;
    }
    
    try {
      setLoading(true);
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      const url = `${backendUrl}/api/users`;
      
      console.log('🔄 Loading users from:', url);
      console.log('🔑 Using headers:', getAuthHeaders());
      
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      
      console.log('📡 Users API Response:', res.status, res.statusText);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Users loaded:', data);
        setUsers(data.users || data || []);
        setError(''); // Clear any previous errors
      } else {
        const errorText = await res.text();
        console.error('❌ Failed to load users:', res.status, errorText);
        setError(`Failed to fetch users: HTTP ${res.status}: Unauthorized. Please check your admin login.`);
      }
    } catch (err) {
      console.error('💥 Error loading users:', err);
      setError('Network error loading users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTrainersAndRecruiters = async () => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      console.log('🔄 Loading users for assignment dropdowns...');
      const res = await fetch(`${backendUrl}/api/users`, {
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        const allUsers = data.users || data || [];
        console.log('📊 Total users loaded:', allUsers.length);
        
        const studentsList = allUsers.filter(user => user.role === 'student');
        const trainersList = allUsers.filter(user => user.role === 'trainer');
        const recruitersList = allUsers.filter(user => user.role === 'recruiter');
        
        console.log('👨‍🎓 Students:', studentsList.length);
        console.log('👨‍🏫 Trainers:', trainersList.length);
        console.log('💼 Recruiters:', recruitersList.length);
        
        setStudents(studentsList);
        setTrainers(trainersList);
        setRecruiters(recruitersList);
      } else {
        console.error('❌ Failed to load users for dropdowns:', res.status);
      }
    } catch (err) {
      console.error('❌ Error loading trainers/recruiters:', err);
    }
  };

  const loadAssignments = async () => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      const res = await fetch(`${backendUrl}/api/assignments`, {
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        setAssignments(data || []);
      } else {
        console.log('Assignments endpoint not available yet');
        setAssignments([]);
      }
    } catch (err) {
      console.log('Error loading assignments:', err);
      setAssignments([]);
    }
  };

  const testEmailService = async () => {
    if (!testEmail) {
      alert('Please enter an email address to test');
      return;
    }

    try {
      setLoading(true);
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      const res = await fetch(`${backendUrl}/api/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          email: testEmail,
          subject: 'Email Service Test - ZgenAI Admin',
          message: 'This is a test email to verify that the SMTP configuration is working properly. If you received this, email service is operational!'
        })
      });
      
      const result = await res.json();
      
      if (result.success) {
        alert(`✅ Test email sent successfully to ${testEmail}!\\n\\nSMTP Config:\\nHost: ${result.smtpConfig.host}\\nUser: ${result.smtpConfig.user}\\nHas Password: ${result.smtpConfig.hasPassword}`);
      } else {
        alert(`❌ Test email failed: ${result.error}\\n\\nSMTP Config:\\nHost: ${result.smtpConfig.host}\\nUser: ${result.smtpConfig.user}\\nHas Password: ${result.smtpConfig.hasPassword}`);
      }
    } catch (err) {
      alert('Error testing email: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.role) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      const res = await fetch(`${backendUrl}/api/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userForm)
      });

      if (res.ok) {
        const result = await res.json();
        console.log('✅ User created:', result);
        setShowUserModal(false);
        setUserForm({ name: '', email: '', phone: '', role: 'student' });
        await loadUsers(); // Reload users list
        alert('User created successfully!');
      } else {
        const errorText = await res.text();
        setError(`Failed to create user: HTTP ${res.status}: ${errorText}`);
      }
    } catch (err) {
      console.error('💥 Error creating user:', err);
      setError('Network error creating user: ' + err.message);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      const res = await fetch(`${backendUrl}/api/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        await loadUsers();
        await loadTrainersAndRecruiters(); // Refresh the dropdowns
        alert('User deleted successfully!');
      } else {
        const errorText = await res.text();
        setError(`Failed to delete user: ${errorText}`);
      }
    } catch (err) {
      setError('Error deleting user: ' + err.message);
    }
  };

  const createAssignment = async () => {
    if (!assignmentForm.student_id || (!assignmentForm.trainer_id && !assignmentForm.recruiter_id)) {
      setError('Please select a student and at least one trainer or recruiter');
      return;
    }

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      
      // Create assignments array - one for trainer, one for recruiter
      const assignments = [];
      
      if (assignmentForm.trainer_id) {
        assignments.push({
          student_id: assignmentForm.student_id,
          assigned_user_id: assignmentForm.trainer_id,
          assigned_user_role: 'trainer'
        });
      }
      
      if (assignmentForm.recruiter_id) {
        assignments.push({
          student_id: assignmentForm.student_id,
          assigned_user_id: assignmentForm.recruiter_id,
          assigned_user_role: 'recruiter'
        });
      }
      
      // Send each assignment
      const results = [];
      for (const assignment of assignments) {
        const res = await fetch(`${backendUrl}/api/assignments`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(assignment)
        });

        if (res.ok) {
          const result = await res.json();
          results.push(result);
          console.log('✅ Assignment created:', result);
        } else {
          const errorText = await res.text();
          throw new Error(`Failed to create assignment: HTTP ${res.status}: ${errorText}`);
        }
      }
      
      setShowAssignmentModal(false);
      setAssignmentForm({ student_id: '', trainer_id: '', recruiter_id: '' });
      await loadAssignments();
      alert(`${results.length} assignment(s) created successfully!`);
    } catch (err) {
      console.error('💥 Error creating assignment:', err);
      setError('Network error creating assignment: ' + err.message);
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      const res = await fetch(`${backendUrl}/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        await loadAssignments();
        alert('Assignment deleted successfully!');
      } else {
        const errorText = await res.text();
        setError(`Failed to delete assignment: ${errorText}`);
      }
    } catch (err) {
      setError('Error deleting assignment: ' + err.message);
    }
  };

  const approveApplication = async (appId) => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      const res = await fetch(`${backendUrl}/api/applications/${appId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        await loadApplications();
        setShowModal(false);
        setPassword('');
        setSelectedApp(null);
        alert('Application approved and email sent!');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to approve application');
      }
    } catch (err) {
      setError('Error approving application: ' + err.message);
    }
  };

  const bulkApproveApplications = async () => {
    if (selectedApps.length === 0) {
      setError('Please select applications to approve');
      return;
    }
    if (!password) {
      setError('Please enter a password for bulk approval');
      return;
    }

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      const promises = selectedApps.map(appId => 
        fetch(`${backendUrl}/api/applications/${appId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        })
      );
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.ok).length;
      
      await loadApplications();
      setSelectedApps([]);
      setShowBulkActions(false);
      setPassword('');
      alert(`${successful} applications approved successfully!`);
    } catch (err) {
      setError('Error in bulk approval: ' + err.message);
    }
  };

  const deleteApplication = async (appId) => {
    if (!window.confirm('Are you sure you want to delete this application? This cannot be undone.')) {
      return;
    }

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      const res = await fetch(`${backendUrl}/api/applications/${appId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        await loadApplications();
        alert('Application deleted successfully!');
      } else {
        const errorText = await res.text();
        setError(`Failed to delete application: ${errorText}`);
      }
    } catch (err) {
      setError('Error deleting application: ' + err.message);
    }
  };

  const toggleAppSelection = (appId) => {
    setSelectedApps(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  };

  const toggleAllApps = () => {
    const pendingApps = filteredApplications.filter(app => app.status !== 'approved');
    setSelectedApps(selectedApps.length === pendingApps.length ? [] : pendingApps.map(app => app.id));
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery === '' || 
      app.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';
    
    if (sortBy === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Access Required</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">Please login with admin credentials to access this dashboard.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Enhanced Professional Header */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-4xl">👑</div>
                  <h1 className="text-4xl font-extrabold" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                  }}>Corporate Admin Dashboard</h1>
                </div>
                <div className="flex items-center gap-2 ml-16">
                  <span className="px-4 py-1.5 rounded-full text-xs font-bold" style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}>ENTERPRISE ADMIN • FULL CONTROL ACCESS</span>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
                }}
              >
                🚪 Logout
              </button>
            </div>
            
            {/* Enhanced Navigation */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setCurrentView('applications')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  currentView === 'applications'
                    ? 'text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
                style={currentView === 'applications' ? {
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
                } : {}}
              >
                📝 Applications <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">{applications.length}</span>
              </button>
              <button
                onClick={() => setCurrentView('users')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  currentView === 'users'
                    ? 'text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
                style={currentView === 'users' ? {
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                } : {}}
              >
                👥 User Management <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">{users.length}</span>
              </button>
              <button
                onClick={() => setCurrentView('assignments')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  currentView === 'assignments'
                    ? 'text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
                style={currentView === 'assignments' ? {
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
                } : {}}
              >
                🔗 Assignments <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">{assignments.length}</span>
              </button>
              <button
                onClick={() => setCurrentView('email-test')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  currentView === 'email-test'
                    ? 'text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
                style={currentView === 'email-test' ? {
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)'
                } : {}}
              >
                📧 Test Email
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mx-8 mb-8 p-4 rounded-xl border-2 border-red-300" style={{
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
            }}>
              <div className="flex items-center justify-between">
                <span className="text-red-700 font-semibold">{error}</span>
                <button onClick={() => setError('')} className="text-red-700 font-bold text-xl hover:scale-110 transition-transform">×</button>
              </div>
            </div>
          )}
          
          {/* Enhanced Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-8 pb-8">
            <div className="rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 cursor-pointer" style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)'
            }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-6xl opacity-20">📝</div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-white bg-opacity-20 text-white">
                  {applications.filter(a => a.is_approved).length} approved
                </div>
              </div>
              <p className="text-white text-sm font-semibold mb-2 opacity-90">TOTAL APPLICATIONS</p>
              <p className="text-white text-5xl font-extrabold">{applications.length}</p>
            </div>
            
            <div className="rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 cursor-pointer" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
            }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-6xl opacity-20">👥</div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-white bg-opacity-20 text-white">
                  Active
                </div>
              </div>
              <p className="text-white text-sm font-semibold mb-2 opacity-90">TOTAL USERS</p>
              <p className="text-white text-5xl font-extrabold">{users.length}</p>
              <p className="text-white text-xs mt-3 opacity-80">
                {users.filter(u => u.role === 'student').length} students • {users.filter(u => u.role === 'trainer').length} trainers • {users.filter(u => u.role === 'recruiter').length} recruiters
              </p>
            </div>
            
            <div className="rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 cursor-pointer" style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
            }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-6xl opacity-20">🔗</div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-white bg-opacity-20 text-white">
                  Mapped
                </div>
              </div>
              <p className="text-white text-sm font-semibold mb-2 opacity-90">ACTIVE ASSIGNMENTS</p>
              <p className="text-white text-5xl font-extrabold">{assignments.length}</p>
              <p className="text-white text-xs mt-3 opacity-80">Student-Mentor mappings</p>
            </div>
            
            <div className="rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 cursor-pointer" style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)'
            }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-6xl opacity-20">⏳</div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-white bg-opacity-20 text-white">
                  Awaiting
                </div>
              </div>
              <p className="text-white text-sm font-semibold mb-2 opacity-90">PENDING REVIEW</p>
              <p className="text-white text-5xl font-extrabold">{applications.filter(a => !a.is_approved).length}</p>
              <p className="text-white text-xs mt-3 opacity-80">Needs approval</p>
            </div>
          </div>
        </div>

        {/* Enhanced Applications View */}
        {currentView === 'applications' && (
          <div className="rounded-2xl overflow-hidden" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold" style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>Applications Management</h2>
                  <p className="text-gray-600 mt-1">Manage and review student applications</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <input
                  type="text"
                  placeholder="🔍 Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                  style={{ minWidth: '250px' }}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                >
                  <option value="all">📋 All Status</option>
                  <option value="APPLIED">📝 Applied</option>
                  <option value="approved">✅ Approved</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                >
                  <option value="created_at">📅 Sort by Date</option>
                  <option value="full_name">👤 Sort by Name</option>
                  <option value="status">📊 Sort by Status</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
                {selectedApps.length > 0 && (
                  <button
                    onClick={() => setShowBulkActions(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Bulk Actions ({selectedApps.length})
                  </button>
                )}
              </div>
            </div>

            {loading && <div className="text-center py-4">Loading applications...</div>}

            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedApps.length === filteredApplications.filter(app => app.status !== 'approved').length && filteredApplications.filter(app => app.status !== 'approved').length > 0}
                        onChange={toggleAllApps}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Applied</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        {app.status !== 'approved' ? (
                          <input
                            type="checkbox"
                            checked={selectedApps.includes(app.id)}
                            onChange={() => toggleAppSelection(app.id)}
                            className="rounded"
                          />
                        ) : (
                          <span className="text-green-500">✓</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">{app.full_name}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <a href={`mailto:${app.email}`} className="text-blue-600 hover:underline">
                          {app.email}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <a href={`tel:${app.phone}`} className="text-blue-600 hover:underline">
                          {app.phone}
                        </a>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          app.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex gap-2">
                          {app.status !== 'approved' && (
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setShowModal(true);
                              }}
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm font-medium"
                              title="Approve and create student account"
                            >
                              ✓ Approve
                            </button>
                          )}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`Name: ${app.full_name}\nEmail: ${app.email}\nPhone: ${app.phone}\nStatus: ${app.status}\nApplied: ${new Date(app.created_at).toLocaleDateString()}`);
                              alert('Application details copied to clipboard!');
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                            title="Copy application details"
                          >
                            📋 Copy
                          </button>
                          <button
                            onClick={() => deleteApplication(app.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                            title="Delete application permanently"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredApplications.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📝</div>
                  <div className="text-gray-500 text-lg">No applications found matching your criteria.</div>
                  <div className="text-gray-400 text-sm mt-2">Try adjusting your search or filters.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users View */}
        {currentView === 'users' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="trainer">Trainers</option>
                  <option value="recruiter">Recruiters</option>
                </select>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + Create User
                </button>
              </div>
            </div>

            {loading && <div className="text-center py-4">Loading users...</div>}

            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">{user.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline">
                          {user.email}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {user.phone ? (
                          <a href={`tel:${user.phone}`} className="text-blue-600 hover:underline">
                            {user.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'trainer' 
                            ? 'bg-blue-100 text-blue-800'
                            : user.role === 'recruiter'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`Name: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone || 'N/A'}\nRole: ${user.role}\nCreated: ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}`);
                              alert('User details copied to clipboard!');
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                            title="Copy user details"
                          >
                            📋 Copy
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                              title="Delete user permanently"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assignments View */}
        {currentView === 'assignments' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">User Assignments</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Connect students with trainers and recruiters • {assignments.length} assignments
                </p>
              </div>
              <div className="flex gap-3">
                <div className="text-sm bg-gray-50 px-3 py-2 rounded-lg">
                  👨‍🎓 {students.length} Students • 👨‍🏫 {trainers.length} Trainers • 💼 {recruiters.length} Recruiters
                </div>
                <button
                  onClick={() => {
                    setShowAssignmentModal(true);
                    loadTrainersAndRecruiters(); // Reload data when opening modal
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  + Create Assignment
                </button>
              </div>
            </div>

            {loading && <div className="text-center py-4">Loading assignments...</div>}

            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Trainer</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Recruiter</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm">
                        <div className="font-medium text-gray-900">{assignment.student_name}</div>
                        <div className="text-gray-500 text-xs">{assignment.student_email}</div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {assignment.trainer_name ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{assignment.trainer_name}</div>
                              <div className="text-gray-500 text-xs">{assignment.trainer_email}</div>
                            </div>
                            {assignment.trainer_assignment_id && (
                              <button
                                onClick={() => deleteAssignment(assignment.trainer_assignment_id)}
                                className="ml-2 text-red-600 hover:text-red-800"
                                title="Remove trainer"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {assignment.recruiter_name ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{assignment.recruiter_name}</div>
                              <div className="text-gray-500 text-xs">{assignment.recruiter_email}</div>
                            </div>
                            {assignment.recruiter_assignment_id && (
                              <button
                                onClick={() => deleteAssignment(assignment.recruiter_assignment_id)}
                                className="ml-2 text-red-600 hover:text-red-800"
                                title="Remove recruiter"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete ALL assignments for this student?')) {
                              if (assignment.trainer_assignment_id) await deleteAssignment(assignment.trainer_assignment_id);
                              if (assignment.recruiter_assignment_id) await deleteAssignment(assignment.recruiter_assignment_id);
                            }
                          }}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                          title="Delete all assignments for this student"
                        >
                          🗑️ Delete All
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {assignments.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔗</div>
                  <div className="text-gray-500 text-lg">No assignments found.</div>
                  <div className="text-gray-400 text-sm mt-2">Create assignments to connect students with trainers and recruiters.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approval Modal */}
        {showModal && selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">
                Approve Application - {selectedApp.full_name}
              </h3>
              <p className="text-gray-600 mb-4">
                This will create a student account and send login credentials to {selectedApp.email}
              </p>
              <input
                type="password"
                placeholder="Enter temporary password for student"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => approveApplication(selectedApp.id)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                  disabled={!password}
                >
                  Approve & Send Credentials
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setPassword('');
                    setSelectedApp(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Create New User</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="student">Student</option>
                  <option value="trainer">Trainer</option>
                  <option value="recruiter">Recruiter</option>
                </select>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={createUser}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                  disabled={!userForm.name || !userForm.email || !userForm.role}
                >
                  Create User
                </button>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setUserForm({ name: '', email: '', phone: '', role: 'student' });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Modal */}
        {showBulkActions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">
                Bulk Actions - {selectedApps.length} Applications Selected
              </h3>
              <p className="text-gray-600 mb-4">
                This will approve all selected applications and create student accounts with the same password.
              </p>
              <input
                type="password"
                placeholder="Enter password for all new students"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={bulkApproveApplications}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                  disabled={!password}
                >
                  Bulk Approve ({selectedApps.length})
                </button>
                <button
                  onClick={() => {
                    setShowBulkActions(false);
                    setPassword('');
                    setSelectedApps([]);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Assignment Modal */}
        {showAssignmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
              <h3 className="text-xl font-bold mb-6 text-center">🔗 Create User Assignment</h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                {/* Students Column */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 flex items-center">
                    👨‍🎓 Select Student *
                    <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">({students.length})</span>
                  </h4>
                  <select
                    value={assignmentForm.student_id}
                    onChange={(e) => {
                      const studentId = e.target.value;
                      const student = students.find(s => s.id.toString() === studentId);
                      setAssignmentForm({...assignmentForm, student_id: studentId});
                      setSelectedStudent(student);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose student...</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.full_name || student.name || student.email}
                      </option>
                    ))}
                  </select>
                  {selectedStudent && (
                    <div className="text-xs bg-gray-50 p-2 rounded">
                      <div className="font-medium">{selectedStudent.full_name || selectedStudent.name}</div>
                      <div className="text-gray-600">{selectedStudent.email}</div>
                      {selectedStudent.phone && <div className="text-gray-600">{selectedStudent.phone}</div>}
                    </div>
                  )}
                </div>

                {/* Trainers Column */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 flex items-center">
                    👨‍🏫 Assign Trainer
                    <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">({trainers.length})</span>
                  </h4>
                  <select
                    value={assignmentForm.trainer_id}
                    onChange={(e) => setAssignmentForm({...assignmentForm, trainer_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">No trainer assigned</option>
                    {trainers.map(trainer => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.full_name || trainer.name || trainer.email}
                      </option>
                    ))}
                  </select>
                  {assignmentForm.trainer_id && (
                    <div className="text-xs bg-green-50 p-2 rounded">
                      <div className="font-medium">{trainers.find(t => t.id.toString() === assignmentForm.trainer_id)?.full_name || trainers.find(t => t.id.toString() === assignmentForm.trainer_id)?.name}</div>
                      <div className="text-gray-600">{trainers.find(t => t.id.toString() === assignmentForm.trainer_id)?.email}</div>
                    </div>
                  )}
                </div>

                {/* Recruiters Column */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 flex items-center">
                    💼 Assign Recruiter
                    <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">({recruiters.length})</span>
                  </h4>
                  <select
                    value={assignmentForm.recruiter_id}
                    onChange={(e) => setAssignmentForm({...assignmentForm, recruiter_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">No recruiter assigned</option>
                    {recruiters.map(recruiter => (
                      <option key={recruiter.id} value={recruiter.id}>
                        {recruiter.full_name || recruiter.name || recruiter.email}
                      </option>
                    ))}
                  </select>
                  {assignmentForm.recruiter_id && (
                    <div className="text-xs bg-purple-50 p-2 rounded">
                      <div className="font-medium">{recruiters.find(r => r.id.toString() === assignmentForm.recruiter_id)?.full_name || recruiters.find(r => r.id.toString() === assignmentForm.recruiter_id)?.name}</div>
                      <div className="text-gray-600">{recruiters.find(r => r.id.toString() === assignmentForm.recruiter_id)?.email}</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Assignment Preview */}
              {assignmentForm.student_id && (assignmentForm.trainer_id || assignmentForm.recruiter_id) && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-semibold text-blue-800 mb-2">📋 Assignment Preview:</h5>
                  <div className="text-sm text-blue-700">
                    <div><strong>Student:</strong> {selectedStudent?.full_name || selectedStudent?.name}</div>
                    {assignmentForm.trainer_id && (
                      <div><strong>Trainer:</strong> {trainers.find(t => t.id.toString() === assignmentForm.trainer_id)?.full_name || trainers.find(t => t.id.toString() === assignmentForm.trainer_id)?.name}</div>
                    )}
                    {assignmentForm.recruiter_id && (
                      <div><strong>Recruiter:</strong> {recruiters.find(r => r.id.toString() === assignmentForm.recruiter_id)?.full_name || recruiters.find(r => r.id.toString() === assignmentForm.recruiter_id)?.name}</div>
                    )}
                  </div>
                </div>
              )}
              
              {!assignmentForm.student_id && (
                <div className="mt-4 text-center text-gray-500 text-sm">
                  👆 Please select a student first
                </div>
              )}
              
              {assignmentForm.student_id && !assignmentForm.trainer_id && !assignmentForm.recruiter_id && (
                <div className="mt-4 text-center text-orange-600 text-sm bg-orange-50 p-3 rounded">
                  ⚠️ Please assign at least one trainer or recruiter to this student
                </div>
              )}
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={createAssignment}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                  disabled={!assignmentForm.student_id || (!assignmentForm.trainer_id && !assignmentForm.recruiter_id)}
                >
                  Create Assignment
                </button>
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setAssignmentForm({ student_id: '', trainer_id: '', recruiter_id: '' });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Test View */}
        {currentView === 'email-test' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📧 Email Service Test</h2>
            </div>
            
            <div className="max-w-md mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">🔍 Email Service Diagnostics</h3>
                <p className="text-blue-700 text-sm">
                  Use this tool to test if the email service is working correctly. 
                  This will send a test email to verify SMTP configuration.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address to test..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={testEmailService}
                  disabled={loading || !testEmail}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                    loading || !testEmail
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {loading ? '⏳ Sending...' : '🚀 Send Test Email'}
                </button>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p><strong>What this test does:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Checks SMTP server connection</li>
                  <li>Verifies authentication credentials</li>
                  <li>Sends a test email with formatted HTML content</li>
                  <li>Reports back configuration status</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
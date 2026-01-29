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
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApps, setSelectedApps] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
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
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
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
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
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
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
      const res = await fetch(`${backendUrl}/api/users`, {
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        const allUsers = data.users || data || [];
        setTrainers(allUsers.filter(user => user.role === 'trainer'));
        setRecruiters(allUsers.filter(user => user.role === 'recruiter'));
      }
    } catch (err) {
      console.error('Error loading trainers/recruiters:', err);
    }
  };

  const loadAssignments = async () => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
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

  const createUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.role) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
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

  const createAssignment = async () => {
    if (!assignmentForm.student_id || (!assignmentForm.trainer_id && !assignmentForm.recruiter_id)) {
      setError('Please select a student and at least one trainer or recruiter');
      return;
    }

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
      const res = await fetch(`${backendUrl}/api/assignments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentForm)
      });

      if (res.ok) {
        const result = await res.json();
        console.log('✅ Assignment created:', result);
        setShowAssignmentModal(false);
        setAssignmentForm({ student_id: '', trainer_id: '', recruiter_id: '' });
        await loadAssignments();
        alert('Assignment created successfully!');
      } else {
        const errorText = await res.text();
        setError(`Failed to create assignment: HTTP ${res.status}: ${errorText}`);
      }
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
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
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
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
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
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
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
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
          
          {/* Navigation */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setCurrentView('applications')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'applications'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📝 Applications ({applications.length})
            </button>
            <button
              onClick={() => setCurrentView('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👥 User Management ({users.length})
            </button>
            <button
              onClick={() => setCurrentView('assignments')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'assignments'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔗 Assignments ({assignments.length})
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
              <button onClick={() => setError('')} className="float-right font-bold">×</button>
            </div>
          )}
        </div>

        {/* Applications View */}
        {currentView === 'applications' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Applications Management</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="APPLIED">Applied</option>
                  <option value="approved">Approved</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="created_at">Sort by Date</option>
                  <option value="full_name">Sort by Name</option>
                  <option value="status">Sort by Status</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900">{user.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{user.email}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{user.phone}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'trainer' 
                            ? 'bg-blue-100 text-blue-800'
                            : user.role === 'recruiter'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
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
              <h2 className="text-2xl font-bold text-gray-800">User Assignments</h2>
              <button
                onClick={() => setShowAssignmentModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Create Assignment
              </button>
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
                          <div>
                            <div className="font-medium text-gray-900">{assignment.trainer_name}</div>
                            <div className="text-gray-500 text-xs">{assignment.trainer_email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {assignment.recruiter_name ? (
                          <div>
                            <div className="font-medium text-gray-900">{assignment.recruiter_name}</div>
                            <div className="text-gray-500 text-xs">{assignment.recruiter_email}</div>
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
                          onClick={() => deleteAssignment(assignment.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                          title="Delete assignment"
                        >
                          🗑️ Delete
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
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Create User Assignment</h3>
              <div className="space-y-4">
                <select
                  value={assignmentForm.student_id}
                  onChange={(e) => setAssignmentForm({...assignmentForm, student_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Student *</option>
                  {users.filter(user => user.role === 'student').map(student => (
                    <option key={student.id} value={student.id}>{student.name} ({student.email})</option>
                  ))}
                </select>
                
                <select
                  value={assignmentForm.trainer_id}
                  onChange={(e) => setAssignmentForm({...assignmentForm, trainer_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Trainer (Optional)</option>
                  {trainers.map(trainer => (
                    <option key={trainer.id} value={trainer.id}>{trainer.name} ({trainer.email})</option>
                  ))}
                </select>
                
                <select
                  value={assignmentForm.recruiter_id}
                  onChange={(e) => setAssignmentForm({...assignmentForm, recruiter_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Recruiter (Optional)</option>
                  {recruiters.map(recruiter => (
                    <option key={recruiter.id} value={recruiter.id}>{recruiter.name} ({recruiter.email})</option>
                  ))}
                </select>
                
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  <strong>Note:</strong> You must select at least one trainer or recruiter to create an assignment.
                </div>
              </div>
              
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
      </div>
    </div>
  );
}
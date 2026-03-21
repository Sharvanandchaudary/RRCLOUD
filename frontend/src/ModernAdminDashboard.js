import React, { useState, useEffect } from 'react';
import './ModernAdminDashboard.css';

export default function ModernAdminDashboard() {
  const [currentView, setCurrentView] = useState('overview');
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Form states
  const [userForm, setUserForm] = useState({ 
    full_name: '', 
    email: '', 
    phone: '', 
    role: 'student',
    password: '' 
  });
  const [assignmentForm, setAssignmentForm] = useState({ 
    student_id: '', 
    trainer_id: '', 
    recruiter_id: '' 
  });
  
  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalApplications: 0,
    totalAssignments: 0,
    activeStudents: 0,
    trainers: 0,
    recruiters: 0
  });

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, currentView]);

  const checkAuthentication = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    const userDataString = localStorage.getItem('auth_user') || localStorage.getItem('user');
    const directEmail = localStorage.getItem('userEmail');
    
    let userData = null;
    try {
      if (userDataString) userData = JSON.parse(userDataString);
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
    
    const adminEmail = userData?.email || directEmail;
    const userRole = userData?.role;
    
    if (token && adminEmail && userRole === 'admin') {
      setAuthToken(token);
      setIsAuthenticated(true);
      setAdminInfo({ email: adminEmail, role: userRole });
    } else {
      setError('Please login as admin first');
      setTimeout(() => window.location.href = '/', 2000);
    }
  };

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  });

  const getBackendUrl = () => 
    window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const backendUrl = getBackendUrl();
      
      if (currentView === 'overview' || currentView === 'users') {
        await loadUsers();
      }
      if (currentView === 'overview' || currentView === 'applications') {
        await loadApplications();
      }
      if (currentView === 'overview' || currentView === 'assignments') {
        await loadAssignments();
      }
      
      calculateStats();
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/users`, { 
        headers: getAuthHeaders() 
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadApplications = async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/applications`, { 
        headers: getAuthHeaders() 
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Error loading applications:', err);
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/assignments`, { 
        headers: getAuthHeaders() 
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch (err) {
      console.error('Error loading assignments:', err);
    }
  };

  const calculateStats = () => {
    const totalUsers = users.length;
    const students = users.filter(u => u.role === 'student');
    const trainers = users.filter(u => u.role === 'trainer');
    const recruiters = users.filter(u => u.role === 'recruiter');
    
    setStats({
      totalUsers,
      totalApplications: applications.length,
      totalAssignments: assignments.length,
      activeStudents: students.length,
      trainers: trainers.length,
      recruiters: recruiters.length
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`${getBackendUrl()}/api/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userForm)
      });
      
      if (res.ok) {
        setSuccess('User created successfully!');
        setShowUserModal(false);
        resetUserForm();
        await loadUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Error creating user: ' + err.message);
    }
  };

  const handleUpdateUser = async (userId) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userForm)
      });
      
      if (res.ok) {
        setSuccess('User updated successfully!');
        setShowUserModal(false);
        resetUserForm();
        await loadUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Error updating user: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const res = await fetch(`${getBackendUrl()}/api/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        setSuccess('User deleted successfully!');
        await loadUsers();
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      setError('Error deleting user: ' + err.message);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`${getBackendUrl()}/api/assignments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentForm)
      });
      
      if (res.ok) {
        setSuccess('Assignment created successfully!');
        setShowAssignmentModal(false);
        resetAssignmentForm();
        await loadAssignments();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create assignment');
      }
    } catch (err) {
      setError('Error creating assignment: ' + err.message);
    }
  };

  const handleApproveApplication = async (appId) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/applications/${appId}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        setSuccess('Application approved!');
        await loadApplications();
      } else {
        setError('Failed to approve application');
      }
    } catch (err) {
      setError('Error approving application: ' + err.message);
    }
  };

  const handleRejectApplication = async (appId) => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/applications/${appId}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        setSuccess('Application rejected!');
        await loadApplications();
      } else {
        setError('Failed to reject application');
      }
    } catch (err) {
      setError('Error rejecting application: ' + err.message);
    }
  };

  const resetUserForm = () => {
    setUserForm({ full_name: '', email: '', phone: '', role: 'student', password: '' });
    setSelectedItem(null);
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({ student_id: '', trainer_id: '', recruiter_id: '' });
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated) {
    return (
      <div className="modern-admin-container">
        <div className="auth-error">
          <div className="auth-error-icon">🔒</div>
          <h2>Authentication Required</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1>🎯 RRCloud</h1>
          <p className="admin-badge">Admin Panel</p>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={currentView === 'overview' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('overview')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button 
            className={currentView === 'users' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('users')}
          >
            <span className="nav-icon">👥</span>
            Users
          </button>
          <button 
            className={currentView === 'applications' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('applications')}
          >
            <span className="nav-icon">📝</span>
            Applications
          </button>
          <button 
            className={currentView === 'assignments' ? 'nav-item active' : 'nav-item'}
            onClick={() => setCurrentView('assignments')}
          >
            <span className="nav-icon">🎓</span>
            Assignments
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">👤</div>
            <div className="admin-details">
              <strong>{adminInfo?.email}</strong>
              <span className="role-tag">{adminInfo?.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <h2>{currentView === 'overview' ? 'Dashboard Overview' : 
                 currentView === 'users' ? 'User Management' :
                 currentView === 'applications' ? 'Application Management' : 
                 'Assignment Management'}</h2>
            <p className="header-subtitle">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="header-right">
            <button className="refresh-btn" onClick={loadDashboardData}>
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* Notifications */}
        {error && (
          <div className="notification error-notification">
            <span className="notification-icon">❌</span>
            <span>{error}</span>
            <button className="close-notification" onClick={() => setError('')}>×</button>
          </div>
        )}
        {success && (
          <div className="notification success-notification">
            <span className="notification-icon">✅</span>
            <span>{success}</span>
            <button className="close-notification" onClick={() => setSuccess('')}>×</button>
          </div>
        )}

        {/* Content Area */}
        <div className="admin-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading data...</p>
            </div>
          ) : (
            <>
              {/* Overview View */}
              {currentView === 'overview' && (
                <div className="overview-grid">
                  <div className="stat-card card-primary">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <h3>{stats.totalUsers}</h3>
                      <p>Total Users</p>
                    </div>
                  </div>
                  <div className="stat-card card-success">
                    <div className="stat-icon">🎓</div>
                    <div className="stat-content">
                      <h3>{stats.activeStudents}</h3>
                      <p>Active Students</p>
                    </div>
                  </div>
                  <div className="stat-card card-info">
                    <div className="stat-icon">📝</div>
                    <div className="stat-content">
                      <h3>{stats.totalApplications}</h3>
                      <p>Applications</p>
                    </div>
                  </div>
                  <div className="stat-card card-warning">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-content">
                      <h3>{stats.totalAssignments}</h3>
                      <p>Assignments</p>
                    </div>
                  </div>
                  <div className="stat-card card-purple">
                    <div className="stat-icon">👨‍🏫</div>
                    <div className="stat-content">
                      <h3>{stats.trainers}</h3>
                      <p>Trainers</p>
                    </div>
                  </div>
                  <div className="stat-card card-orange">
                    <div className="stat-icon">💼</div>
                    <div className="stat-content">
                      <h3>{stats.recruiters}</h3>
                      <p>Recruiters</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Users View */}
              {currentView === 'users' && (
                <div className="users-view">
                  <div className="view-header">
                    <div className="search-filter-container">
                      <input
                        type="text"
                        placeholder="🔍 Search users..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <select 
                        className="filter-select"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                      >
                        <option value="all">All Roles</option>
                        <option value="student">Students</option>
                        <option value="trainer">Trainers</option>
                        <option value="recruiter">Recruiters</option>
                        <option value="admin">Admins</option>
                      </select>
                    </div>
                    <button 
                      className="primary-btn"
                      onClick={() => {
                        resetUserForm();
                        setShowUserModal(true);
                      }}
                    >
                      ➕ Add User
                    </button>
                  </div>

                  <div className="table-container">
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Role</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.id}>
                            <td><strong>{user.full_name || 'N/A'}</strong></td>
                            <td>{user.email}</td>
                            <td>{user.phone || 'N/A'}</td>
                            <td>
                              <span className={`role-badge role-${user.role}`}>
                                {user.role}
                              </span>
                            </td>
                            <td>{new Date(user.created_at).toLocaleDateString()}</td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="action-btn edit-btn"
                                  onClick={() => {
                                    setUserForm({
                                      full_name: user.full_name || '',
                                      email: user.email,
                                      phone: user.phone || '',
                                      role: user.role,
                                      password: ''
                                    });
                                    setSelectedItem(user);
                                    setShowUserModal(true);
                                  }}
                                >
                                  ✏️
                                </button>
                                <button 
                                  className="action-btn delete-btn"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Applications View */}
              {currentView === 'applications' && (
                <div className="applications-view">
                  <div className="view-header">
                    <div className="search-filter-container">
                      <input
                        type="text"
                        placeholder="🔍 Search applications..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <select 
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Course</th>
                          <th>Status</th>
                          <th>Applied</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((app) => (
                          <tr key={app.id}>
                            <td><strong>{app.full_name}</strong></td>
                            <td>{app.email}</td>
                            <td>{app.phone}</td>
                            <td>{app.course}</td>
                            <td>
                              <span className={`status-badge status-${app.status}`}>
                                {app.status}
                              </span>
                            </td>
                            <td>{new Date(app.created_at).toLocaleDateString()}</td>
                            <td>
                              <div className="action-buttons">
                                {app.status === 'pending' && (
                                  <>
                                    <button 
                                      className="action-btn approve-btn"
                                      onClick={() => handleApproveApplication(app.id)}
                                    >
                                      ✅
                                    </button>
                                    <button 
                                      className="action-btn reject-btn"
                                      onClick={() => handleRejectApplication(app.id)}
                                    >
                                      ❌
                                    </button>
                                  </>
                                )}
                                <button 
                                  className="action-btn view-btn"
                                  onClick={() => {
                                    setSelectedItem(app);
                                    setShowApplicationModal(true);
                                  }}
                                >
                                  👁️
                                </button>
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
                <div className="assignments-view">
                  <div className="view-header">
                    <h3>Student Assignments</h3>
                    <button 
                      className="primary-btn"
                      onClick={() => {
                        resetAssignmentForm();
                        setShowAssignmentModal(true);
                      }}
                    >
                      ➕ Create Assignment
                    </button>
                  </div>

                  <div className="assignments-grid">
                    {assignments.map((assignment) => {
                      const student = users.find(u => u.id === assignment.student_id);
                      const trainer = users.find(u => u.id === assignment.trainer_id);
                      const recruiter = users.find(u => u.id === assignment.recruiter_id);
                      
                      return (
                        <div key={assignment.id} className="assignment-card">
                          <div className="assignment-header">
                            <h4>🎓 {student?.full_name || 'Unknown Student'}</h4>
                            <span className="assignment-id">#{assignment.id}</span>
                          </div>
                          <div className="assignment-body">
                            <div className="assignment-info">
                              <span className="info-label">👨‍🏫 Trainer:</span>
                              <span className="info-value">{trainer?.full_name || 'Not Assigned'}</span>
                            </div>
                            <div className="assignment-info">
                              <span className="info-label">💼 Recruiter:</span>
                              <span className="info-value">{recruiter?.full_name || 'Not Assigned'}</span>
                            </div>
                            <div className="assignment-info">
                              <span className="info-label">📧 Email:</span>
                              <span className="info-value">{student?.email}</span>
                            </div>
                            <div className="assignment-info">
                              <span className="info-label">📅 Created:</span>
                              <span className="info-value">
                                {new Date(assignment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedItem ? 'Edit User' : 'Create New User'}</h3>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>×</button>
            </div>
            <form onSubmit={selectedItem ? (e) => { e.preventDefault(); handleUpdateUser(selectedItem.id); } : handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                  placeholder="+1234567890"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                >
                  <option value="student">Student</option>
                  <option value="trainer">Trainer</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {!selectedItem && (
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {selectedItem ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="modal-overlay" onClick={() => setShowAssignmentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Assignment</h3>
              <button className="modal-close" onClick={() => setShowAssignmentModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateAssignment}>
              <div className="form-group">
                <label>Student</label>
                <select
                  required
                  value={assignmentForm.student_id}
                  onChange={(e) => setAssignmentForm({...assignmentForm, student_id: e.target.value})}
                >
                  <option value="">Select Student</option>
                  {users.filter(u => u.role === 'student').map(student => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Trainer</label>
                <select
                  required
                  value={assignmentForm.trainer_id}
                  onChange={(e) => setAssignmentForm({...assignmentForm, trainer_id: e.target.value})}
                >
                  <option value="">Select Trainer</option>
                  {users.filter(u => u.role === 'trainer').map(trainer => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.full_name} ({trainer.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Recruiter</label>
                <select
                  required
                  value={assignmentForm.recruiter_id}
                  onChange={(e) => setAssignmentForm({...assignmentForm, recruiter_id: e.target.value})}
                >
                  <option value="">Select Recruiter</option>
                  {users.filter(u => u.role === 'recruiter').map(recruiter => (
                    <option key={recruiter.id} value={recruiter.id}>
                      {recruiter.full_name} ({recruiter.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowAssignmentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {showApplicationModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowApplicationModal(false)}>
          <div className="modal-content application-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Application Details</h3>
              <button className="modal-close" onClick={() => setShowApplicationModal(false)}>×</button>
            </div>
            <div className="application-details">
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{selectedItem.full_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{selectedItem.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{selectedItem.phone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Course:</span>
                <span className="detail-value">{selectedItem.course}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`status-badge status-${selectedItem.status}`}>
                  {selectedItem.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Applied:</span>
                <span className="detail-value">
                  {new Date(selectedItem.created_at).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowApplicationModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

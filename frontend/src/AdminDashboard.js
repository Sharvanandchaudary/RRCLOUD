import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: 'student' });
  const [assignmentForm, setAssignmentForm] = useState({ student_id: '', assigned_user_id: '', assigned_user_role: 'trainer' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [emailMessage, setEmailMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    loadApplications();
    loadUsers();
    loadAssignments();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
      const url = `${backendUrl}/api/users`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to load users:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users: ' + err.message);
    }
  };

  const loadAssignments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
      const url = `${backendUrl}/api/assignments`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data || []);
      } else {
        console.error('Failed to load assignments:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError('Failed to load assignments: ' + err.message);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('❌ Please login to create assignments');
        return;
      }

      if (!assignmentForm.student_id || !assignmentForm.assigned_user_id || !assignmentForm.assigned_user_role) {
        alert('⚠️ Please fill in all required fields');
        return;
      }

      // Show loading state
      const originalButtonText = document.querySelector('button[onclick="handleCreateAssignment()"]')?.textContent;
      
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
      console.log('Creating assignment at:', `${backendUrl}/api/assignments`);
      
      const response = await fetch(`${backendUrl}/api/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assignmentForm)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error || 'Failed to create assignment';
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      const studentUser = users.find(u => u.id == assignmentForm.student_id);
      const assignedUser = users.find(u => u.id == assignmentForm.assigned_user_id);
      
      alert(`✅ Assignment created successfully!\n\n👨‍🎓 Student: ${studentUser?.full_name || 'Unknown'}\n${assignmentForm.assigned_user_role === 'trainer' ? '👨‍🏫 Trainer' : '🏢 Recruiter'}: ${assignedUser?.full_name || 'Unknown'}\n\n🔄 The assignment is now active and visible in dashboards.`);
      
      setShowAssignmentModal(false);
      setAssignmentForm({ student_id: '', assigned_user_id: '', assigned_user_role: 'trainer' });
      loadAssignments(); // Reload assignments
    } catch (error) {
      console.error('Assignment creation error:', error);
      alert(`❌ Failed to create assignment: ${error.message}`);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'http://localhost:8080';
      
      const response = await fetch(`${backendUrl}/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete assignment');
      }

      alert('✅ Assignment deleted successfully!');
      loadAssignments(); // Reload assignments
    } catch (error) {
      console.error('Assignment deletion error:', error);
      alert(`❌ Failed to delete assignment: ${error.message}`);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const url = backendUrl ? `${backendUrl}/applications` : '/applications';
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      let data = await res.json();
      data = data.map(app => ({
        ...app,
        is_approved: app.is_approved || false
      }));
      
      setApplications(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPendingApps = () => applications.filter(app => 
    (app.status === 'APPLIED' || app.status === 'pending') && !app.is_approved
  );

  const getApprovedApps = () => applications.filter(app => app.is_approved);

  const getRejectedApps = () => applications.filter(app => 
    app.status === 'REJECTED' || app.status === 'rejected'
  );

  const handleApprove = (app) => {
    setSelectedApp(app);
    setPassword('');
    setShowModal(true);
  };

  const submitApproval = async () => {
    if (!password || password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const url = backendUrl 
        ? `${backendUrl}/api/applications/${selectedApp.id}/approve`
        : `/api/applications/${selectedApp.id}/approve`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, approvedBy: 'admin@zgenai.org' })
      });

      if (!res.ok) throw new Error('Approval failed');

      const data = await res.json();
      alert(`Candidate approved successfully.\n\nCredentials sent to: ${selectedApp.email}`);

      setShowModal(false);
      setSelectedApp(null);
      loadApplications();
      setActiveTab('approved');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleReject = async (appId) => {
    if (!window.confirm('Reject this application?')) return;

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const url = backendUrl 
        ? `${backendUrl}/api/applications/${appId}/reject`
        : `/api/applications/${appId}/reject`;

      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error('Reject failed');

      alert('Application rejected');
      loadApplications();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // User Management Functions
  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.role) {
      alert('⚠️ Please fill in all required fields: Name, Email, and Role are mandatory.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      alert('⚠️ Please enter a valid email address.');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('❌ Authentication required. Please log in again.');
        return;
      }
      
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
      console.log('Creating user at:', `${backendUrl}/api/users`);

      const res = await fetch(`${backendUrl}/api/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          role: userForm.role
        })
      });

      if (res.ok) {
        const result = await res.json();
        console.log('User created successfully:', result);
        
        alert(`✅ Corporate User Account Created Successfully!\n\n👤 User Details:\n• Name: ${userForm.name}\n• Email: ${userForm.email}\n• Role: ${userForm.role.charAt(0).toUpperCase() + userForm.role.slice(1)}\n• Phone: ${userForm.phone || 'Not provided'}\n\n🔐 Account Credentials:\n• Login URL: https://rrcloud-frontend-nsmgws4u4a-uc.a.run.app/login\n• Email: ${userForm.email}\n• Default Password: password123\n\n📧 Welcome email sent to user with complete login instructions.\n\n⚠️ User will be prompted to change password on first login for security.`);
        
        setShowUserModal(false);
        setUserForm({ name: '', email: '', phone: '', role: 'student' });
        loadUsers();
      } else {
        const errorText = await res.text();
        let errorMessage;
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error || error.message || 'Failed to create user';
        } catch {
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        console.error('User creation failed:', errorMessage);
        alert(`❌ User Creation Failed\n\nError: ${errorMessage}\n\nPlease check:\n• Email address is not already registered\n• All required fields are filled\n• You have admin permissions`);
      }
    } catch (err) {
      console.error('Error creating user:', err);
      alert(`❌ Network Error\n\nFailed to create user: ${err.message}\n\nPlease check your internet connection and try again.`);
    }
  };

  const handleBlockUser = async (userId, currentStatus) => {
    const action = currentStatus === 'blocked' ? 'unblock' : 'block';
    const actionText = currentStatus === 'blocked' ? 'Unblock' : 'Block';
    
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'http://localhost:8080';

      const res = await fetch(`${backendUrl}/api/users/${userId}/block`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          blocked: currentStatus !== 'blocked'
        })
      });

      if (res.ok) {
        alert(`✅ User ${action}ed successfully`);
        loadUsers();
      } else {
        const error = await res.json();
        alert(`❌ Error: ${error.message || `Failed to ${action} user`}`);
      }
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      alert(`❌ Error ${action}ing user: ` + err.message);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`⚠️ PERMANENT DELETION WARNING ⚠️\n\nAre you sure you want to DELETE this user account?\n\n👤 User: ${email}\n\n🚨 This action cannot be undone!\n🚨 All user data will be permanently removed!`)) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'http://localhost:8080';

      const res = await fetch(`${backendUrl}/api/users/${userId}`, { 
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('✅ User account deleted successfully');
        loadUsers();
      } else {
        const error = await res.json();
        alert(`❌ Error: ${error.message || 'Failed to delete user'}`);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('❌ Error deleting user: ' + err.message);
    }
  };

  const handleDeleteApplication = async (appId, name) => {
    if (!window.confirm(`⚠️ PERMANENT DELETION WARNING ⚠️\n\nAre you sure you want to DELETE this application?\n\n📝 Applicant: ${name}\n\n🚨 This action cannot be undone!\n🚨 All application data will be permanently removed!`)) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'http://localhost:8080';

      const res = await fetch(`${backendUrl}/api/applications/${appId}`, { 
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('✅ Application deleted successfully');
        loadApplications();
      } else {
        const error = await res.json();
        alert(`❌ Error: ${error.message || 'Failed to delete application'}`);
      }
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('❌ Error deleting application: ' + err.message);
    }
  };

  const handleSendRatingEmail = (user) => {
    const subject = `ZgenAI Account Rating & Feedback Request`;
    const body = `Dear ${user.full_name || user.email},

We hope you're having a great experience with ZgenAI platform!

Account Details:
- Name: ${user.full_name || 'Not provided'}
- Email: ${user.email}
- Phone: ${user.phone || 'Not provided'}
- Role: ${user.role}

We would love to get your feedback and rating on our platform. Please reply to this email with:
1. Your overall rating (1-5 stars)
2. What you like most about the platform
3. Any suggestions for improvement

Your feedback helps us serve you better!

Best regards,
ZgenAI Team`;

    window.location.href = `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 25%, #cbd5e1 50%, #94a3b8 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    },
    wrapper: {
      maxWidth: '1800px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 2
    },
    corporateOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, rgba(30, 64, 175, 0.03) 0%, rgba(37, 99, 235, 0.05) 50%, rgba(59, 130, 246, 0.03) 100%)',
      pointerEvents: 'none',
      zIndex: 1
    },
    header: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
      backdropFilter: 'blur(20px)',
      padding: '40px',
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      marginBottom: '30px',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      position: 'relative',
      overflow: 'hidden'
    },
    headerTitle: {
      fontSize: '42px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #7c3aed 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: '0 0 16px 0',
      letterSpacing: '-1px',
      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative'
    },
    headerSubtitle: {
      fontSize: '20px',
      color: '#64748b',
      margin: '0 0 10px 0',
      fontWeight: '500',
      letterSpacing: '0.5px'
    },
    corporateBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      color: '#92400e',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '700',
      marginTop: '10px',
      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
      border: '1px solid rgba(245, 158, 11, 0.3)'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '30px',
      marginTop: '40px'
    },
    statCard: {
      background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #1d4ed8 100%)',
      color: 'white',
      padding: '35px',
      borderRadius: '20px',
      textAlign: 'center',
      boxShadow: '0 10px 30px rgba(30, 64, 175, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden'
    },
    statNumber: {
      fontSize: '48px',
      fontWeight: '900',
      margin: '0 0 12px 0',
      letterSpacing: '-1px',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
      position: 'relative'
    },
    statLabel: {
      fontSize: '15px',
      fontWeight: '600',
      margin: 0,
      opacity: 0.95,
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    contentCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    tabContainer: {
      display: 'flex',
      borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
      background: 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)'
    },
    tab: (isActive) => ({
      padding: '16px 28px',
      border: 'none',
      background: isActive 
        ? 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' 
        : 'transparent',
      color: isActive ? 'white' : '#64748b',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '600',
      borderRadius: isActive ? '8px 8px 0 0' : '0',
      transition: 'all 0.2s ease',
      position: 'relative',
      boxShadow: isActive ? '0 2px 8px rgba(30, 64, 175, 0.2)' : 'none'
    }),
    contentCard: {
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      boxShadow: '0 2px 20px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      border: '1px solid rgba(226, 232, 240, 0.5)'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      background: '#f7fafc',
      padding: '16px',
      textAlign: 'left',
      fontWeight: '600',
      fontSize: '13px',
      color: '#2d3748',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      borderBottom: '2px solid #e2e8f0'
    },
    td: {
      padding: '16px',
      borderBottom: '1px solid #e2e8f0',
      fontSize: '14px',
      color: '#2d3748'
    },
    actionCell: {
      display: 'flex',
      gap: '8px'
    },
    btn: (variant) => {
      const variants = {
        approve: {
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          hover: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
          shadow: 'rgba(5, 150, 105, 0.2)'
        },
        reject: {
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          hover: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
          shadow: 'rgba(220, 38, 38, 0.2)'
        },
        secondary: {
          background: 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
          hover: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
          shadow: 'rgba(75, 85, 99, 0.2)'
        },
        block: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          hover: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          shadow: 'rgba(245, 158, 11, 0.2)'
        },
        unblock: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          hover: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          shadow: 'rgba(16, 185, 129, 0.2)'
        },
        delete: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          hover: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          shadow: 'rgba(239, 68, 68, 0.2)'
        }
      };
      const v = variants[variant] || variants.secondary;
      return {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '8px',
        background: v.background,
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.2s ease',
        boxShadow: `0 2px 8px ${v.shadow}`,
        ':hover': {
          background: v.hover,
          boxShadow: `0 4px 12px ${v.shadow}`
        }
      };
    },
    searchContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '20px',
      gap: '10px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    searchInput: {
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '16px',
      minWidth: '300px',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s ease'
    },
    actionButton: {
      backgroundColor: '#4299E1',
      color: 'white',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease'
    },
    filterContainer: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
    },
    select: {
      padding: '8px 12px',
      border: '2px solid #e2e8f0',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white'
    },
    statusBadge: (status) => ({
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      textAlign: 'center',
      backgroundColor: 
        status === 'active' ? '#C6F6D5' :
        status === 'blocked' ? '#FED7D7' :
        status === 'pending' ? '#FEFCBF' :
        status === 'approved' ? '#C6F6D5' :
        status === 'rejected' ? '#FED7D7' : '#E2E8F0',
      color:
        status === 'active' ? '#22543D' :
        status === 'blocked' ? '#742A2A' :
        status === 'pending' ? '#744210' :
        status === 'approved' ? '#22543D' :
        status === 'rejected' ? '#742A2A' : '#4A5568',
    }),
    userTable: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    th: {
      padding: '16px 12px',
      textAlign: 'left',
      borderBottom: '2px solid #e2e8f0',
      fontWeight: '700',
      color: '#2D3748',
      backgroundColor: '#f8fafc',
      fontSize: '14px'
    },
    td: {
      padding: '16px 12px',
      borderBottom: '1px solid #e2e8f0',
      color: '#4A5568',
      fontSize: '14px'
    },
    emptyState: {
      padding: '60px 20px',
      textAlign: 'center',
      color: '#718096'
    },
    emptyStateIcon: {
      fontSize: '48px',
      marginBottom: '16px',
      opacity: '0.5'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: showModal ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    },
    modalContent: {
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(10px)',
      padding: '36px',
      borderRadius: '12px',
      maxWidth: '450px',
      width: '90%',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      border: '1px solid rgba(226, 232, 240, 0.5)'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1a202c',
      margin: '0 0 8px 0'
    },
    modalSubtitle: {
      fontSize: '14px',
      color: '#718096',
      margin: '0 0 24px 0'
    },
    inputGroup: {
      marginBottom: '24px'
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: '#2d3748',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #cbd5e0',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s ease'
    },
    modalActions: {
      display: 'flex',
      gap: '12px'
    },
    errorBox: {
      background: '#fee',
      border: '1px solid #fcc',
      color: '#c53030',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
      fontSize: '14px'
    }
  };

  const pending = getPendingApps();
  const approved = getApprovedApps();
  const rejected = getRejectedApps();

  const renderApplicationsTable = (apps, type) => {
    if (apps.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>∘</div>
          <p>No {type} applications</p>
        </div>
      );
    }

    return (
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Candidate Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Resume</th>
            <th style={styles.th}>Date Applied</th>
            {type === 'pending' && <th style={styles.th}>Actions</th>}
            {type === 'approved' && <th style={styles.th}>Approved Date</th>}
          </tr>
        </thead>
        <tbody>
          {apps.map(app => (
            <tr key={app.id}>
              <td style={styles.td}><strong>{app.full_name}</strong></td>
              <td style={styles.td}>{app.email}</td>
              <td style={styles.td}>{app.phone || '-'}</td>
              <td style={styles.td}>
                {app.resume_path ? (
                  <a 
                    href={`https://rrcloud-backend-415414350152.us-central1.run.app/uploads/${app.resume_path.split('/').pop()}`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#1e40af',
                      textDecoration: 'none',
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      border: '1px solid #bfdbfe',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      // Handle download errors gracefully
                      e.preventDefault();
                      
                      let downloadUrl;
                      if (app.resume_path.startsWith('/api/applications/resume/')) {
                        // Old format: /api/applications/resume/email
                        downloadUrl = `https://rrcloud-backend-415414350152.us-central1.run.app${app.resume_path}`;
                      } else {
                        // New format: /uploads/filename
                        const filename = app.resume_path.split('/').pop();
                        downloadUrl = `https://rrcloud-backend-415414350152.us-central1.run.app/uploads/${filename}`;
                      }
                      
                      // Test if file exists first
                      fetch(downloadUrl, { method: 'HEAD' })
                        .then(response => {
                          if (response.ok && response.headers.get('content-type') !== 'application/json') {
                            // File exists, proceed with download
                            window.open(downloadUrl, '_blank');
                          } else {
                            // File doesn't exist, show error
                            alert(`❌ Resume file is not available.\n\n📋 Reason: Files uploaded before recent system updates were lost due to Cloud Run's stateless nature.\n\n💡 Solution: Please contact ${app.full_name} at ${app.email} to resubmit their resume.`);
                          }
                        })
                        .catch(err => {
                          alert(`❌ Resume download failed.\n\n📋 Please contact ${app.full_name} at ${app.email} to resubmit their resume.`);
                        });
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    📄 Download Resume
                  </a>
                ) : (
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span style={{color: '#9ca3af', fontSize: '13px', fontStyle: 'italic'}}>No resume uploaded</span>
                    <button
                      onClick={() => alert(`Please contact ${app.email} to request resume resubmission`)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fcd34d',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Request Resume
                    </button>
                  </div>
                )}
              </td>
              <td style={styles.td}>{new Date(app.created_at).toLocaleDateString()}</td>
              {type === 'pending' && (
                <td style={{...styles.td, ...styles.actionCell}}>
                  <button 
                    onClick={() => handleApprove(app)}
                    style={styles.btn('approve')}
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(app.id)}
                    style={styles.btn('reject')}
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleDeleteApplication(app.id, app.full_name)}
                    style={styles.btn('reject')}
                    title="Delete Application"
                  >
                    🗑️ Delete
                  </button>
                </td>
              )}
              {(type === 'approved' || type === 'rejected') && (
                <td style={{...styles.td, ...styles.actionCell}}>
                  {type === 'approved' && app.approved_date && (
                    <span style={{marginRight: '10px', fontSize: '13px', color: '#666'}}>
                      {new Date(app.approved_date).toLocaleDateString()}
                    </span>
                  )}
                  <button 
                    onClick={() => handleDeleteApplication(app.id, app.full_name)}
                    style={styles.btn('reject')}
                    title="Delete Application"
                  >
                    🗑️ Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderUserManagement = () => {
    const filteredUsers = users.filter(user => {
      const matchesSearch = !searchQuery || 
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || (user.status || 'active') === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    return (
      <div style={{padding: '0'}}>
        {/* Corporate Admin Header */}
        <div style={{
          padding: '25px', 
          background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', 
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          <h2 style={{margin: '0 0 10px 0', fontSize: '24px', fontWeight: '700'}}>
            👥 Corporate User Management
          </h2>
          <p style={{margin: 0, opacity: 0.9, fontSize: '16px'}}>
            Complete control over all platform users • Create • Block • Delete • Send Credentials
          </p>
        </div>

        {/* Advanced Controls */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap'}}>
            {/* Search Input */}
            <input
              type="text"
              placeholder="🔍 Search users by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '10px 15px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '280px',
                outline: 'none'
              }}
            />
            
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '10px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">All Roles</option>
              <option value="student">👨‍🎓 Students</option>
              <option value="recruiter">💼 Recruiters</option>
              <option value="trainer">🎓 Trainers</option>
              <option value="admin">⚡ Admins</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">✅ Active</option>
              <option value="blocked">🚫 Blocked</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{display: 'flex', gap: '10px'}}>
            <button
              onClick={() => setShowUserModal(true)}
              style={{
                ...styles.btn('approve'),
                fontSize: '14px',
                fontWeight: '600',
                padding: '12px 20px'
              }}
            >
              ➕ Create New User
            </button>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#e3f2fd',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#1976d2'
            }}>
              📊 {filteredUsers.length} users found
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div style={{overflowX: 'auto'}}>
          <table style={{...styles.table, minWidth: '100%'}}>
            <thead>
              <tr style={{backgroundColor: '#f1f5f9'}}>
                <th style={{...styles.th, minWidth: '200px'}}>👤 User Details</th>
                <th style={{...styles.th, minWidth: '200px'}}>📧 Contact Info</th>
                <th style={{...styles.th, minWidth: '120px'}}>🎭 Role</th>
                <th style={{...styles.th, minWidth: '100px'}}>📊 Status</th>
                <th style={{...styles.th, minWidth: '320px'}}>⚡ Corporate Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} style={{borderBottom: '1px solid #e2e8f0'}}>
                  <td style={{...styles.td, padding: '16px'}}>
                    <div style={{fontWeight: '700', marginBottom: '6px', fontSize: '16px', color: '#1f2937'}}>
                      {user.full_name || 'No name provided'}
                    </div>
                    <div style={{fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', display: 'inline-block'}}>
                      ID: {user.id} • Created: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{...styles.td, padding: '16px'}}>
                    <div style={{marginBottom: '6px', fontWeight: '600'}}>📧 {user.email}</div>
                    <div style={{fontSize: '14px', color: '#6b7280'}}>
                      📱 {user.phone || 'No phone provided'}
                    </div>
                  </td>
                  <td style={{...styles.td, padding: '16px'}}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      backgroundColor: 
                        user.role === 'admin' ? '#fef3c7' :
                        user.role === 'trainer' ? '#d1fae5' :
                        user.role === 'recruiter' ? '#dbeafe' : '#f3e8ff',
                      color:
                        user.role === 'admin' ? '#92400e' :
                        user.role === 'trainer' ? '#065f46' :
                        user.role === 'recruiter' ? '#1e40af' : '#6b21a8'
                    }}>
                      {user.role === 'admin' ? '⚡ Admin' :
                       user.role === 'trainer' ? '🎓 Trainer' :
                       user.role === 'recruiter' ? '💼 Recruiter' : '👨‍🎓 Student'}
                    </span>
                  </td>
                  <td style={{...styles.td, padding: '16px'}}>
                    <span style={{
                      ...styles.statusBadge(user.status || 'active'),
                      fontWeight: '700',
                      fontSize: '11px'
                    }}>
                      {(user.status || 'active') === 'active' ? '✅ ACTIVE' : '🚫 BLOCKED'}
                    </span>
                  </td>
                  <td style={{...styles.td, padding: '16px'}}>
                    <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                      <button
                        onClick={() => handleBlockUser(user.id, user.status || 'active')}
                        style={{
                          ...styles.btn((user.status || 'active') === 'blocked' ? 'unblock' : 'block'),
                          fontSize: '11px',
                          padding: '6px 12px'
                        }}
                      >
                        {(user.status || 'active') === 'blocked' ? '✅ Unblock' : '🚫 Block'}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        style={{
                          ...styles.btn('delete'),
                          fontSize: '11px',
                          padding: '6px 12px'
                        }}
                      >
                        🗑️ Delete
                      </button>
                      
                      <button
                        onClick={() => {
                          const subject = encodeURIComponent('ZgenAI Account Rating Request');
                          const body = encodeURIComponent(`Dear ${user.full_name || user.email},\\n\\nWe would love to hear your feedback about your experience with ZgenAI platform!\\n\\nBest regards,\\nZgenAI Admin Team`);
                          window.open(`mailto:${user.email}?subject=${subject}&body=${body}`, '_blank');
                        }}
                        style={{
                          ...styles.btn('secondary'),
                          fontSize: '11px',
                          padding: '6px 12px'
                        }}
                      >
                        📧 Email
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280',
            fontSize: '18px'
          }}>
            <div style={{fontSize: '48px', marginBottom: '20px'}}>👥</div>
            <div style={{fontWeight: '600', marginBottom: '10px'}}>No users found</div>
            <div>Try adjusting your search criteria or create a new user</div>
          </div>
        )}
      </div>
    );
  };

  const renderAssignmentManagement = () => {
    const students = users.filter(user => user.role === 'student');
    const trainers = users.filter(user => user.role === 'trainer');
    const recruiters = users.filter(user => user.role === 'recruiter');

    return (
      <div style={{padding: '0'}}>
        {/* Assignment Management Header */}
        <div style={{
          padding: '25px', 
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', 
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          <h2 style={{margin: '0 0 10px 0', fontSize: '24px', fontWeight: '700'}}>
            🔄 Assignment Management
          </h2>
          <p style={{margin: 0, opacity: 0.9, fontSize: '16px'}}>
            Map recruiters and trainers to students • Manage relationships • Track connections
          </p>
        </div>

        {/* Controls */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
            <div style={{fontSize: '14px', color: '#64748b'}}>
              👥 {students.length} Students • 👨‍🏫 {trainers.length} Trainers • 🏢 {recruiters.length} Recruiters
            </div>
          </div>
          
          <button 
            onClick={() => setShowAssignmentModal(true)}
            style={{
              ...styles.btn('primary'),
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            ➕ Create Assignment
          </button>
        </div>

        {/* Current Assignments */}
        <div style={{padding: '20px'}}>
          {assignments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6b7280',
              fontSize: '18px'
            }}>
              <div style={{fontSize: '48px', marginBottom: '20px'}}>🔄</div>
              <div style={{fontWeight: '600', marginBottom: '10px'}}>No assignments yet</div>
              <div>Create assignments to map trainers and recruiters to students</div>
            </div>
          ) : (
            <div>
              <h3 style={{marginBottom: '20px', color: '#374151', fontSize: '18px', fontWeight: '600'}}>
                Current Assignments ({assignments.length})
              </h3>
              <div style={{
                display: 'grid',
                gap: '15px',
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
              }}>
                {assignments.map(assignment => (
                  <div key={assignment.id} style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px'}}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: assignment.assigned_user_role === 'trainer' ? '#7c3aed' : '#059669'
                      }}>
                        {assignment.assigned_user_role === 'trainer' ? '👨‍🏫' : '🏢'} {assignment.assigned_user_role.toUpperCase()}
                      </div>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                    
                    <div style={{marginBottom: '10px'}}>
                      <strong>Student:</strong> {assignment.student_name} ({assignment.student_email})
                    </div>
                    
                    <div style={{marginBottom: '10px'}}>
                      <strong>{assignment.assigned_user_role === 'trainer' ? 'Trainer' : 'Recruiter'}:</strong> {assignment.assigned_user_name} ({assignment.assigned_user_email})
                    </div>
                    
                    <div style={{fontSize: '12px', color: '#64748b'}}>
                      Created: {new Date(assignment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.corporateOverlay}></div>
      <div style={styles.wrapper}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={{position: 'absolute', top: 0, right: 0, left: 0, height: '100%', background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.02) 0%, rgba(124, 58, 237, 0.03) 100%)', zIndex: 0}}></div>
          <div style={{position: 'relative', zIndex: 1}}>
            <h1 style={styles.headerTitle}>🏢 Corporate Administration Panel</h1>
            <p style={styles.headerSubtitle}>Enterprise-Grade Application & User Management System</p>
            <div style={styles.corporateBadge}>
              ⭐ ENTERPRISE ADMIN • FULL CONTROL ACCESS
            </div>
          </div>
          
          {/* STATS */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <p style={styles.statNumber}>{pending.length}</p>
              <p style={styles.statLabel}>Pending Review</p>
            </div>
            <div style={{...styles.statCard, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'}}>
              <p style={styles.statNumber}>{approved.length}</p>
              <p style={styles.statLabel}>Approved</p>
            </div>
            <div style={{...styles.statCard, background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'}}>
              <p style={styles.statNumber}>{rejected.length}</p>
              <p style={styles.statLabel}>Rejected</p>
            </div>
            <div style={{...styles.statCard, background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'}}>
              <p style={styles.statNumber}>{applications.length}</p>
              <p style={styles.statLabel}>Total Applications</p>
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div style={styles.errorBox}>
            Error: {error}
            <button 
              onClick={loadApplications}
              style={{marginLeft: '12px', padding: '6px 12px', background: '#c53030', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'}}
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div style={{...styles.contentCard, padding: '60px 20px', textAlign: 'center', color: '#718096'}}>
            Loading applications...
          </div>
        )}

        {/* CONTENT */}
        {!loading && (
          <div style={styles.contentCard}>
            {/* TABS */}
            <div style={styles.tabContainer}>
              <button 
                style={styles.tab(activeTab === 'pending')}
                onClick={() => setActiveTab('pending')}
              >
                Pending Review ({pending.length})
              </button>
              <button 
                style={styles.tab(activeTab === 'approved')}
                onClick={() => setActiveTab('approved')}
              >
                Approved ({approved.length})
              </button>
              <button 
                style={styles.tab(activeTab === 'rejected')}
                onClick={() => setActiveTab('rejected')}
              >
                Rejected ({rejected.length})
              </button>
              <button 
                style={styles.tab(activeTab === 'users')}
                onClick={() => setActiveTab('users')}
              >
                User Management ({users.length})
              </button>
              <button 
                style={styles.tab(activeTab === 'assignments')}
                onClick={() => setActiveTab('assignments')}
              >
                Assignments ({assignments.length})
              </button>
            </div>

            {/* TAB CONTENT */}
            <div style={{padding: 0}}>
              {activeTab === 'pending' && renderApplicationsTable(pending, 'pending')}
              {activeTab === 'approved' && renderApplicationsTable(approved, 'approved')}
              {activeTab === 'rejected' && renderApplicationsTable(rejected, 'rejected')}
              {activeTab === 'users' && renderUserManagement()}
              {activeTab === 'assignments' && renderAssignmentManagement()}
            </div>
          </div>
        )}
      </div>

      {/* APPROVAL MODAL */}
      <div style={styles.modal} onClick={() => showModal && setShowModal(false)}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <h2 style={styles.modalTitle}>Approve Candidate</h2>
          <p style={styles.modalSubtitle}>Create login credentials for {selectedApp?.full_name}</p>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Candidate Email</label>
            <input 
              type="text"
              value={selectedApp?.email || ''}
              disabled
              style={{...styles.input, background: '#f7fafc', color: '#718096'}}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Temporary Password</label>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              style={styles.input}
            />
            <small style={{fontSize: '12px', color: '#718096', marginTop: '6px', display: 'block'}}>
              Student will be prompted to change password on first login
            </small>
          </div>

          <div style={styles.modalActions}>
            <button 
              onClick={submitApproval}
              style={{...styles.btn('approve'), flex: 1, padding: '12px'}}
            >
              Approve & Send Credentials
            </button>
            <button 
              onClick={() => setShowModal(false)}
              style={{...styles.btn('secondary'), flex: 1, padding: '12px'}}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* ENHANCED USER CREATION MODAL */}
      {showUserModal && (
        <div style={styles.modal} onClick={() => setShowUserModal(false)}>
          <div style={{...styles.modalContent, maxWidth: '600px'}} onClick={(e) => e.stopPropagation()}>
            <div style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
              color: 'white',
              padding: '25px',
              margin: '-30px -30px 25px -30px',
              borderRadius: '15px 15px 0 0'
            }}>
              <h2 style={{...styles.modalTitle, color: 'white', margin: '0 0 10px 0'}}>
                🚀 Create New User Account
              </h2>
              <p style={{...styles.modalSubtitle, color: 'rgba(255,255,255,0.9)', margin: 0}}>
                Corporate Admin • Full Platform Access Control
              </p>
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>👤 Full Name *</label>
              <input 
                type="text"
                value={userForm.name}
                onChange={e => setUserForm({...userForm, name: e.target.value})}
                placeholder="Enter full name"
                style={{...styles.input, fontSize: '16px', padding: '15px'}}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>📧 Email Address *</label>
              <input 
                type="email"
                value={userForm.email}
                onChange={e => setUserForm({...userForm, email: e.target.value})}
                placeholder="Enter email address"
                style={{...styles.input, fontSize: '16px', padding: '15px'}}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>📱 Phone Number</label>
              <input 
                type="text"
                value={userForm.phone}
                onChange={e => setUserForm({...userForm, phone: e.target.value})}
                placeholder="Enter phone number (optional)"
                style={{...styles.input, fontSize: '16px', padding: '15px'}}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>🎭 User Role *</label>
              <select 
                value={userForm.role}
                onChange={e => setUserForm({...userForm, role: e.target.value})}
                style={{...styles.input, fontSize: '16px', padding: '15px'}}
              >
                <option value="student">👨‍🎓 Student - Access to courses and applications</option>
                <option value="recruiter">💼 Recruiter - View and manage applications</option>
                <option value="trainer">🎓 Trainer - Manage approved students and training</option>
                <option value="admin">⚡ Admin - Full corporate control access</option>
              </select>
            </div>

            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #e9ecef',
              marginBottom: '25px'
            }}>
              <h4 style={{margin: '0 0 10px 0', color: '#495057', fontSize: '14px', fontWeight: '700'}}>
                🔐 Account Setup Details:
              </h4>
              <ul style={{margin: '0', paddingLeft: '20px', fontSize: '13px', color: '#6c757d', lineHeight: '1.6'}}>
                <li><strong>Default Password:</strong> "password123" (user will change on first login)</li>
                <li><strong>Welcome Email:</strong> Sent automatically with login credentials</li>
                <li><strong>Dashboard Access:</strong> {userForm.role} dashboard will be available immediately</li>
                <li><strong>Account Status:</strong> Active (ready to use)</li>
              </ul>
            </div>

            <div style={styles.modalActions}>
              <button 
                onClick={handleCreateUser}
                style={{
                  ...styles.btn('approve'), 
                  flex: 1, 
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: '700'
                }}
                disabled={!userForm.name || !userForm.email || !userForm.role}
              >
                {!userForm.name || !userForm.email || !userForm.role ? 
                  '⚠️ Fill Required Fields' : 
                  '🚀 Create Account & Send Email'
                }
              </button>
              <button 
                onClick={() => {
                  setShowUserModal(false);
                  setUserForm({ name: '', email: '', phone: '', role: 'student' });
                }}
                style={{...styles.btn('secondary'), flex: 1, padding: '15px', fontSize: '16px'}}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENT CREATION MODAL */}
      {showAssignmentModal && (
        <div style={styles.modal} onClick={() => setShowAssignmentModal(false)}>
          <div style={{...styles.modalContent, maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
            <div style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
              color: 'white',
              padding: '25px',
              margin: '-30px -30px 25px -30px',
              borderRadius: '15px 15px 0 0'
            }}>
              <h2 style={{...styles.modalTitle, color: 'white', margin: '0 0 10px 0'}}>
                🔄 Create Assignment
              </h2>
              <p style={{...styles.modalSubtitle, color: 'rgba(255,255,255,0.9)', margin: 0}}>
                Map trainers and recruiters to students for seamless collaboration
              </p>
            </div>

            <div style={{padding: '0'}}>
              <div style={{marginBottom: '20px'}}>
                <label style={styles.label}>Select Student</label>
                <select
                  value={assignmentForm.student_id}
                  onChange={(e) => setAssignmentForm({...assignmentForm, student_id: e.target.value})}
                  style={styles.input}
                  required
                >
                  <option value="">Choose student...</option>
                  {users.filter(user => user.role === 'student').map(student => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{marginBottom: '20px'}}>
                <label style={styles.label}>Assignment Type</label>
                <select
                  value={assignmentForm.assigned_user_role}
                  onChange={(e) => {
                    setAssignmentForm({
                      ...assignmentForm, 
                      assigned_user_role: e.target.value,
                      assigned_user_id: '' // Reset selected user when role changes
                    });
                  }}
                  style={styles.input}
                  required
                >
                  <option value="trainer">👨‍🏫 Assign Trainer</option>
                  <option value="recruiter">🏢 Assign Recruiter</option>
                </select>
              </div>

              <div style={{marginBottom: '30px'}}>
                <label style={styles.label}>
                  Select {assignmentForm.assigned_user_role === 'trainer' ? 'Trainer' : 'Recruiter'}
                </label>
                <select
                  value={assignmentForm.assigned_user_id}
                  onChange={(e) => setAssignmentForm({...assignmentForm, assigned_user_id: e.target.value})}
                  style={styles.input}
                  required
                >
                  <option value="">Choose {assignmentForm.assigned_user_role}...</option>
                  {users.filter(user => user.role === assignmentForm.assigned_user_role).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Details */}
              <div style={{
                padding: '20px',
                background: '#f8fafc',
                borderRadius: '12px',
                marginBottom: '25px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{margin: '0 0 15px 0', color: '#374151', fontSize: '16px', fontWeight: '600'}}>
                  ✨ What this assignment enables:
                </h4>
                <ul style={{margin: '0', paddingLeft: '20px', color: '#64748b', fontSize: '14px', lineHeight: '1.6'}}>
                  {assignmentForm.assigned_user_role === 'trainer' ? (
                    <>
                      <li><strong>Task Assignment:</strong> Trainer can create daily tasks for the student</li>
                      <li><strong>Progress Tracking:</strong> Monitor student task completion and progress</li>
                      <li><strong>Direct Communication:</strong> Seamless trainer-student interaction</li>
                      <li><strong>Dashboard Integration:</strong> Tasks appear in student dashboard</li>
                    </>
                  ) : (
                    <>
                      <li><strong>Data Sharing:</strong> Recruiter can upload Excel files for student</li>
                      <li><strong>Job Applications:</strong> Share company applications and status</li>
                      <li><strong>Direct Communication:</strong> Seamless recruiter-student interaction</li>
                      <li><strong>Dashboard Integration:</strong> Data appears in student dashboard</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button 
                onClick={handleCreateAssignment}
                style={{
                  ...styles.btn('approve'), 
                  flex: 1, 
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: '700'
                }}
                disabled={!assignmentForm.student_id || !assignmentForm.assigned_user_id || !assignmentForm.assigned_user_role}
              >
                {!assignmentForm.student_id || !assignmentForm.assigned_user_id ? 
                  '⚠️ Select Both Users' : 
                  '🚀 Create Assignment'
                }
              </button>
              <button 
                onClick={() => {
                  setShowAssignmentModal(false);
                  setAssignmentForm({ student_id: '', assigned_user_id: '', assigned_user_role: 'trainer' });
                }}
                style={{...styles.btn('secondary'), flex: 1, padding: '15px', fontSize: '16px'}}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

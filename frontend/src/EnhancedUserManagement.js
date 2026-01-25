import React, { useState, useEffect } from 'react';

const EnhancedUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: 'student' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadAssignments();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8080/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8080/api/assignments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.name?.trim() || !userForm.email?.trim() || !userForm.role) {
      alert('❌ Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email.trim())) {
      alert('❌ Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: userForm.name.trim(),
          email: userForm.email.trim().toLowerCase(),
          phone: userForm.phone?.trim() || '',
          role: userForm.role
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ USER CREATED SUCCESSFULLY!\n\n👤 ${result.user.full_name}\n📧 ${result.user.email}\n🎭 ${result.user.role.toUpperCase()}`);
        setUserForm({ name: '', email: '', phone: '', role: 'student' });
        setShowCreateModal(false);
        loadUsers();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to create user'}`);
      }
    } catch (error) {
      alert(`❌ Network Error: ${error.message}`);
    }
    setLoading(false);
  };

  const handleAssignTrainerToStudent = async (trainerId) => {
    if (!selectedStudent) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8080/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          assigned_user_id: trainerId,
          assigned_user_role: 'trainer'
        })
      });

      if (response.ok) {
        alert(`✅ Trainer assigned to ${selectedStudent.full_name} successfully!`);
        setShowAssignModal(false);
        setSelectedStudent(null);
        loadAssignments();
      } else {
        const error = await response.json();
        alert(`❌ Assignment failed: ${error.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const students = users.filter(u => u.role === 'student');
  const trainers = users.filter(u => u.role === 'trainer');
  const recruiters = users.filter(u => u.role === 'recruiter');

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🚀 Enhanced User Management System</h1>
        <button 
          style={styles.createBtn}
          onClick={() => setShowCreateModal(true)}
        >
          ➕ Create New User
        </button>
      </div>

      {/* Quick Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👨‍🎓</div>
          <div style={styles.statInfo}>
            <div style={styles.statNumber}>{students.length}</div>
            <div style={styles.statLabel}>Students</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👨‍🏫</div>
          <div style={styles.statInfo}>
            <div style={styles.statNumber}>{trainers.length}</div>
            <div style={styles.statLabel}>Trainers</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div style={styles.statInfo}>
            <div style={styles.statNumber}>{recruiters.length}</div>
            <div style={styles.statLabel}>Recruiters</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statInfo}>
            <div style={styles.statNumber}>{assignments.length}</div>
            <div style={styles.statLabel}>Assignments</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={styles.tableContainer}>
        <h2 style={styles.sectionTitle}>All Users</h2>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={styles.tableRow}>
                <td style={styles.td}>{user.full_name}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.roleBadge,
                    backgroundColor: 
                      user.role === 'admin' ? '#ef4444' :
                      user.role === 'trainer' ? '#10b981' :
                      user.role === 'recruiter' ? '#f59e0b' : '#3b82f6'
                  }}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td style={styles.td}>{user.phone || 'N/A'}</td>
                <td style={styles.td}>
                  {user.role === 'student' && (
                    <button 
                      style={styles.actionBtn}
                      onClick={() => {
                        setSelectedStudent(user);
                        setShowAssignModal(true);
                      }}
                    >
                      👨‍🏫 Assign Trainer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>🚀 Create New User</h2>
              <button style={styles.closeBtn} onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  style={styles.input}
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  placeholder="user@example.com"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone</label>
                <input
                  type="tel"
                  style={styles.input}
                  value={userForm.phone}
                  onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                  placeholder="Phone number"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Role *</label>
                <select
                  style={styles.select}
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                >
                  <option value="student">👨‍🎓 Student</option>
                  <option value="trainer">👨‍🏫 Trainer</option>
                  <option value="recruiter">👥 Recruiter</option>
                  <option value="admin">⚙️ Admin</option>
                </select>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button 
                style={styles.submitBtn} 
                onClick={handleCreateUser}
                disabled={loading}
              >
                {loading ? '⏳ Creating...' : '✅ Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Trainer Modal */}
      {showAssignModal && selectedStudent && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>👨‍🏫 Assign Trainer to {selectedStudent.full_name}</h2>
              <button style={styles.closeBtn} onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <h3>Available Trainers:</h3>
              {trainers.length === 0 ? (
                <p>No trainers available. Please create trainer accounts first.</p>
              ) : (
                trainers.map(trainer => (
                  <div key={trainer.id} style={styles.trainerCard}>
                    <div>
                      <strong>{trainer.full_name}</strong>
                      <br />
                      <small>{trainer.email}</small>
                    </div>
                    <button 
                      style={styles.assignBtn}
                      onClick={() => handleAssignTrainerToStudent(trainer.id)}
                    >
                      ✅ Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: 'Inter, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    color: 'white'
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700'
  },
  createBtn: {
    padding: '12px 24px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  statIcon: {
    fontSize: '32px'
  },
  statInfo: {
    textAlign: 'left'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b'
  },
  statLabel: {
    fontSize: '14px',
    color: '#64748b'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#1e293b'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    backgroundColor: '#f8fafc'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb'
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '12px',
    color: '#374151'
  },
  roleBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase'
  },
  actionBtn: {
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#64748b'
  },
  modalBody: {
    marginBottom: '20px'
  },
  inputGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '600',
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    boxSizing: 'border-box'
  },
  modalFooter: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  trainerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    marginBottom: '10px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px'
  },
  assignBtn: {
    padding: '6px 12px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
};

export default EnhancedUserManagement;
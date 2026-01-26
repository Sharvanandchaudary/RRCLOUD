import React, { useState, useEffect } from 'react';

const UserAssignmentManager = () => {
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedRecruiter, setSelectedRecruiter] = useState('');
  const [assignmentType, setAssignmentType] = useState('trainer-student');
  const [notes, setNotes] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchUsers();
    fetchAssignments();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchUsers = async () => {
    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Users data:', data);
      
      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(`Failed to fetch users: ${error.message}`);
      setUsers([]);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/assignments`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let assignmentData = {};
      
      if (assignmentType === 'trainer-student' && selectedStudent && selectedTrainer) {
        assignmentData = {
          student_id: parseInt(selectedStudent),
          assigned_user_id: parseInt(selectedTrainer),
          assigned_user_role: 'trainer',
          notes: notes
        };
      } else if (assignmentType === 'recruiter-student' && selectedStudent && selectedRecruiter) {
        assignmentData = {
          student_id: parseInt(selectedStudent),
          assigned_user_id: parseInt(selectedRecruiter),
          assigned_user_role: 'recruiter',
          notes: notes
        };
      } else {
        throw new Error('Please select valid users for assignment');
      }

      console.log('Assignment data:', assignmentData);

      const response = await fetch(`${API_BASE_URL}/api/assignments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentData)
      });

      const result = await response.json();
      console.log('Assignment response:', result);

      if (response.ok) {
        setSuccess('User assignment created successfully!');
        setSelectedStudent('');
        setSelectedTrainer('');
        setSelectedRecruiter('');
        setNotes('');
        fetchAssignments(); // Refresh assignments
      } else {
        throw new Error(result.error || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getUsersByRole = (role) => {
    return users.filter(user => user.role === role);
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.full_name || user.name : 'Unknown User';
  };

  const getUserRole = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.role : 'unknown';
  };

  if (loading && users.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>Loading users...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>👥 User Assignment Manager</h2>
        <p style={styles.subtitle}>Assign trainers to students and recruiters to candidates</p>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <span style={styles.alertIcon}>❌</span>
          {error}
        </div>
      )}

      {success && (
        <div style={styles.successAlert}>
          <span style={styles.alertIcon}>✅</span>
          {success}
        </div>
      )}

      <div style={styles.assignmentForm}>
        <h3 style={styles.sectionTitle}>Create New Assignment</h3>
        
        <form onSubmit={handleAssignUser} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Assignment Type:</label>
            <select
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value)}
              style={styles.select}
            >
              <option value="trainer-student">Assign Trainer to Student</option>
              <option value="recruiter-student">Assign Recruiter to Student</option>
            </select>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Student:</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                style={styles.select}
                required
              >
                <option value="">-- Choose Student --</option>
                {getUsersByRole('student').map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {assignmentType === 'trainer-student' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Trainer:</label>
                <select
                  value={selectedTrainer}
                  onChange={(e) => setSelectedTrainer(e.target.value)}
                  style={styles.select}
                  required
                >
                  <option value="">-- Choose Trainer --</option>
                  {getUsersByRole('trainer').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {assignmentType === 'recruiter-student' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Recruiter:</label>
                <select
                  value={selectedRecruiter}
                  onChange={(e) => setSelectedRecruiter(e.target.value)}
                  style={styles.select}
                  required
                >
                  <option value="">-- Choose Recruiter --</option>
                  {getUsersByRole('recruiter').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Notes (Optional):</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={styles.textarea}
              placeholder="Add any notes about this assignment..."
              rows="3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {})
            }}
          >
            {loading ? '🔄 Creating Assignment...' : '✨ Create Assignment'}
          </button>
        </form>
      </div>

      {/* User Summary */}
      <div style={styles.userSummary}>
        <h3 style={styles.sectionTitle}>User Summary</h3>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>👨‍🎓</div>
            <div style={styles.summaryInfo}>
              <div style={styles.summaryNumber}>{getUsersByRole('student').length}</div>
              <div style={styles.summaryLabel}>Students</div>
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>👨‍🏫</div>
            <div style={styles.summaryInfo}>
              <div style={styles.summaryNumber}>{getUsersByRole('trainer').length}</div>
              <div style={styles.summaryLabel}>Trainers</div>
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>👨‍💼</div>
            <div style={styles.summaryInfo}>
              <div style={styles.summaryNumber}>{getUsersByRole('recruiter').length}</div>
              <div style={styles.summaryLabel}>Recruiters</div>
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon}>🔗</div>
            <div style={styles.summaryInfo}>
              <div style={styles.summaryNumber}>{assignments.length}</div>
              <div style={styles.summaryLabel}>Assignments</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Assignments */}
      <div style={styles.assignmentsSection}>
        <h3 style={styles.sectionTitle}>Current Assignments</h3>
        {assignments.length > 0 ? (
          <div style={styles.assignmentsTable}>
            <div style={styles.tableHeader}>
              <div style={styles.headerCell}>Student</div>
              <div style={styles.headerCell}>Assigned To</div>
              <div style={styles.headerCell}>Role</div>
              <div style={styles.headerCell}>Created</div>
            </div>
            {assignments.map(assignment => (
              <div key={assignment.id} style={styles.tableRow}>
                <div style={styles.tableCell}>
                  <span style={styles.studentBadge}>
                    👨‍🎓 {getUserName(assignment.student_id)}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  {getUserName(assignment.assigned_user_id)}
                </div>
                <div style={styles.tableCell}>
                  <span style={{
                    ...styles.roleBadge,
                    ...(assignment.assigned_user_role === 'trainer' ? styles.trainerBadge : styles.recruiterBadge)
                  }}>
                    {assignment.assigned_user_role === 'trainer' ? '👨‍🏫' : '👨‍💼'} {assignment.assigned_user_role}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  {new Date(assignment.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📋</div>
            <div style={styles.emptyText}>No assignments created yet</div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    backgroundColor: '#f8f9fa',
    padding: '30px',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6c757d',
    margin: 0,
  },
  loadingSpinner: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#6c757d',
  },
  errorAlert: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #f5c6cb',
    display: 'flex',
    alignItems: 'center',
  },
  successAlert: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #c3e6cb',
    display: 'flex',
    alignItems: 'center',
  },
  alertIcon: {
    marginRight: '10px',
    fontSize: '16px',
  },
  assignmentForm: {
    backgroundColor: '#ffffff',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
    marginBottom: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '20px',
    borderBottom: '2px solid #3498db',
    paddingBottom: '10px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  formGroup: {
    flex: 1,
    minWidth: '250px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.3s ease',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    resize: 'vertical',
    fontFamily: 'Arial, sans-serif',
  },
  submitButton: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '15px 30px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    alignSelf: 'flex-start',
  },
  submitButtonDisabled: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed',
  },
  userSummary: {
    marginBottom: '30px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  summaryIcon: {
    fontSize: '32px',
    marginRight: '15px',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#6c757d',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  assignmentsSection: {
    backgroundColor: '#ffffff',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  assignmentsTable: {
    width: '100%',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 120px 120px',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerCell: {
    fontSize: '14px',
    textTransform: 'uppercase',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 120px 120px',
    gap: '15px',
    padding: '15px',
    borderBottom: '1px solid #e9ecef',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: '14px',
    color: '#2c3e50',
  },
  studentBadge: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  roleBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  trainerBadge: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  },
  recruiterBadge: {
    backgroundColor: '#fff3e0',
    color: '#ef6c00',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#6c757d',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '10px',
  },
  emptyText: {
    fontSize: '16px',
  }
};

export default UserAssignmentManager;
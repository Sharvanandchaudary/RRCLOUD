import React, { useState, useEffect } from 'react';

export default function AdminStudentManagement() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const apiUrl = backendUrl ? `${backendUrl}/applications` : '/applications';

      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      } else {
        setError('Failed to fetch applications');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStudent = (student) => {
    setSelectedStudent(student);
    setTempPassword('');
    setPasswordError('');
    setShowModal(true);
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    if (!/[A-Z]/.test(pwd)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[0-9]/.test(pwd)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const submitApproval = async () => {
    if (!validatePassword(tempPassword)) return;

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const apiUrl = backendUrl 
        ? `${backendUrl}/api/applications/${selectedStudent.id}/approve` 
        : `/api/applications/${selectedStudent.id}/approve`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: tempPassword,
          approvedBy: 'admin@rrcloud.com' // Would be actual admin email
        })
      });

      if (res.ok) {
        alert('✅ Student approved and account created!');
        setShowModal(false);
        setSelectedStudent(null);
        fetchApplications();
      } else {
        const errData = await res.json();
        alert('Error: ' + (errData.error || 'Failed to approve'));
      }
    } catch (err) {
      console.error(err);
      alert('Connection error');
    }
  };

  const handleRejectStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to reject this application?')) return;

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const apiUrl = backendUrl 
        ? `${backendUrl}/api/applications/${studentId}/reject` 
        : `/api/applications/${studentId}/reject`;

      const res = await fetch(apiUrl, { method: 'POST' });

      if (res.ok) {
        alert('Application rejected');
        fetchApplications();
      } else {
        alert('Failed to reject application');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error');
    }
  };

  const styles = {
    container: {
      padding: '30px',
      background: '#f5f7fa',
      minHeight: '100vh'
    },
    title: {
      fontSize: '28px',
      fontWeight: '800',
      color: '#0f172a',
      marginBottom: '30px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      background: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
    },
    th: {
      background: '#0f172a',
      color: 'white',
      padding: '15px',
      textAlign: 'left',
      fontWeight: '600',
      fontSize: '14px'
    },
    td: {
      padding: '15px',
      borderBottom: '1px solid #e2e8f0',
      fontSize: '14px',
      color: '#1a202c'
    },
    statusApproved: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      background: '#dcfce7',
      color: '#166534',
      fontSize: '12px',
      fontWeight: '600'
    },
    statusPending: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      background: '#fef3c7',
      color: '#92400e',
      fontSize: '12px',
      fontWeight: '600'
    },
    statusRejected: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      background: '#fee2e2',
      color: '#991b1b',
      fontSize: '12px',
      fontWeight: '600'
    },
    actionBtn: {
      padding: '8px 15px',
      margin: '0 5px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '600'
    },
    approveBtn: {
      background: '#10b981',
      color: 'white'
    },
    rejectBtn: {
      background: '#ef4444',
      color: 'white'
    },
    modal: {
      display: showModal ? 'flex' : 'none',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: 'white',
      padding: '40px',
      borderRadius: '8px',
      maxWidth: '500px',
      width: '90%',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
    },
    modalTitle: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '20px'
    },
    input: {
      width: '100%',
      padding: '12px',
      margin: '10px 0',
      border: '1px solid #cbd5e1',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box'
    },
    errorText: {
      color: '#dc2626',
      fontSize: '12px',
      marginTop: '5px',
      marginBottom: '10px'
    },
    modalButtons: {
      display: 'flex',
      gap: '10px',
      marginTop: '20px'
    },
    saveBtn: {
      flex: 1,
      padding: '12px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '600'
    },
    cancelBtn: {
      flex: 1,
      padding: '12px',
      background: '#cbd5e1',
      color: '#1a202c',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '600'
    },
    noData: {
      textAlign: 'center',
      padding: '40px',
      color: '#64748b'
    }
  };

  if (loading) {
    return <div style={styles.container}><div style={styles.noData}>Loading applications...</div></div>;
  }

  const pendingApplications = applications.filter(app => !app.is_approved && app.status === 'pending');
  const approvedApplications = applications.filter(app => app.is_approved);
  const rejectedApplications = applications.filter(app => app.status === 'rejected');

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Student Applications Management</h1>

      {/* Pending Applications */}
      <div style={{marginBottom: '40px'}}>
        <h2 style={{fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '15px'}}>
          ⏳ Pending Applications ({pendingApplications.length})
        </h2>
        {pendingApplications.length === 0 ? (
          <div style={{...styles.noData, background: 'white', borderRadius: '8px'}}>No pending applications</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Resume</th>
                <th style={styles.th}>Applied</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingApplications.map(app => (
                <tr key={app.id}>
                  <td style={styles.td}><strong>{app.full_name}</strong></td>
                  <td style={styles.td}>{app.email}</td>
                  <td style={styles.td}>{app.phone || '-'}</td>
                  <td style={styles.td}>
                    {app.resume_path ? (
                      <a href={app.resume_path} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration: 'none', fontWeight: '600'}}>
                        📄 Download
                      </a>
                    ) : (
                      <span style={{color: '#999'}}>No File</span>
                    )}
                  </td>
                  <td style={styles.td}>{new Date(app.created_at).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <button 
                      style={{...styles.actionBtn, ...styles.approveBtn}}
                      onClick={() => handleApproveStudent(app)}
                    >
                      ✅ Approve & Setup
                    </button>
                    <button 
                      style={{...styles.actionBtn, ...styles.rejectBtn}}
                      onClick={() => handleRejectStudent(app.id)}
                    >
                      ❌ Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Approved Applications */}
      <div style={{marginBottom: '40px'}}>
        <h2 style={{fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '15px'}}>
          ✅ Approved Students ({approvedApplications.length})
        </h2>
        {approvedApplications.length === 0 ? (
          <div style={{...styles.noData, background: 'white', borderRadius: '8px'}}>No approved students yet</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Resume</th>
                <th style={styles.th}>Approved Date</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {approvedApplications.map(app => (
                <tr key={app.id}>
                  <td style={styles.td}><strong>{app.full_name}</strong></td>
                  <td style={styles.td}>{app.email}</td>
                  <td style={styles.td}>
                    {app.resume_path ? (
                      <a href={app.resume_path} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration: 'none', fontWeight: '600'}}>
                        📄 Download
                      </a>
                    ) : (
                      <span style={{color: '#999'}}>No File</span>
                    )}
                  </td>
                  <td style={styles.td}>{app.approved_date ? new Date(app.approved_date).toLocaleDateString() : '-'}</td>
                  <td style={styles.td}><span style={styles.statusApproved}>APPROVED</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rejected Applications */}
      {rejectedApplications.length > 0 && (
        <div>
          <h2 style={{fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '15px'}}>
            ❌ Rejected Applications ({rejectedApplications.length})
          </h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Resume</th>
                <th style={styles.th}>Rejection Date</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rejectedApplications.map(app => (
                <tr key={app.id}>
                  <td style={styles.td}><strong>{app.full_name}</strong></td>
                  <td style={styles.td}>{app.email}</td>
                  <td style={styles.td}>
                    {app.resume_path ? (
                      <a href={app.resume_path} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration: 'none', fontWeight: '600'}}>
                        📄 Download
                      </a>
                    ) : (
                      <span style={{color: '#999'}}>No File</span>
                    )}
                  </td>
                  <td style={styles.td}>{new Date(app.created_at).toLocaleDateString()}</td>
                  <td style={styles.td}><span style={styles.statusRejected}>REJECTED</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <div style={styles.modalTitle}>
            🔐 Set Account Password for {selectedStudent?.full_name}
          </div>
          <p style={{color: '#475569', marginBottom: '15px', fontSize: '14px'}}>
            Set a temporary password for this student's account. They will be required to create a new password on first login.
          </p>
          
          <div>
            <label style={{display: 'block', fontWeight: '600', marginBottom: '5px'}}>Temporary Password</label>
            <input
              type="password"
              style={styles.input}
              placeholder="Enter secure temporary password"
              value={tempPassword}
              onChange={(e) => {
                setTempPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
            />
            {passwordError && <div style={styles.errorText}>❌ {passwordError}</div>}
            <div style={{fontSize: '12px', color: '#64748b', marginTop: '10px'}}>
              ✓ At least 6 characters<br/>
              ✓ At least 1 uppercase letter<br/>
              ✓ At least 1 number
            </div>
          </div>

          <div style={styles.modalButtons}>
            <button 
              style={styles.saveBtn}
              onClick={submitApproval}
            >
              ✅ Approve & Create Account
            </button>
            <button 
              style={styles.cancelBtn}
              onClick={() => {
                setShowModal(false);
                setSelectedStudent(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const url = backendUrl ? `${backendUrl}/applications` : '/applications';
      
      console.log('🔄 Loading from:', url);
      const res = await fetch(url);
      console.log('📊 Status:', res.status);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      let data = await res.json();
      console.log('✅ Loaded', data.length, 'applications');
      
      // Ensure is_approved field
      data = data.map(app => ({
        ...app,
        is_approved: app.is_approved || false
      }));
      
      setApplications(data);
    } catch (err) {
      console.error('❌ Error:', err);
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
        body: JSON.stringify({ password, approvedBy: 'admin@zgenai.com' })
      });

      if (!res.ok) throw new Error('Approval failed');

      const data = await res.json();
      console.log('✅ Approved:', data);

      alert(`✅ APPROVED!\n\n📧 Email to send to student:\n\nTo: ${selectedApp.email}\nSubject: Your Account is Ready!\n\nEmail: ${selectedApp.email}\nPassword: ${password}\nLogin: https://rrcloud-frontend-nsmgws4u4a-uc.a.run.app/student-login`);

      setShowModal(false);
      setSelectedApp(null);
      loadApplications();
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

      alert('✅ Application rejected');
      loadApplications();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Styles
  const styles = {
    container: {
      padding: '30px 20px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: '#f8f9fa'
    },
    header: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#1a202c',
      marginBottom: '30px'
    },
    section: {
      marginBottom: '40px'
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#2d3748',
      marginBottom: '15px',
      paddingBottom: '10px',
      borderBottom: '2px solid #3182ce'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      background: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    th: {
      background: '#2d3748',
      color: 'white',
      padding: '15px',
      textAlign: 'left',
      fontWeight: 'bold'
    },
    td: {
      padding: '12px 15px',
      borderBottom: '1px solid #e2e8f0'
    },
    badge: (bg, color) => ({
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      background: bg,
      color: color
    }),
    btn: (bg) => ({
      padding: '8px 16px',
      marginRight: '5px',
      border: 'none',
      borderRadius: '4px',
      background: bg,
      color: 'white',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 'bold'
    }),
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
      zIndex: 1000
    },
    modalContent: {
      background: 'white',
      padding: '30px',
      borderRadius: '8px',
      maxWidth: '400px',
      width: '90%'
    }
  };

  const pending = getPendingApps();
  const approved = getApprovedApps();
  const rejected = getRejectedApps();

  return (
    <div style={styles.container}>
      <div style={styles.header}>👔 Hiring Dashboard - Candidate Management</div>

      {error && (
        <div style={{
          background: '#fed7d7',
          color: '#c53030',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          ❌ Error: {error}
          <button 
            onClick={loadApplications}
            style={{marginLeft: '10px', padding: '5px 15px', background: '#c53030', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
          >
            Retry
          </button>
        </div>
      )}

      {loading && <div style={{textAlign: 'center', color: '#666'}}>⏳ Loading applications...</div>}

      {!loading && (
        <>
          {/* PENDING APPLICATIONS */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>⏳ PENDING APPLICATIONS ({pending.length})</div>
            {pending.length === 0 ? (
              <div style={{color: '#666', padding: '20px', textAlign: 'center'}}>No pending applications</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Applied</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(app => (
                    <tr key={app.id}>
                      <td style={styles.td}><strong>{app.full_name}</strong></td>
                      <td style={styles.td}>{app.email}</td>
                      <td style={styles.td}>{app.phone}</td>
                      <td style={styles.td}>{new Date(app.created_at).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <button 
                          onClick={() => handleApprove(app)}
                          style={styles.btn('#10b981')}
                        >
                          ✅ Approve
                        </button>
                        <button 
                          onClick={() => handleReject(app.id)}
                          style={styles.btn('#ef4444')}
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

          {/* APPROVED APPLICATIONS */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>✅ APPROVED CANDIDATES ({approved.length})</div>
            {approved.length === 0 ? (
              <div style={{color: '#666', padding: '20px', textAlign: 'center'}}>No approved candidates yet</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Approved Date</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.map(app => (
                    <tr key={app.id}>
                      <td style={styles.td}><strong>{app.full_name}</strong></td>
                      <td style={styles.td}>{app.email}</td>
                      <td style={styles.td}>
                        <span style={styles.badge('#dcfce7', '#166534')}>ENROLLED</span>
                      </td>
                      <td style={styles.td}>{app.approved_date ? new Date(app.approved_date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* REJECTED APPLICATIONS */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>❌ REJECTED APPLICATIONS ({rejected.length})</div>
            {rejected.length === 0 ? (
              <div style={{color: '#666', padding: '20px', textAlign: 'center'}}>No rejected applications</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Rejected Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rejected.map(app => (
                    <tr key={app.id}>
                      <td style={styles.td}><strong>{app.full_name}</strong></td>
                      <td style={styles.td}>{app.email}</td>
                      <td style={styles.td}>{new Date(app.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* APPROVAL MODAL */}
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <h2>Approve Candidate</h2>
          <p><strong>{selectedApp?.full_name}</strong></p>
          <p>{selectedApp?.email}</p>
          <label style={{display: 'block', marginBottom: '10px'}}>
            <strong>Create Password for Student:</strong>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              style={{width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box'}}
            />
          </label>
          <div style={{display: 'flex', gap: '10px'}}>
            <button 
              onClick={submitApproval}
              style={{flex: 1, padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
            >
              ✅ Approve & Send Email
            </button>
            <button 
              onClick={() => setShowModal(false)}
              style={{flex: 1, padding: '10px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

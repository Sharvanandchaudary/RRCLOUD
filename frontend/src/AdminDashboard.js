import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

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

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
      padding: '24px'
    },
    wrapper: {
      maxWidth: '1800px',
      margin: '0 auto'
    },
    header: {
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(10px)',
      padding: '32px',
      borderRadius: '12px',
      boxShadow: '0 2px 20px rgba(0, 0, 0, 0.08)',
      marginBottom: '24px',
      border: '1px solid rgba(226, 232, 240, 0.5)'
    },
    headerTitle: {
      fontSize: '32px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: '0 0 12px 0',
      letterSpacing: '-0.5px'
    },
    headerSubtitle: {
      fontSize: '16px',
      color: '#64748b',
      margin: 0,
      fontWeight: '400'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      marginTop: '32px'
    },
    statCard: {
      background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
      color: 'white',
      padding: '28px',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: '0 4px 16px rgba(30, 64, 175, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default'
    },
    statNumber: {
      fontSize: '36px',
      fontWeight: '700',
      margin: '0 0 8px 0',
      letterSpacing: '-0.5px'
    },
    statLabel: {
      fontSize: '13px',
      fontWeight: '600',
      margin: 0,
      opacity: 0.95,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
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
                    href={`https://rrcloud-backend-415414350152.us-central1.run.app${app.resume_path}`}
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
                  <span style={{color: '#9ca3af', fontSize: '13px', fontStyle: 'italic'}}>No resume uploaded</span>
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
                </td>
              )}
              {type === 'approved' && (
                <td style={styles.td}>
                  {app.approved_date ? new Date(app.approved_date).toLocaleDateString() : 'N/A'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Administration Panel</h1>
          <p style={styles.headerSubtitle}>Candidate Application Management System</p>
          
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
            </div>

            {/* TAB CONTENT */}
            <div style={{padding: activeTab === 'pending' ? 0 : 0}}>
              {activeTab === 'pending' && renderApplicationsTable(pending, 'pending')}
              {activeTab === 'approved' && renderApplicationsTable(approved, 'approved')}
              {activeTab === 'rejected' && renderApplicationsTable(rejected, 'rejected')}
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
    </div>
  );
}

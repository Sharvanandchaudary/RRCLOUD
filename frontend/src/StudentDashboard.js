import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchUserProfile(token);
  }, [navigate]);

  const fetchUserProfile = async (token) => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const apiUrl = backendUrl ? `${backendUrl}/auth/me` : '/auth/me';

      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // Fetch application details
        await fetchApplicationDetails(data.user.email, token);
      } else {
        setError('Failed to fetch profile');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      console.error(err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationDetails = async (email, token) => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const apiUrl = backendUrl 
        ? `${backendUrl}/api/applications/${email}` 
        : `/api/applications/${email}`;

      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setApplication(data);
        setFormData({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          about_me: data.about_me || ''
        });
      }
    } catch (err) {
      console.error('Error fetching application:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/');
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const apiUrl = backendUrl 
        ? `${backendUrl}/api/applications/${application.id}` 
        : `/api/applications/${application.id}`;

      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const updated = await res.json();
        setApplication(updated);
        setEditMode(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error');
    }
  };

  if (loading) {
    return <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading...</div>;
  }

  if (error) {
    return <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red'}}>{error}</div>;
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif"
    },
    wrapper: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 32px',
      background: 'white',
      borderRadius: '12px',
      marginBottom: '30px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1a202c',
      margin: 0
    },
    logoutBtn: {
      padding: '10px 20px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'background 0.2s ease'
    },
    card: {
      background: 'white',
      padding: '32px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      marginBottom: '24px'
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1a202c',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '2px solid #e2e8f0'
    },
    infoRow: {
      display: 'grid',
      gridTemplateColumns: '160px 1fr',
      gap: '24px',
      marginBottom: '20px',
      alignItems: 'start'
    },
    label: {
      fontWeight: '600',
      color: '#475569',
      fontSize: '13px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    value: {
      color: '#1a202c',
      fontSize: '15px',
      lineHeight: '1.6'
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      border: '1px solid #cbd5e0',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box',
      marginBottom: '12px',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s ease'
    },
    textarea: {
      width: '100%',
      padding: '12px 14px',
      border: '1px solid #cbd5e0',
      borderRadius: '6px',
      fontSize: '14px',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      minHeight: '120px',
      marginBottom: '12px',
      transition: 'border-color 0.2s ease'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px'
    },
    btnPrimary: {
      padding: '12px 24px',
      background: '#667eea',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'background 0.2s ease'
    },
    btnSecondary: {
      padding: '12px 24px',
      background: '#e2e8f0',
      color: '#1a202c',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'background 0.2s ease'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '8px 16px',
      borderRadius: '20px',
      fontWeight: '600',
      fontSize: '13px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background: application?.is_approved ? '#dcfce7' : '#fef3c7',
      color: application?.is_approved ? '#166534' : '#92400e'
    },
    congratulationsBox: {
      padding: '24px',
      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      borderRadius: '8px',
      border: '2px solid #0284c7',
      marginTop: '20px',
      marginBottom: '20px'
    },
    congratulationsTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#0c4a6e',
      marginBottom: '12px'
    },
    congratulationsText: {
      color: '#0c4a6e',
      fontSize: '14px',
      lineHeight: '1.6'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginTop: '30px'
    },
    statCard: {
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: '2px solid #f0f4f8'
    },
    statNumber: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#667eea',
      margin: '0 0 12px 0'
    },
    statLabel: {
      fontSize: '13px',
      color: '#475569',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    headerActions: {
      display: 'flex',
      gap: '12px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📚 Student Dashboard</h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>

      {/* Welcome Card */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Welcome, {user?.full_name}!</div>
        <div style={styles.infoRow}>
          <span style={styles.label}>Email:</span>
          <span style={styles.value}>{user?.email}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.label}>Role:</span>
          <span style={{...styles.value, textTransform: 'capitalize'}}>{user?.role}</span>
        </div>
      </div>

      {/* Application Status */}
      {application && (
        <div style={styles.card}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <div style={styles.sectionTitle}>Application Status</div>
            {!editMode && <button style={styles.editBtn} onClick={() => setEditMode(true)}>✏️ Edit Profile</button>}
          </div>

          {editMode ? (
            <>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', fontWeight: '600', marginBottom: '5px'}}>Full Name</label>
                <input 
                  type="text" 
                  style={styles.input}
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', fontWeight: '600', marginBottom: '5px'}}>Email</label>
                <input 
                  type="email" 
                  style={styles.input}
                  value={formData.email}
                  disabled
                />
              </div>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', fontWeight: '600', marginBottom: '5px'}}>Phone</label>
                <input 
                  type="text" 
                  style={styles.input}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', fontWeight: '600', marginBottom: '5px'}}>About Me</label>
                <textarea 
                  style={styles.textarea}
                  value={formData.about_me}
                  onChange={(e) => setFormData({...formData, about_me: e.target.value})}
                />
              </div>
              <div style={styles.buttonGroup}>
                <button style={styles.saveBtn} onClick={handleSaveProfile}>💾 Save Changes</button>
                <button style={styles.cancelBtn} onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div style={styles.infoRow}>
                <span style={styles.label}>Full Name:</span>
                <span style={styles.value}>{application.full_name}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Email:</span>
                <span style={styles.value}>{application.email}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Phone:</span>
                <span style={styles.value}>{application.phone || 'Not provided'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Enrollment Status:</span>
                <span style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  background: application.is_approved ? '#dcfce7' : '#fef3c7',
                  color: application.is_approved ? '#166534' : '#92400e'
                }}>
                  {application.is_approved ? '✅ ENROLLED' : '⏳ PENDING REVIEW'}
                </span>
              </div>
              {application.is_approved && (
                <div style={{...styles.infoRow, marginTop: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #0284c7'}}>
                  <div style={{fontSize: '16px', fontWeight: 'bold', color: '#0c4a6e', marginBottom: '10px'}}>🎉 Congratulations!</div>
                  <div style={{color: '#0c4a6e', fontSize: '14px', lineHeight: '1.6'}}>
                    You have been selected for enrollment. Your account is now active. 
                    You can access all program resources and materials through this dashboard.
                    {application.approved_date && ` Enrollment approved on ${new Date(application.approved_date).toLocaleDateString()}`}
                  </div>
                </div>
              )}
              <div style={styles.infoRow}>
                <span style={styles.label}>Applied Date:</span>
                <span style={styles.value}>{new Date(application.created_at).toLocaleDateString()}</span>
              </div>
              {application.about_me && (
                <div style={styles.infoRow}>
                  <span style={styles.label}>About Me:</span>
                  <span style={styles.value}>{application.about_me}</span>
                </div>
              )}
              {application.resume_path && (
                <div style={styles.infoRow}>
                  <span style={styles.label}>Resume:</span>
                  <a href={application.resume_path} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration: 'none', fontWeight: '600'}}>
                    📄 Download Resume
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {application && (
        <div style={{maxWidth: '1000px', margin: '0 auto'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px'}}>
            <div style={{...styles.card, textAlign: 'center', padding: '30px'}}>
              <div style={{fontSize: '32px', fontWeight: '800', color: '#3b82f6'}}>
                {application.is_approved ? '✅' : '⏳'}
              </div>
              <div style={{fontSize: '14px', color: '#475569', marginTop: '10px'}}>
                {application.is_approved ? 'Account Approved' : 'Under Review'}
              </div>
            </div>
            <div style={{...styles.card, textAlign: 'center', padding: '30px'}}>
              <div style={{fontSize: '32px', fontWeight: '800', color: '#10b981'}}>
                📄
              </div>
              <div style={{fontSize: '14px', color: '#475569', marginTop: '10px'}}>
                Documents Submitted
              </div>
            </div>
            <div style={{...styles.card, textAlign: 'center', padding: '30px'}}>
              <div style={{fontSize: '32px', fontWeight: '800', color: '#f59e0b'}}>
                🔔
              </div>
              <div style={{fontSize: '14px', color: '#475569', marginTop: '10px'}}>
                Updates: 0 New
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

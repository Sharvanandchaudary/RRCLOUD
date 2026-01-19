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
      padding: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      background: 'white',
      borderRadius: '8px',
      marginBottom: '30px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '1000px',
      margin: '0 auto 30px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '800',
      color: '#0f172a',
      margin: 0
    },
    logoutBtn: {
      padding: '10px 20px',
      background: '#dc2626',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '600'
    },
    card: {
      background: 'white',
      padding: '40px',
      borderRadius: '8px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      maxWidth: '1000px',
      margin: '0 auto 30px'
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '20px',
      borderBottom: '2px solid #3b82f6',
      paddingBottom: '10px'
    },
    infoRow: {
      display: 'grid',
      gridTemplateColumns: '150px 1fr',
      gap: '20px',
      marginBottom: '15px',
      alignItems: 'start'
    },
    label: {
      fontWeight: '600',
      color: '#475569',
      fontSize: '14px'
    },
    value: {
      color: '#1a202c',
      fontSize: '15px'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #cbd5e1',
      borderRadius: '4px',
      fontSize: '15px',
      boxSizing: 'border-box',
      marginBottom: '10px'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #cbd5e1',
      borderRadius: '4px',
      fontSize: '15px',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      minHeight: '100px',
      marginBottom: '10px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      marginTop: '20px'
    },
    saveBtn: {
      padding: '12px 30px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '600'
    },
    cancelBtn: {
      padding: '12px 30px',
      background: '#cbd5e1',
      color: '#1a202c',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '600'
    },
    editBtn: {
      padding: '10px 20px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '600'
    },
    status: {
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
      background: application?.is_approved ? '#dcfce7' : '#fef3c7',
      color: application?.is_approved ? '#166534' : '#92400e'
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
          <span style={styles.value} style={{textTransform: 'capitalize'}}>{user?.role}</span>
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
                <span style={styles.label}>Status:</span>
                <span style={styles.status}>
                  {application.is_approved ? '✅ Approved' : '⏳ Pending Review'}
                </span>
              </div>
              {application.approved_date && (
                <div style={styles.infoRow}>
                  <span style={styles.label}>Approved Date:</span>
                  <span style={styles.value}>{new Date(application.approved_date).toLocaleDateString()}</span>
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

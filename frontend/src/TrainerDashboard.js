import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TrainerDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignedStudents, setAssignedStudents] = useState([]);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    
    if (!token || user.role !== 'trainer') {
      navigate('/login');
      return;
    }

    fetchAssignments();
  }, [navigate]);

  const fetchAssignments = async () => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
      const token = localStorage.getItem('auth_token');
      
      // Fetch assigned students
      const assignmentsResponse = await fetch(`${backendUrl}/api/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (assignmentsResponse.ok) {
        const assignments = await assignmentsResponse.json();
        setAssignedStudents(assignments);
        console.log('👨‍🏫 Assigned students:', assignments);
        
        // Fetch applications for assigned students
        const appsResponse = await fetch(`${backendUrl}/api/applications`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (appsResponse.ok) {
          const allApps = await appsResponse.json();
          const studentEmails = assignments.map(a => a.student_email);
          const filteredApps = allApps.filter(app => studentEmails.includes(app.email) && app.is_approved);
          setApplications(filteredApps);
          console.log('📊 Training students:', filteredApps.length);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/');
  };

  const stats = {
    total: applications.length,
    active: applications.filter(app => app.is_approved).length
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
      fontFamily: "'Inter', sans-serif"
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
      padding: '20px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    logoText: {
      fontSize: '28px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    },
    welcomeText: {
      color: '#64748b',
      fontSize: '14px',
      fontWeight: '500'
    },
    logoutBtn: {
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s ease'
    },
    main: {
      padding: '40px',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    title: {
      fontSize: '36px',
      fontWeight: '800',
      color: '#1e293b',
      marginBottom: '8px',
      letterSpacing: '-0.5px'
    },
    subtitle: {
      color: '#64748b',
      fontSize: '18px',
      marginBottom: '40px',
      fontWeight: '400'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      marginBottom: '40px'
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '32px',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'transform 0.2s ease'
    },
    statNumber: {
      fontSize: '42px',
      fontWeight: '800',
      marginBottom: '8px',
      color: '#7c3aed'
    },
    statLabel: {
      color: '#64748b',
      fontSize: '16px',
      fontWeight: '600',
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
    cardHeader: {
      padding: '32px 32px 0'
    },
    cardTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '16px'
    },
    tableContainer: {
      padding: '0 32px 32px',
      overflowX: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      background: 'transparent'
    },
    th: {
      padding: '20px 16px',
      textAlign: 'left',
      color: '#374151',
      fontSize: '14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      borderBottom: '2px solid #e2e8f0'
    },
    td: {
      padding: '20px 16px',
      borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
      fontSize: '15px',
      color: '#1e293b'
    },
    contactBtn: {
      display: 'inline-block',
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      border: 'none',
      cursor: 'pointer'
    },
    noData: {
      textAlign: 'center',
      padding: '80px 40px',
      color: '#64748b',
      fontSize: '16px'
    },
    loading: {
      textAlign: 'center',
      padding: '80px 40px',
      fontSize: '18px',
      color: '#64748b'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoText}>ZgenAI</span>
          </div>
        </div>
        <div style={styles.loading}>
          🔄 Loading training dashboard...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoText}>ZgenAI</span>
        </div>
        <div style={styles.userInfo}>
          <div>
            <div style={styles.welcomeText}>🎓 Training Portal</div>
          </div>
          <button
            onClick={handleLogout}
            style={styles.logoutBtn}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={styles.main}>
        <h1 style={styles.title}>Training Management</h1>
        <p style={styles.subtitle}>Manage and coordinate training for approved students</p>

        {/* Stats Overview */}
        <div style={styles.statsGrid}>
          <div 
            style={styles.statCard}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={styles.statNumber}>{stats.active}</div>
            <div style={styles.statLabel}>Students in Training</div>
          </div>
          <div 
            style={styles.statCard}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={styles.statNumber}>100%</div>
            <div style={styles.statLabel}>Active Participation</div>
          </div>
        </div>

        {/* Assigned Students */}
        {assignedStudents.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '40px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🎓 My Assigned Students ({assignedStudents.length})
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {assignedStudents.map((student, idx) => (
                <div key={idx} style={{
                  background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #c7d2fe',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '8px'
                  }}>
                    {student.student_name || student.full_name || 'Student'}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '4px'
                  }}>
                    📧 {student.student_email || student.email}
                  </div>
                  {student.phone && (
                    <div style={{
                      fontSize: '13px',
                      color: '#64748b'
                    }}>
                      📱 {student.phone}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students Table */}
        <div style={styles.contentCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>🎓 Students Ready for Training</h3>
          </div>

          <div style={styles.tableContainer}>
            {applications.length === 0 ? (
              <div style={styles.noData}>
                📋 No approved students available for training yet
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Student</th>
                    <th style={styles.th}>Contact Information</th>
                    <th style={styles.th}>Approved Date</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id}>
                      <td style={styles.td}>
                        <div style={{fontWeight: '600', color: '#1e293b', marginBottom: '4px'}}>
                          {app.full_name}
                        </div>
                        <div style={{fontSize: '13px', color: '#64748b'}}>
                          Student ID: {app.id}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{marginBottom: '4px'}}>{app.email}</div>
                        <div style={{fontSize: '13px', color: '#64748b'}}>
                          {app.phone || 'No phone provided'}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {app.approved_date ? 
                          new Date(app.approved_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 
                          '-'
                        }
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => {
                            const subject = `ZgenAI Training Program - Welcome ${app.full_name}`;
                            const body = `Dear ${app.full_name},\n\nWelcome to the ZgenAI Training Program! We're excited to have you join our learning community.\n\nYour training coordinator will contact you shortly with program details and schedule.\n\nBest regards,\nZgenAI Training Team`;
                            window.location.href = `mailto:${app.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                          }}
                          style={styles.contactBtn}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          📧 Contact Student
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
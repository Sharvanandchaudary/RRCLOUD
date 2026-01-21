import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    
    if (!token || user.role !== 'recruiter') {
      navigate('/login');
      return;
    }

    fetchApplications();
  }, [navigate]);

  const fetchApplications = async () => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const apiUrl = backendUrl ? `${backendUrl}/applications` : '/applications';
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/');
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (activeTab) {
      case 'approved':
        return matchesSearch && app.is_approved;
      case 'pending':
        return matchesSearch && !app.is_approved;
      default:
        return matchesSearch;
    }
  });

  const stats = {
    total: applications.length,
    approved: applications.filter(app => app.is_approved).length,
    pending: applications.filter(app => !app.is_approved).length
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
      background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
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
      color: '#1e293b'
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
      padding: '32px 32px 0',
      borderBottom: 'none'
    },
    searchContainer: {
      marginBottom: '24px'
    },
    searchInput: {
      width: '100%',
      padding: '16px 20px',
      fontSize: '16px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.8)',
      outline: 'none',
      transition: 'all 0.2s ease'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      background: 'rgba(248, 250, 252, 0.8)',
      borderRadius: '12px',
      padding: '4px'
    },
    tab: (isActive) => ({
      flex: 1,
      padding: '12px 16px',
      textAlign: 'center',
      border: 'none',
      background: isActive 
        ? 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' 
        : 'transparent',
      color: isActive ? 'white' : '#64748b',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s ease'
    }),
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
    statusBadge: (approved) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      background: approved ? '#dcfce7' : '#fef3c7',
      color: approved ? '#166534' : '#92400e'
    }),
    resumeBtn: {
      display: 'inline-block',
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      transition: 'all 0.2s ease'
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
          🔄 Loading candidate applications...
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
            <div style={styles.welcomeText}>💼 Recruiter Portal</div>
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
        <h1 style={styles.title}>Talent Pipeline</h1>
        <p style={styles.subtitle}>Review and evaluate candidate applications</p>

        {/* Stats Overview */}
        <div style={styles.statsGrid}>
          <div 
            style={styles.statCard}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={styles.statNumber}>{stats.total}</div>
            <div style={styles.statLabel}>Total Applications</div>
          </div>
          <div 
            style={styles.statCard}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={{...styles.statNumber, color: '#059669'}}>{stats.approved}</div>
            <div style={styles.statLabel}>Approved Candidates</div>
          </div>
          <div 
            style={styles.statCard}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div style={{...styles.statNumber, color: '#d97706'}}>{stats.pending}</div>
            <div style={styles.statLabel}>Pending Review</div>
          </div>
        </div>

        {/* Applications Table */}
        <div style={styles.contentCard}>
          <div style={styles.cardHeader}>
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="🔍 Search candidates by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <div style={styles.tabs}>
              <button
                style={styles.tab(activeTab === 'all')}
                onClick={() => setActiveTab('all')}
              >
                All Candidates ({stats.total})
              </button>
              <button
                style={styles.tab(activeTab === 'pending')}
                onClick={() => setActiveTab('pending')}
              >
                Pending ({stats.pending})
              </button>
              <button
                style={styles.tab(activeTab === 'approved')}
                onClick={() => setActiveTab('approved')}
              >
                Approved ({stats.approved})
              </button>
            </div>
          </div>

          <div style={styles.tableContainer}>
            {filteredApplications.length === 0 ? (
              <div style={styles.noData}>
                {searchTerm ? 
                  `🔍 No candidates found matching "${searchTerm}"` : 
                  `📋 No ${activeTab === 'all' ? '' : activeTab + ' '}applications available`
                }
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Candidate</th>
                    <th style={styles.th}>Contact</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Resume</th>
                    <th style={styles.th}>Applied Date</th>
                    {activeTab === 'approved' && <th style={styles.th}>Approved Date</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map(app => (
                    <tr key={app.id}>
                      <td style={styles.td}>
                        <div style={{fontWeight: '600', color: '#1e293b', marginBottom: '4px'}}>
                          {app.full_name}
                        </div>
                        <div style={{fontSize: '13px', color: '#64748b'}}>
                          ID: {app.id}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{marginBottom: '4px'}}>{app.email}</div>
                        <div style={{fontSize: '13px', color: '#64748b'}}>
                          {app.phone || 'No phone provided'}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(app.is_approved)}>
                          {app.is_approved ? '✅ Approved' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {app.resume_path ? (
                          <a
                            href={`https://rrcloud-backend-415414350152.us-central1.run.app/uploads/${app.resume_path.split('/').pop()}`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.resumeBtn}
                            onMouseOver={(e) => {
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            📄 Download
                          </a>
                        ) : (
                          <span style={{color: '#9ca3af', fontSize: '13px', fontStyle: 'italic'}}>
                            No resume
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {new Date(app.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      {activeTab === 'approved' && (
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
                      )}
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
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
      const apiUrl = backendUrl ? `${backendUrl}/auth/login` : '/auth/login';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Store token + user in localStorage
        if (data.token) localStorage.setItem('auth_token', data.token);
        if (data.user) localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        // Route based on role
        switch (role) {
          case 'student':
            navigate('/student-dashboard');
            break;
          case 'recruiter':
            navigate('/recruiter-dashboard');
            break;
          case 'trainer':
            navigate('/trainer-dashboard');
            break;
          case 'admin':
            navigate('/admin');
            break;
          default:
            navigate('/student-dashboard');
        }
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Invalid credentials or insufficient permissions');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Inter', sans-serif"
    },
    loginCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '48px',
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    logo: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    logoText: {
      fontSize: '32px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#64748b',
      fontSize: '16px',
      fontWeight: '500'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '4px'
    },
    input: {
      padding: '16px 20px',
      fontSize: '16px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      background: '#fff',
      transition: 'all 0.2s ease',
      outline: 'none',
      fontFamily: 'inherit'
    },
    inputFocus: {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    select: {
      padding: '16px 20px',
      fontSize: '16px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      background: '#fff',
      cursor: 'pointer',
      outline: 'none',
      fontFamily: 'inherit'
    },
    button: {
      padding: '18px 24px',
      fontSize: '16px',
      fontWeight: '700',
      color: 'white',
      background: loading ? '#9ca3af' : 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
      border: 'none',
      borderRadius: '12px',
      cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      transform: loading ? 'none' : 'translateY(0)',
      boxShadow: loading ? 'none' : '0 4px 14px rgba(30, 64, 175, 0.3)'
    },
    error: {
      background: '#fee2e2',
      color: '#dc2626',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      border: '1px solid #fecaca'
    },
    roleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginTop: '8px'
    },
    roleOption: (isSelected) => ({
      padding: '12px 16px',
      textAlign: 'center',
      border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
      borderRadius: '8px',
      background: isSelected ? '#eff6ff' : '#fff',
      color: isSelected ? '#1e40af' : '#6b7280',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s ease'
    }),
    backLink: {
      textAlign: 'center',
      marginTop: '24px'
    },
    backLinkText: {
      color: '#6b7280',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'color 0.2s ease'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <div style={styles.logo}>
          <h1 style={styles.logoText}>ZgenAI</h1>
          <p style={styles.subtitle}>Professional Portal Access</p>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Access Role</label>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '8px'}}>
              <div
                style={styles.roleOption(role === 'student')}
                onClick={() => !loading && setRole('student')}
              >
                👨‍🎓 Student
              </div>
              <div
                style={styles.roleOption(role === 'recruiter')}
                onClick={() => !loading && setRole('recruiter')}
              >
                💼 Recruiter
              </div>
              <div
                style={styles.roleOption(role === 'trainer')}
                onClick={() => !loading && setRole('trainer')}
              >
                🎓 Trainer
              </div>
              <div
                style={styles.roleOption(role === 'admin')}
                onClick={() => !loading && setRole('admin')}
              >
                ⚡ Admin
              </div>
            </div>
          </div>

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(30, 64, 175, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 14px rgba(30, 64, 175, 0.3)';
              }
            }}
          >
            {loading ? (
              <>
                <span>🔄</span> Authenticating...
              </>
            ) : (
              <>
                <span>🚀</span> Access {role.charAt(0).toUpperCase() + role.slice(1)} Portal
              </>
            )}
          </button>
        </form>

        <div style={styles.backLink}>
          <a href="/" style={styles.backLinkText}>
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
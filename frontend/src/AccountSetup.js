import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AccountSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/student-login');
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
      } else {
        navigate('/student-login');
      }
    } catch (err) {
      console.error(err);
      navigate('/student-login');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(pwd)) errors.push('At least one uppercase letter');
    if (!/[a-z]/.test(pwd)) errors.push('At least one lowercase letter');
    if (!/[0-9]/.test(pwd)) errors.push('At least one number');
    if (!/[!@#$%^&*]/.test(pwd)) errors.push('At least one special character (!@#$%^&*)');
    return errors;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError('Password must contain: ' + passwordErrors.join(', '));
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const apiUrl = backendUrl 
        ? `${backendUrl}/auth/change-password` 
        : '/auth/change-password';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (res.ok) {
        setSuccess('✅ Password changed successfully!');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => navigate('/student-dashboard'), 2000);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to change password');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error');
    }
  };

  if (loading) {
    return <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading...</div>;
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    card: {
      background: 'white',
      padding: '50px',
      borderRadius: '8px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      maxWidth: '500px',
      width: '100%'
    },
    title: {
      fontSize: '28px',
      fontWeight: '800',
      color: '#0f172a',
      marginBottom: '10px',
      textAlign: 'center'
    },
    subtitle: {
      fontSize: '14px',
      color: '#64748b',
      textAlign: 'center',
      marginBottom: '30px'
    },
    infoBox: {
      background: '#f0f9ff',
      border: '1px solid #bfdbfe',
      padding: '15px',
      borderRadius: '6px',
      marginBottom: '30px'
    },
    infoLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#1e40af',
      textTransform: 'uppercase',
      marginBottom: '5px'
    },
    infoValue: {
      fontSize: '15px',
      color: '#0f172a',
      fontWeight: '600'
    },
    button: {
      width: '100%',
      padding: '12px',
      background: '#667eea',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '15px',
      marginTop: '20px',
      transition: '0.3s'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #cbd5e1',
      borderRadius: '6px',
      fontSize: '14px',
      marginBottom: '15px',
      boxSizing: 'border-box',
      fontFamily: 'inherit'
    },
    error: {
      background: '#fee2e2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '15px',
      fontSize: '14px'
    },
    success: {
      background: '#dcfce7',
      border: '1px solid #bbf7d0',
      color: '#166534',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '15px',
      fontSize: '14px'
    },
    requirementsList: {
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      padding: '15px',
      borderRadius: '6px',
      marginTop: '15px',
      fontSize: '13px',
      color: '#475569'
    },
    skipButton: {
      background: '#cbd5e1',
      color: '#1a202c',
      marginTop: '10px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>🔐 Account Setup</div>
        <div style={styles.subtitle}>Complete your account setup to get started</div>

        {/* User Info */}
        <div style={styles.infoBox}>
          <div style={styles.infoLabel}>Your Email</div>
          <div style={styles.infoValue}>{user?.email}</div>
        </div>

        {error && <div style={styles.error}>❌ {error}</div>}
        {success && <div style={styles.success}>✅ {success}</div>}

        {!showPasswordForm ? (
          <div>
            <div style={{background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '6px', marginBottom: '20px'}}>
              <p style={{margin: 0, fontSize: '14px', color: '#166534'}}>
                Welcome! Your account has been created by the administrator. <br/>
                <strong>Please change your temporary password to secure your account.</strong>
              </p>
            </div>

            <button style={styles.button} onClick={() => setShowPasswordForm(true)}>
              🔑 Change Password
            </button>

            <button 
              style={{...styles.button, ...styles.skipButton}} 
              onClick={() => navigate('/student-dashboard')}
            >
              Skip for Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleChangePassword}>
            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', fontWeight: '600', marginBottom: '5px', fontSize: '14px'}}>
                Temporary Password
              </label>
              <input
                type="password"
                style={styles.input}
                placeholder="Enter your temporary password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', fontWeight: '600', marginBottom: '5px', fontSize: '14px'}}>
                New Password
              </label>
              <input
                type="password"
                style={styles.input}
                placeholder="Create a new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                required
              />
            </div>

            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', fontWeight: '600', marginBottom: '5px', fontSize: '14px'}}>
                Confirm Password
              </label>
              <input
                type="password"
                style={styles.input}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div style={styles.requirementsList}>
              <strong style={{display: 'block', marginBottom: '8px'}}>Password Requirements:</strong>
              <div>✓ At least 8 characters</div>
              <div>✓ At least one uppercase letter (A-Z)</div>
              <div>✓ At least one lowercase letter (a-z)</div>
              <div>✓ At least one number (0-9)</div>
              <div>✓ At least one special character (!@#$%^&*)</div>
            </div>

            <button type="submit" style={styles.button}>
              ✅ Confirm & Continue
            </button>

            <button 
              type="button"
              style={{...styles.button, ...styles.skipButton}}
              onClick={() => {
                setShowPasswordForm(false);
                setError('');
                setSuccess('');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              Cancel
            </button>
          </form>
        )}

        <div style={{textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#64748b'}}>
          You can always change your password later in your dashboard settings.
        </div>
      </div>
    </div>
  );
}

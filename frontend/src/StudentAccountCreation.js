import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function StudentAccountCreation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    if (!token) {
      setError('No setup token provided. Please check your email for the setup link.');
      setLoading(false);
      return;
    }

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
      const apiUrl = backendUrl ? `${backendUrl}/auth/verify-setup-token` : '/auth/verify-setup-token';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (res.ok) {
        const data = await res.json();
        setStudentInfo(data);
        setTokenValid(true);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Invalid or expired setup link');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to verify setup link');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(pwd)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(pwd)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[0-9]/.test(pwd)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    if (!/[!@#$%^&*]/.test(pwd)) {
      setPasswordError('Password must contain at least one special character (!@#$%^&*)');
      return false;
    }
    if (pwd !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    if (!validatePassword(password)) return;

    setSubmitting(true);
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
      const apiUrl = backendUrl ? `${backendUrl}/auth/create-account-from-token` : '/auth/create-account-from-token';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/student-login');
        }, 2000);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to create account');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '40px',
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
      marginBottom: '30px',
      textAlign: 'center'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#1a202c',
      marginBottom: '8px'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #cbd5e1',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box',
      fontFamily: 'inherit'
    },
    inputFocus: {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    errorText: {
      color: '#dc2626',
      fontSize: '12px',
      marginTop: '5px'
    },
    requirementsList: {
      fontSize: '12px',
      color: '#64748b',
      marginTop: '15px',
      padding: '12px',
      background: '#f8fafc',
      borderRadius: '6px',
      lineHeight: '1.6'
    },
    requirementItem: {
      marginBottom: '4px'
    },
    button: {
      width: '100%',
      padding: '12px',
      background: '#667eea',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '25px',
      transition: 'background 0.3s'
    },
    buttonDisabled: {
      background: '#cbd5e1',
      cursor: 'not-allowed'
    },
    successBox: {
      background: '#dcfce7',
      color: '#166534',
      padding: '15px',
      borderRadius: '6px',
      marginBottom: '20px',
      textAlign: 'center',
      fontWeight: '600'
    },
    errorBox: {
      background: '#fee2e2',
      color: '#991b1b',
      padding: '15px',
      borderRadius: '6px',
      marginBottom: '20px'
    },
    infoBox: {
      background: '#dbeafe',
      color: '#1e40af',
      padding: '15px',
      borderRadius: '6px',
      marginBottom: '20px',
      fontSize: '14px'
    },
    loadingText: {
      textAlign: 'center',
      color: '#64748b',
      padding: '40px 20px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loadingText}>🔄 Verifying your setup link...</div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.title}>⚠️ Invalid Link</div>
          <div style={styles.errorBox}>{error}</div>
          <p style={{textAlign: 'center', color: '#64748b', fontSize: '14px'}}>
            Please contact the administrator for a new setup link.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successBox}>✅ Account Created Successfully!</div>
          <p style={{textAlign: 'center', color: '#64748b', marginBottom: '20px'}}>
            Your account has been created. Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>🔐 Create Your Account</div>
        <div style={styles.subtitle}>Welcome, {studentInfo?.fullName}!</div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.infoBox}>
          📧 Email: <strong>{studentInfo?.email}</strong>
        </div>

        <form onSubmit={handleCreateAccount}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Create Password</label>
            <input
              type="password"
              style={styles.input}
              placeholder="Enter secure password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              style={styles.input}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              required
            />
            {passwordError && <div style={styles.errorText}>❌ {passwordError}</div>}
          </div>

          <div style={styles.requirementsList}>
            <strong>Password Requirements:</strong>
            <div style={styles.requirementItem}>✓ At least 8 characters</div>
            <div style={styles.requirementItem}>✓ At least 1 uppercase letter (A-Z)</div>
            <div style={styles.requirementItem}>✓ At least 1 lowercase letter (a-z)</div>
            <div style={styles.requirementItem}>✓ At least 1 number (0-9)</div>
            <div style={styles.requirementItem}>✓ At least 1 special character (!@#$%^&*)</div>
          </div>

          <button
            type="submit"
            style={{...styles.button, ...(submitting ? styles.buttonDisabled : {})}}
            disabled={submitting}
          >
            {submitting ? '⏳ Creating Account...' : '✅ Create Account'}
          </button>
        </form>

        <p style={{textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '20px'}}>
          Already have an account? <a href="/student-login" style={{color: '#667eea', textDecoration: 'none', fontWeight: '600'}}>Login here</a>
        </p>
      </div>
    </div>
  );
}

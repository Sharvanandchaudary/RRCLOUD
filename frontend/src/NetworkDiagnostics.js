import React, { useState, useEffect } from 'react';

const NetworkDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState({});
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  // Force local URLs when running in development mode
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE_URL = isLocal ? 'http://localhost:8080' : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

  const runDiagnostics = async () => {
    setLoading(true);
    setTestResults([]);
    const results = [];

    try {
      // Test 1: Health Check
      results.push({ test: 'Backend Health Check', status: 'running', message: 'Testing...' });
      setTestResults([...results]);

      const healthResponse = await fetch(`${API_BASE_URL}/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        results[0] = { test: 'Backend Health Check', status: 'success', message: `✅ Backend is healthy - ${healthData.status}` };
      } else {
        results[0] = { test: 'Backend Health Check', status: 'error', message: `❌ Health check failed - ${healthResponse.status}` };
      }
      setTestResults([...results]);

      // Test 2: Authentication
      results.push({ test: 'Authentication Test', status: 'running', message: 'Testing login...' });
      setTestResults([...results]);

      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@zgenai.com',
          password: 'admin123'
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        results[1] = { test: 'Authentication Test', status: 'success', message: '✅ Authentication working', token: loginData.token };
      } else {
        results[1] = { test: 'Authentication Test', status: 'error', message: `❌ Authentication failed - ${loginResponse.status}` };
      }
      setTestResults([...results]);

      // Test 3: User Creation (if auth successful)
      if (results[1].status === 'success') {
        results.push({ test: 'User Creation Test', status: 'running', message: 'Testing user creation...' });
        setTestResults([...results]);

        const userResponse = await fetch(`${API_BASE_URL}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${results[1].token}`
          },
          body: JSON.stringify({
            name: `Diagnostic Test User ${Date.now()}`,
            email: `diagnostic${Date.now()}@test.com`,
            phone: '555-TEST',
            role: 'student'
          })
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          results[2] = { test: 'User Creation Test', status: 'success', message: `✅ User creation working - Created user ID ${userData.user?.id}` };
        } else {
          const errorText = await userResponse.text();
          results[2] = { test: 'User Creation Test', status: 'error', message: `❌ User creation failed - ${userResponse.status}: ${errorText}` };
        }
        setTestResults([...results]);
      }

      // Test 4: Network Information
      results.push({ 
        test: 'Network Information', 
        status: 'info', 
        message: `
Running Mode: ${isLocal ? '🏠 LOCAL DEVELOPMENT' : '☁️ PRODUCTION'}
Frontend URL: ${window.location.origin}
Backend URL: ${API_BASE_URL}
Production Backend: ${process.env.REACT_APP_API_URL || 'Not configured'}
Connection: ${navigator.onLine ? 'Online' : 'Offline'}
Browser: ${navigator.userAgent}
        `.trim()
      });
      setTestResults([...results]);

    } catch (error) {
      console.error('Diagnostic error:', error);
      results.push({ 
        test: 'Network Error', 
        status: 'error', 
        message: `❌ Network error: ${error.message}` 
      });
      setTestResults([...results]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🔧 Network Diagnostics</h2>
        <p style={styles.subtitle}>Diagnose connection issues between frontend and backend</p>
        <button 
          onClick={runDiagnostics} 
          disabled={loading}
          style={{
            ...styles.refreshButton,
            ...(loading ? styles.refreshButtonDisabled : {})
          }}
        >
          {loading ? '🔄 Running Tests...' : '🔄 Run Diagnostics'}
        </button>
      </div>

      <div style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <div 
            key={index} 
            style={{
              ...styles.resultCard,
              ...(result.status === 'success' ? styles.successCard : {}),
              ...(result.status === 'error' ? styles.errorCard : {}),
              ...(result.status === 'running' ? styles.runningCard : {}),
              ...(result.status === 'info' ? styles.infoCard : {})
            }}
          >
            <div style={styles.resultHeader}>
              <h3 style={styles.resultTitle}>{result.test}</h3>
              <span style={styles.resultStatus}>
                {result.status === 'success' && '✅'}
                {result.status === 'error' && '❌'}
                {result.status === 'running' && '⏳'}
                {result.status === 'info' && 'ℹ️'}
              </span>
            </div>
            <pre style={styles.resultMessage}>{result.message}</pre>
          </div>
        ))}

        {!loading && testResults.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <div style={styles.emptyText}>Click "Run Diagnostics" to test your connection</div>
          </div>
        )}
      </div>

      <div style={styles.troubleshooting}>
        <h3 style={styles.troubleshootingTitle}>🚨 Common Issues & Solutions</h3>
        <div style={styles.troubleshootingGrid}>
          <div style={styles.troubleshootingCard}>
            <h4 style={styles.troubleshootingCardTitle}>❌ Backend Health Check Failed</h4>
            <ul style={styles.troubleshootingList}>
              <li>Check if backend server is running on port 8080</li>
              <li>Run: <code>cd /Users/admin/RRCLOUD/backend && node server.js</code></li>
              <li>Check for port conflicts</li>
            </ul>
          </div>
          
          <div style={styles.troubleshootingCard}>
            <h4 style={styles.troubleshootingCardTitle}>🔐 Authentication Failed</h4>
            <ul style={styles.troubleshootingList}>
              <li>Check if admin user exists in database</li>
              <li>Verify JWT_SECRET environment variable</li>
              <li>Check database connection</li>
            </ul>
          </div>

          <div style={styles.troubleshootingCard}>
            <h4 style={styles.troubleshootingCardTitle}>👤 User Creation Failed</h4>
            <ul style={styles.troubleshootingList}>
              <li>Check authentication token validity</li>
              <li>Verify database user permissions</li>
              <li>Check for email uniqueness constraints</li>
            </ul>
          </div>

          <div style={styles.troubleshootingCard}>
            <h4 style={styles.troubleshootingCardTitle}>🌐 Network Errors</h4>
            <ul style={styles.troubleshootingList}>
              <li>Check CORS configuration in backend</li>
              <li>Verify API_BASE_URL setting</li>
              <li>Test with browser developer tools</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    backgroundColor: '#f8f9fa',
    padding: '30px',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6c757d',
    margin: '0 0 20px 0',
  },
  refreshButton: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  refreshButtonDisabled: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed',
  },
  resultsContainer: {
    marginBottom: '30px',
  },
  resultCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
    marginBottom: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  successCard: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff9',
  },
  errorCard: {
    borderColor: '#dc3545',
    backgroundColor: '#fff8f8',
  },
  runningCard: {
    borderColor: '#ffc107',
    backgroundColor: '#fffef8',
  },
  infoCard: {
    borderColor: '#17a2b8',
    backgroundColor: '#f8fdff',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  resultTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: 0,
  },
  resultStatus: {
    fontSize: '20px',
  },
  resultMessage: {
    fontSize: '14px',
    color: '#495057',
    margin: 0,
    whiteSpace: 'pre-wrap',
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '4px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#6c757d',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '10px',
  },
  emptyText: {
    fontSize: '16px',
  },
  troubleshooting: {
    backgroundColor: '#ffffff',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  troubleshootingTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '20px',
    borderBottom: '2px solid #e74c3c',
    paddingBottom: '10px',
  },
  troubleshootingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  troubleshootingCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  troubleshootingCardTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '15px',
  },
  troubleshootingList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#495057',
  }
};

export default NetworkDiagnostics;
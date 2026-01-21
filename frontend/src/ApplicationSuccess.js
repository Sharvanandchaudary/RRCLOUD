import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ApplicationSuccess() {
  const navigate = useNavigate();

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    fontFamily: 'Arial, sans-serif'
  };

  const cardStyle = {
    maxWidth: '500px',
    padding: '50px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    textAlign: 'center'
  };

  const iconStyle = {
    fontSize: '64px',
    color: '#22c55e',
    marginBottom: '20px'
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: '16px'
  };

  const messageStyle = {
    fontSize: '16px',
    color: '#64748b',
    lineHeight: '1.6',
    marginBottom: '30px'
  };

  const buttonStyle = {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>✅</div>
        <h1 style={titleStyle}>Application Submitted Successfully!</h1>
        <p style={messageStyle}>
          Thank you for your interest in ZgenAI. We have received your application 
          and our team will review it carefully. You will receive an email notification 
          once a decision has been made.
        </p>
        <div style={{marginBottom: '20px'}}>
          <p style={{fontSize: '14px', color: '#9ca3af'}}>
            Expected review time: 2-3 business days
          </p>
        </div>
        <button 
          style={buttonStyle}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          onClick={() => navigate('/')}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
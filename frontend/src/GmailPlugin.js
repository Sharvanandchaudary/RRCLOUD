import React, { useState, useEffect } from 'react';

const GmailPlugin = () => {
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [composeModal, setComposeModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEmail, setNewEmail] = useState({
    to: '',
    subject: '',
    body: '',
    attachments: []
  });

  // Smart URL detection
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE_URL = isLocal ? 'http://localhost:8080' : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

  useEffect(() => {
    fetchEmails();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Simulate Gmail API integration
      const mockEmails = [
        {
          id: 1,
          from: 'trainer@rrcloud.com',
          to: 'student@example.com',
          subject: '🎯 New Task Assignment - React Components',
          body: 'Hi! I have assigned you a new task on React components. Please check your task dashboard for details. Due date is next Friday.',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          priority: 'high',
          type: 'task-assignment'
        },
        {
          id: 2,
          from: 'admin@rrcloud.com',
          to: 'student@example.com',
          subject: '📢 Welcome to RRCLOUD Training Platform',
          body: 'Welcome to our training platform! Your account has been successfully created. You can now access your dashboard and start your learning journey.',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'medium',
          type: 'welcome'
        },
        {
          id: 3,
          from: 'trainer@rrcloud.com',
          to: 'student@example.com',
          subject: '✅ Task Completed - Feedback Available',
          body: 'Great job on your recent submission! I have reviewed your work and provided feedback. Check your task dashboard for detailed comments.',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'medium',
          type: 'feedback'
        },
        {
          id: 4,
          from: 'system@rrcloud.com',
          to: 'student@example.com',
          subject: '⏰ Reminder - Assignment Due Tomorrow',
          body: 'This is a reminder that your assignment "Database Design Principles" is due tomorrow. Please make sure to submit it on time.',
          date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          read: false,
          priority: 'high',
          type: 'reminder'
        }
      ];

      // Simulate API delay
      setTimeout(() => {
        setEmails(mockEmails);
        setIsLoading(false);
      }, 1000);

    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Failed to load emails');
      setIsLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!newEmail.to || !newEmail.subject || !newEmail.body) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      
      // Simulate sending email via backend
      const response = await fetch(`${API_BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newEmail)
      });

      if (response.ok) {
        alert('📧 Email sent successfully!');
        setComposeModal(false);
        setNewEmail({ to: '', subject: '', body: '', attachments: [] });
        fetchEmails(); // Refresh emails
      } else {
        throw new Error('Failed to send email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      alert('❌ Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (emailId) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, read: true } : email
    ));
  };

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = emails.filter(email => !email.read).length;

  const getEmailTypeIcon = (type) => {
    const icons = {
      'task-assignment': '🎯',
      'welcome': '📢',
      'feedback': '✅',
      'reminder': '⏰',
      'general': '📧'
    };
    return icons[type] || icons['general'];
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      'high': { color: '#dc2626', bg: '#fef2f2', text: '🔥 High' },
      'medium': { color: '#d97706', bg: '#fef3c7', text: '📋 Medium' },
      'low': { color: '#059669', bg: '#ecfdf5', text: '📝 Low' }
    };
    const badge = badges[priority] || badges['medium'];
    return (
      <span style={{
        backgroundColor: badge.bg,
        color: badge.color,
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 'bold'
      }}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.title}>📧 Gmail Integration</h2>
          <p style={styles.subtitle}>
            Manage your training communications
            {unreadCount > 0 && (
              <span style={styles.unreadBadge}>{unreadCount} unread</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setComposeModal(true)}
          style={styles.composeButton}
        >
          ✏️ Compose
        </button>
      </div>

      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="🔍 Search emails..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        <button
          onClick={fetchEmails}
          style={styles.refreshButton}
          disabled={isLoading}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <span>⚠️</span> {error}
          <button onClick={fetchEmails} style={styles.retryButton}>Try Again</button>
        </div>
      )}

      {isLoading && emails.length === 0 ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading your emails...</p>
        </div>
      ) : (
        <div style={styles.emailList}>
          {filteredEmails.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <h3>No emails found</h3>
              <p>
                {searchQuery 
                  ? `No emails match "${searchQuery}"` 
                  : 'Your inbox is empty'
                }
              </p>
            </div>
          ) : (
            filteredEmails.map(email => (
              <div
                key={email.id}
                style={{
                  ...styles.emailCard,
                  ...(email.read ? {} : styles.unreadEmail)
                }}
                onClick={() => {
                  setSelectedEmail(email);
                  markAsRead(email.id);
                }}
              >
                <div style={styles.emailHeader}>
                  <div style={styles.emailMeta}>
                    <span style={styles.emailTypeIcon}>
                      {getEmailTypeIcon(email.type)}
                    </span>
                    <span style={styles.emailFrom}>{email.from}</span>
                    <span style={styles.emailDate}>{formatDate(email.date)}</span>
                    {getPriorityBadge(email.priority)}
                  </div>
                  {!email.read && <div style={styles.unreadDot}></div>}
                </div>
                <h3 style={styles.emailSubject}>{email.subject}</h3>
                <p style={styles.emailPreview}>
                  {email.body.length > 120 
                    ? `${email.body.substring(0, 120)}...` 
                    : email.body
                  }
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div style={styles.modal} onClick={() => setSelectedEmail(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3>{selectedEmail.subject}</h3>
                <div style={styles.emailDetailMeta}>
                  <span>From: {selectedEmail.from}</span>
                  <span>To: {selectedEmail.to}</span>
                  <span>Date: {new Date(selectedEmail.date).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.emailBody}>{selectedEmail.body}</div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.replyButton}>
                ↩️ Reply
              </button>
              <button style={styles.forwardButton}>
                ➡️ Forward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {composeModal && (
        <div style={styles.modal} onClick={() => setComposeModal(false)}>
          <div style={styles.composeModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>✏️ Compose New Email</h3>
              <button
                onClick={() => setComposeModal(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <div style={styles.composeForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>To:</label>
                <input
                  type="email"
                  value={newEmail.to}
                  onChange={(e) => setNewEmail({...newEmail, to: e.target.value})}
                  style={styles.input}
                  placeholder="trainer@rrcloud.com"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Subject:</label>
                <input
                  type="text"
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail({...newEmail, subject: e.target.value})}
                  style={styles.input}
                  placeholder="Enter subject"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Message:</label>
                <textarea
                  value={newEmail.body}
                  onChange={(e) => setNewEmail({...newEmail, body: e.target.value})}
                  style={styles.textarea}
                  placeholder="Type your message here..."
                  rows="8"
                />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button
                onClick={() => setComposeModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={sendEmail}
                style={styles.sendButton}
                disabled={!newEmail.to || !newEmail.subject || !newEmail.body}
              >
                📤 Send
              </button>
            </div>
          </div>
        </div>
      )}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: '0 0 5px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  composeButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  searchContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  searchInput: {
    flex: 1,
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
  },
  refreshButton: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
  },
  spinner: {
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  errorAlert: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: 'transparent',
    color: '#dc2626',
    border: '1px solid #dc2626',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  emailList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  emailCard: {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  unreadEmail: {
    backgroundColor: '#f0f9ff',
    borderLeft: '4px solid #3b82f6',
  },
  emailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  emailMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px',
    color: '#64748b',
  },
  emailTypeIcon: {
    fontSize: '16px',
  },
  emailFrom: {
    fontWeight: '500',
    color: '#374151',
  },
  emailDate: {
    color: '#9ca3af',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#3b82f6',
    borderRadius: '50%',
  },
  emailSubject: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  emailPreview: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.4',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '2px dashed #cbd5e1',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '700px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  composeModal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px',
    borderBottom: '1px solid #e2e8f0',
  },
  emailDetailMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    fontSize: '12px',
    color: '#64748b',
    marginTop: '5px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#64748b',
  },
  modalBody: {
    padding: '20px',
  },
  emailBody: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#374151',
    whiteSpace: 'pre-wrap',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '20px',
    borderTop: '1px solid #e2e8f0',
  },
  replyButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  forwardButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  composeForm: {
    padding: '20px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  sendButton: {
    backgroundColor: '#059669',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  }
};

// Add CSS animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default GmailPlugin;
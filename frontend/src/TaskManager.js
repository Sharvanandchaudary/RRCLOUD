import React, { useState, useEffect } from 'react';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({
    content: '',
    file: null
  });
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  // Smart URL detection
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE_URL = isLocal ? 'http://localhost:8080' : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchTasks();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : data.tasks || []);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTask = async (taskId) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('content', submissionForm.content);
      if (submissionForm.file) {
        formData.append('file', submissionForm.file);
      }

      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('✅ Task submitted successfully!');
        setShowSubmissionModal(false);
        setSubmissionForm({ content: '', file: null });
        fetchTasks(); // Refresh tasks
      } else {
        throw new Error('Failed to submit task');
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      alert('❌ Failed to submit task');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { color: '#fbbf24', bg: '#fef3c7', text: '⏳ Pending' },
      'submitted': { color: '#3b82f6', bg: '#dbeafe', text: '📤 Submitted' },
      'graded': { color: '#10b981', bg: '#d1fae5', text: '✅ Graded' },
      'overdue': { color: '#ef4444', bg: '#fee2e2', text: '⚠️ Overdue' }
    };
    const badge = badges[status] || badges['pending'];
    return (
      <span style={{
        backgroundColor: badge.bg,
        color: badge.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {badge.text}
      </span>
    );
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
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {badge.text}
      </span>
    );
  };

  if (loading && tasks.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📋 My Tasks & Assignments</h2>
        <p style={styles.subtitle}>View and submit your assigned tasks</p>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <span>⚠️</span> {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📝</div>
          <h3>No tasks assigned yet</h3>
          <p>Your trainer will assign tasks that will appear here</p>
        </div>
      ) : (
        <div style={styles.tasksGrid}>
          {tasks.map(task => (
            <div key={task.id} style={styles.taskCard}>
              <div style={styles.taskHeader}>
                <h3 style={styles.taskTitle}>{task.title}</h3>
                <div style={styles.badges}>
                  {getStatusBadge(task.status)}
                  {getPriorityBadge(task.priority)}
                </div>
              </div>

              <div style={styles.taskMeta}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>👨‍🏫 Assigned by:</span>
                  <span style={styles.metaValue}>{task.trainer_name || 'Unknown'}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>📅 Due date:</span>
                  <span style={styles.metaValue}>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                  </span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>🎯 Points:</span>
                  <span style={styles.metaValue}>{task.max_points || 'N/A'} points</span>
                </div>
              </div>

              <div style={styles.taskDescription}>
                <p>{task.description}</p>
              </div>

              {task.attachments && task.attachments.length > 0 && (
                <div style={styles.attachments}>
                  <h4 style={styles.attachmentTitle}>📎 Attachments:</h4>
                  {task.attachments.map((attachment, index) => (
                    <a 
                      key={index} 
                      href={attachment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={styles.attachmentLink}
                    >
                      📄 {attachment.name}
                    </a>
                  ))}
                </div>
              )}

              {task.submission && (
                <div style={styles.submission}>
                  <h4 style={styles.submissionTitle}>📤 Your Submission:</h4>
                  <p style={styles.submissionDate}>
                    Submitted on: {new Date(task.submission.submitted_at).toLocaleString()}
                  </p>
                  {task.submission.grade && (
                    <div style={styles.grade}>
                      <span style={styles.gradeLabel}>Grade:</span>
                      <span style={styles.gradeValue}>
                        {task.submission.grade}/{task.max_points || 100}
                      </span>
                    </div>
                  )}
                  {task.submission.feedback && (
                    <div style={styles.feedback}>
                      <h5 style={styles.feedbackTitle}>💬 Trainer Feedback:</h5>
                      <p style={styles.feedbackContent}>{task.submission.feedback}</p>
                    </div>
                  )}
                </div>
              )}

              <div style={styles.taskActions}>
                {task.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowSubmissionModal(true);
                    }}
                    style={styles.submitButton}
                  >
                    📤 Submit Task
                  </button>
                )}
                {task.status === 'submitted' && (
                  <span style={styles.submittedText}>✅ Submitted - Waiting for review</span>
                )}
                {task.status === 'graded' && (
                  <span style={styles.gradedText}>🎉 Task completed and graded!</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submission Modal */}
      {showSubmissionModal && selectedTask && (
        <div style={styles.modal} onClick={() => setShowSubmissionModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>📤 Submit Task: {selectedTask.title}</h3>
              <button 
                onClick={() => setShowSubmissionModal(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>📝 Submission Content:</label>
                <textarea
                  value={submissionForm.content}
                  onChange={(e) => setSubmissionForm({...submissionForm, content: e.target.value})}
                  style={styles.textarea}
                  placeholder="Describe your solution, approach, or provide answers here..."
                  rows="6"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>📎 Attach File (optional):</label>
                <input
                  type="file"
                  onChange={(e) => setSubmissionForm({...submissionForm, file: e.target.files[0]})}
                  style={styles.fileInput}
                  accept=".pdf,.doc,.docx,.txt,.zip,.png,.jpg,.jpeg"
                />
                <small style={styles.fileHint}>
                  Accepted formats: PDF, Word, Text, Images, ZIP files
                </small>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => setShowSubmissionModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitTask(selectedTask.id)}
                disabled={!submissionForm.content.trim()}
                style={{
                  ...styles.submitModalButton,
                  ...(submissionForm.content.trim() ? {} : styles.disabledButton)
                }}
              >
                🚀 Submit Task
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
    textAlign: 'center',
    marginBottom: '30px',
    backgroundColor: '#f8fafc',
    padding: '30px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
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
    alignItems: 'center',
    gap: '10px',
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
  tasksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  taskTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
    flex: 1,
  },
  badges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  taskMeta: {
    marginBottom: '15px',
  },
  metaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  metaLabel: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: '14px',
    color: '#1e293b',
    fontWeight: '600',
  },
  taskDescription: {
    marginBottom: '15px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    borderLeft: '4px solid #3b82f6',
  },
  attachments: {
    marginBottom: '15px',
  },
  attachmentTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '8px',
  },
  attachmentLink: {
    display: 'block',
    color: '#3b82f6',
    textDecoration: 'none',
    marginBottom: '4px',
    fontSize: '14px',
  },
  submission: {
    backgroundColor: '#ecfdf5',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid #d1fae5',
  },
  submissionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: '8px',
  },
  submissionDate: {
    fontSize: '14px',
    color: '#374151',
    marginBottom: '10px',
  },
  grade: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  gradeLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151',
  },
  gradeValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#059669',
  },
  feedback: {
    marginTop: '10px',
  },
  feedbackTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '5px',
  },
  feedbackContent: {
    fontSize: '14px',
    color: '#1f2937',
    fontStyle: 'italic',
  },
  taskActions: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
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
  submittedText: {
    color: '#059669',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  gradedText: {
    color: '#7c3aed',
    fontSize: '14px',
    fontWeight: 'bold',
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
    padding: '0',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e2e8f0',
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
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '8px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '120px',
  },
  fileInput: {
    width: '100%',
    padding: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
  },
  fileHint: {
    display: 'block',
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '20px',
    borderTop: '1px solid #e2e8f0',
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
  submitModalButton: {
    backgroundColor: '#059669',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  }
};

export default TaskManager;
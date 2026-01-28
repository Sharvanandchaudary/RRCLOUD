import React, { useState, useEffect } from 'react';

const TrainerTaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    student_id: '',
    due_date: '',
    max_points: 100,
    priority: 'medium',
    attachments: []
  });
  const [grading, setGrading] = useState({
    grade: '',
    feedback: ''
  });

  // Smart URL detection
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE_URL = isLocal ? 'http://localhost:8080' : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

  useEffect(() => {
    fetchData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockStudents = [
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'active' },
        { id: 3, name: 'Carol Davis', email: 'carol@example.com', status: 'active' },
        { id: 4, name: 'David Wilson', email: 'david@example.com', status: 'active' }
      ];

      const mockTasks = [
        {
          id: 1,
          title: 'React Components Assignment',
          description: 'Create functional and class components with proper state management',
          student_id: 1,
          student_name: 'Alice Johnson',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          max_points: 100,
          priority: 'high',
          status: 'submitted',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          title: 'Database Design Principles',
          description: 'Design a normalized database schema for an e-commerce application',
          student_id: 2,
          student_name: 'Bob Smith',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          max_points: 150,
          priority: 'medium',
          status: 'pending',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          title: 'API Integration Task',
          description: 'Integrate REST APIs with proper error handling and authentication',
          student_id: 3,
          student_name: 'Carol Davis',
          due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          max_points: 120,
          priority: 'medium',
          status: 'graded',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const mockSubmissions = [
        {
          id: 1,
          task_id: 1,
          student_id: 1,
          student_name: 'Alice Johnson',
          task_title: 'React Components Assignment',
          content: 'I have completed the React components assignment. I created both functional and class components with proper state management using hooks and lifecycle methods.',
          file_url: '/uploads/alice_react_components.zip',
          submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          grade: null,
          feedback: null,
          status: 'pending'
        },
        {
          id: 2,
          task_id: 3,
          student_id: 3,
          student_name: 'Carol Davis',
          task_title: 'API Integration Task',
          content: 'Completed the API integration with proper authentication and error handling. Included unit tests for all endpoints.',
          file_url: '/uploads/carol_api_integration.zip',
          submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          grade: 115,
          feedback: 'Excellent work! Great implementation of error handling and comprehensive testing.',
          status: 'graded'
        }
      ];

      setTimeout(() => {
        setStudents(mockStudents);
        setTasks(mockTasks);
        setSubmissions(mockSubmissions);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTask.title || !newTask.description || !newTask.student_id) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Mock API call
      const mockResponse = {
        id: Date.now(),
        ...newTask,
        student_name: students.find(s => s.id === parseInt(newTask.student_id))?.name || 'Unknown',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      setTasks([...tasks, mockResponse]);
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        student_id: '',
        due_date: '',
        max_points: 100,
        priority: 'medium',
        attachments: []
      });
      alert('✅ Task created and assigned successfully!');
      
    } catch (error) {
      console.error('Error creating task:', error);
      alert('❌ Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const gradeSubmission = async (submissionId) => {
    if (!grading.grade || !grading.feedback) {
      alert('Please provide both grade and feedback');
      return;
    }

    try {
      setLoading(true);
      
      // Update submission with grade
      setSubmissions(submissions.map(sub => 
        sub.id === submissionId 
          ? { ...sub, grade: parseInt(grading.grade), feedback: grading.feedback, status: 'graded' }
          : sub
      ));

      // Update task status
      const submission = submissions.find(s => s.id === submissionId);
      if (submission) {
        setTasks(tasks.map(task => 
          task.id === submission.task_id 
            ? { ...task, status: 'graded' }
            : task
        ));
      }

      setShowSubmissionModal(false);
      setSelectedSubmission(null);
      setGrading({ grade: '', feedback: '' });
      alert('✅ Submission graded successfully!');
      
    } catch (error) {
      console.error('Error grading submission:', error);
      alert('❌ Failed to grade submission');
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

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const gradedSubmissions = submissions.filter(s => s.status === 'graded');

  if (loading && tasks.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading trainer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>👨‍🏫 Trainer Task Manager</h2>
        <p style={styles.subtitle}>Create, assign, and grade student tasks</p>
        <button
          onClick={() => setShowCreateModal(true)}
          style={styles.createButton}
        >
          ➕ Create New Task
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            ...styles.tab,
            ...(activeTab === 'tasks' ? styles.activeTab : {})
          }}
        >
          📋 My Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          style={{
            ...styles.tab,
            ...(activeTab === 'submissions' ? styles.activeTab : {})
          }}
        >
          📤 Submissions ({pendingSubmissions.length} pending)
        </button>
        <button
          onClick={() => setActiveTab('graded')}
          style={{
            ...styles.tab,
            ...(activeTab === 'graded' ? styles.activeTab : {})
          }}
        >
          ✅ Graded ({gradedSubmissions.length})
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div style={styles.tasksGrid}>
          {tasks.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📝</div>
              <h3>No tasks created yet</h3>
              <p>Create your first task to assign to students</p>
            </div>
          ) : (
            tasks.map(task => (
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
                    <span style={styles.metaLabel}>👨‍🎓 Student:</span>
                    <span style={styles.metaValue}>{task.student_name}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>📅 Due date:</span>
                    <span style={styles.metaValue}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                    </span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>🎯 Points:</span>
                    <span style={styles.metaValue}>{task.max_points} points</span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>📝 Created:</span>
                    <span style={styles.metaValue}>
                      {new Date(task.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={styles.taskDescription}>
                  <p>{task.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div style={styles.submissionsGrid}>
          {pendingSubmissions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <h3>No pending submissions</h3>
              <p>Student submissions will appear here for grading</p>
            </div>
          ) : (
            pendingSubmissions.map(submission => (
              <div key={submission.id} style={styles.submissionCard}>
                <div style={styles.submissionHeader}>
                  <h3 style={styles.submissionTitle}>{submission.task_title}</h3>
                  <span style={styles.submissionStudent}>{submission.student_name}</span>
                </div>

                <div style={styles.submissionMeta}>
                  <span style={styles.submissionDate}>
                    Submitted: {new Date(submission.submitted_at).toLocaleString()}
                  </span>
                </div>

                <div style={styles.submissionContent}>
                  <p>{submission.content}</p>
                </div>

                {submission.file_url && (
                  <div style={styles.submissionFile}>
                    <a 
                      href={submission.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={styles.fileLink}
                    >
                      📎 Download Submission File
                    </a>
                  </div>
                )}

                <div style={styles.submissionActions}>
                  <button
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setShowSubmissionModal(true);
                    }}
                    style={styles.gradeButton}
                  >
                    📝 Grade Submission
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Graded Tab */}
      {activeTab === 'graded' && (
        <div style={styles.submissionsGrid}>
          {gradedSubmissions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📊</div>
              <h3>No graded submissions</h3>
              <p>Graded submissions will appear here</p>
            </div>
          ) : (
            gradedSubmissions.map(submission => (
              <div key={submission.id} style={styles.gradedCard}>
                <div style={styles.submissionHeader}>
                  <h3 style={styles.submissionTitle}>{submission.task_title}</h3>
                  <span style={styles.submissionStudent}>{submission.student_name}</span>
                </div>

                <div style={styles.gradeDisplay}>
                  <span style={styles.gradeLabel}>Grade:</span>
                  <span style={styles.gradeValue}>{submission.grade}/100</span>
                </div>

                <div style={styles.feedbackDisplay}>
                  <h4 style={styles.feedbackTitle}>Your Feedback:</h4>
                  <p style={styles.feedbackContent}>{submission.feedback}</p>
                </div>

                <div style={styles.submissionMeta}>
                  <span style={styles.submissionDate}>
                    Submitted: {new Date(submission.submitted_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div style={styles.modal} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>➕ Create New Task</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>📋 Task Title:</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  style={styles.input}
                  placeholder="Enter task title"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>👨‍🎓 Assign to Student:</label>
                <select
                  value={newTask.student_id}
                  onChange={(e) => setNewTask({...newTask, student_id: e.target.value})}
                  style={styles.select}
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>📝 Description:</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  style={styles.textarea}
                  placeholder="Describe the task requirements..."
                  rows="4"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>📅 Due Date:</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>🎯 Max Points:</label>
                  <input
                    type="number"
                    value={newTask.max_points}
                    onChange={(e) => setNewTask({...newTask, max_points: parseInt(e.target.value)})}
                    style={styles.input}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>🔥 Priority:</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  style={styles.select}
                >
                  <option value="low">📝 Low</option>
                  <option value="medium">📋 Medium</option>
                  <option value="high">🔥 High</option>
                </select>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={createTask}
                style={styles.createTaskButton}
                disabled={!newTask.title || !newTask.description || !newTask.student_id}
              >
                🚀 Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {showSubmissionModal && selectedSubmission && (
        <div style={styles.modal} onClick={() => setShowSubmissionModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>📝 Grade Submission</h3>
              <button
                onClick={() => setShowSubmissionModal(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.submissionDetails}>
                <h4>Task: {selectedSubmission.task_title}</h4>
                <p>Student: {selectedSubmission.student_name}</p>
                <p>Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
              </div>

              <div style={styles.submissionContentSection}>
                <h4>Student's Submission:</h4>
                <div style={styles.submissionContentBox}>
                  {selectedSubmission.content}
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>🎯 Grade (out of 100):</label>
                  <input
                    type="number"
                    value={grading.grade}
                    onChange={(e) => setGrading({...grading, grade: e.target.value})}
                    style={styles.input}
                    min="0"
                    max="100"
                    placeholder="0-100"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>💬 Feedback:</label>
                <textarea
                  value={grading.feedback}
                  onChange={(e) => setGrading({...grading, feedback: e.target.value})}
                  style={styles.textarea}
                  placeholder="Provide detailed feedback to the student..."
                  rows="4"
                />
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
                onClick={() => gradeSubmission(selectedSubmission.id)}
                style={styles.gradeSubmissionButton}
                disabled={!grading.grade || !grading.feedback}
              >
                ✅ Submit Grade
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
    maxWidth: '1400px',
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
    position: 'relative',
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
    margin: '0 0 20px 0',
  },
  createButton: {
    backgroundColor: '#059669',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
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
  tabs: {
    display: 'flex',
    marginBottom: '20px',
    borderBottom: '2px solid #e2e8f0',
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '2px dashed #cbd5e1',
    gridColumn: '1 / -1',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  tasksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '20px',
  },
  submissionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
    gap: '20px',
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  submissionCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  gradedCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #bbf7d0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  submissionHeader: {
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
  submissionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
    flex: 1,
  },
  submissionStudent: {
    fontSize: '14px',
    color: '#059669',
    fontWeight: '500',
  },
  badges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  taskMeta: {
    marginBottom: '15px',
  },
  submissionMeta: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '10px',
  },
  submissionDate: {
    fontSize: '12px',
    color: '#64748b',
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
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    borderLeft: '4px solid #3b82f6',
  },
  submissionContent: {
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  submissionFile: {
    marginBottom: '15px',
  },
  fileLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  submissionActions: {
    display: 'flex',
    justifyContent: 'center',
  },
  gradeButton: {
    backgroundColor: '#7c3aed',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  gradeDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
  },
  gradeLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#374151',
  },
  gradeValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#059669',
  },
  feedbackDisplay: {
    marginBottom: '15px',
  },
  feedbackTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '8px',
  },
  feedbackContent: {
    fontSize: '14px',
    color: '#1f2937',
    fontStyle: 'italic',
    backgroundColor: '#f9fafb',
    padding: '10px',
    borderRadius: '6px',
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
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  submissionDetails: {
    backgroundColor: '#f8fafc',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  submissionContentSection: {
    marginBottom: '20px',
  },
  submissionContentBox: {
    backgroundColor: '#f9fafb',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
    lineHeight: '1.5',
    maxHeight: '200px',
    overflowY: 'auto',
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
  createTaskButton: {
    backgroundColor: '#059669',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  gradeSubmissionButton: {
    backgroundColor: '#7c3aed',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  }
};

export default TrainerTaskManager;
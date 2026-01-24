import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  
  // Task Management State
  const [tasks, setTasks] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', type: 'daily' });
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data Visualization State
  const [companyData, setCompanyData] = useState([]);
  const [visualizationData, setVisualizationData] = useState({
    totalApplications: 0,
    completedTasks: 0,
    pendingTasks: 0,
    companyStats: []
  });
  const [csvData, setCsvData] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserProfile(token);
    fetchTasks();
    fetchVisualizationData();
  }, [navigate]);

  const fetchUserProfile = async (token) => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        await fetchApplication(data.user.email, token);
      } else {
        setError('Failed to fetch profile');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      console.error(error);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplication = async (email, token) => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/applications/${email}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApplication(data);
        setEditData({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          about_me: data.about_me || ''
        });
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/student/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        setDailyTasks(data.dailyTasks || []);
        setTaskHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchVisualizationData = async () => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/student/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVisualizationData(data);
        setCompanyData(data.companyData || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/student/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      });

      if (response.ok) {
        setNewTask({ title: '', description: '', type: 'daily' });
        fetchTasks();
        alert('✅ Task submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting task:', error);
    }
  };

  const handleTaskComplete = async (taskId) => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/student/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchTasks();
        fetchVisualizationData();
        alert('✅ Task completed!');
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || '';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/student/upload-data`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setCsvData(data.data || []);
        fetchVisualizationData();
        alert(`✅ Data uploaded successfully! Processed ${data.processed} records from ${data.filename}.`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('❌ Error uploading file. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>🔄</div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <h2 style={styles.errorTitle}>Dashboard Error</h2>
        <p style={styles.errorText}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🎓</span>
            <h1 style={styles.logoText}>ZgenAI Student Portal</h1>
          </div>
          <div style={styles.headerActions}>
            <div style={styles.userInfo}>
              <span style={styles.welcomeText}>Welcome, {user?.full_name || 'Student'}!</span>
              <span style={styles.roleText}>Student Dashboard</span>
            </div>
            <button 
              style={styles.logoutBtn}
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                navigate('/');
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.tabContainer}>
        {['dashboard', 'tasks', 'analytics', 'data'].map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'dashboard' && '📊 Dashboard'}
            {tab === 'tasks' && '📝 Task Management'}
            {tab === 'analytics' && '📈 Analytics'}
            {tab === 'data' && '💾 Data Hub'}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'tasks' && renderTaskManagement()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'data' && renderDataHub()}
      </div>
    </div>
  );

  function renderDashboard() {
    return (
      <div style={styles.dashboardGrid}>
        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🎯</div>
            <div style={styles.statInfo}>
              <h3 style={styles.statNumber}>{visualizationData.completedTasks || 0}</h3>
              <p style={styles.statLabel}>Completed Tasks</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏳</div>
            <div style={styles.statInfo}>
              <h3 style={styles.statNumber}>{visualizationData.pendingTasks || 0}</h3>
              <p style={styles.statLabel}>Pending Tasks</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🏢</div>
            <div style={styles.statInfo}>
              <h3 style={styles.statNumber}>{companyData.length}</h3>
              <p style={styles.statLabel}>Company Connections</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📈</div>
            <div style={styles.statInfo}>
              <h3 style={styles.statNumber}>{taskHistory.length}</h3>
              <p style={styles.statLabel}>Total Submissions</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={styles.quickActionsCard}>
          <h3 style={styles.cardTitle}>🚀 Quick Actions</h3>
          <div style={styles.actionGrid}>
            <button 
              style={styles.actionBtn}
              onClick={() => setActiveTab('tasks')}
            >
              📝 Submit Task
            </button>
            <button 
              style={styles.actionBtn}
              onClick={() => setActiveTab('data')}
            >
              💾 Upload Data
            </button>
            <button 
              style={styles.actionBtn}
              onClick={() => setActiveTab('analytics')}
            >
              📊 View Analytics
            </button>
            <button 
              style={styles.actionBtn}
              onClick={() => {
                fetchTasks();
                fetchVisualizationData();
              }}
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>

        {/* Recent Tasks */}
        <div style={styles.recentTasksCard}>
          <h3 style={styles.cardTitle}>📋 Recent Tasks</h3>
          <div style={styles.taskList}>
            {[...tasks, ...taskHistory].slice(0, 5).map((task, index) => (
              <div key={index} style={styles.taskItem}>
                <div style={styles.taskIcon}>
                  {task.completed ? '✅' : '⏳'}
                </div>
                <div style={styles.taskContent}>
                  <h4 style={styles.taskTitle}>{task.title}</h4>
                  <p style={styles.taskDescription}>{task.description}</p>
                  <span style={styles.taskDate}>
                    {new Date(task.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                {!task.completed && (
                  <button
                    style={styles.completeBtn}
                    onClick={() => handleTaskComplete(task.id)}
                  >
                    Complete
                  </button>
                )}
              </div>
            ))}
            {tasks.length === 0 && taskHistory.length === 0 && (
              <p style={styles.noTasks}>No tasks yet. Submit your first task or check back later!</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderTaskManagement() {
    return (
      <div style={styles.taskManagementContainer}>
        {/* Task Submission Form */}
        <div style={styles.taskSubmissionCard}>
          <h3 style={styles.cardTitle}>📝 Submit New Task</h3>
          <form onSubmit={handleTaskSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Task Title</label>
              <input
                type="text"
                style={styles.formInput}
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title..."
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Description</label>
              <textarea
                style={styles.formTextarea}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Describe your task submission..."
                rows="4"
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Task Type</label>
              <select
                style={styles.formSelect}
                value={newTask.type}
                onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
              >
                <option value="daily">📅 Daily Task</option>
                <option value="assignment">📋 Assignment</option>
                <option value="project">🚀 Project</option>
                <option value="assessment">📊 Assessment</option>
              </select>
            </div>
            <button type="submit" style={styles.submitBtn}>
              ✨ Submit Task
            </button>
          </form>
        </div>

        {/* Daily Tasks */}
        <div style={styles.dailyTasksCard}>
          <h3 style={styles.cardTitle}>📅 Pending Tasks</h3>
          <div style={styles.taskGrid}>
            {[...tasks, ...dailyTasks].filter(task => !task.completed).map((task, index) => (
              <div key={index} style={styles.dailyTaskItem}>
                <div style={styles.taskHeader}>
                  <span style={styles.taskBadge}>{task.type || 'Task'}</span>
                  <span style={styles.taskPriority}>
                    {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
                  </span>
                </div>
                <h4 style={styles.taskItemTitle}>{task.title}</h4>
                <p style={styles.taskItemDesc}>{task.description}</p>
                <div style={styles.taskFooter}>
                  <span style={styles.taskAssignedBy}>
                    👨‍🏫 {task.assignedBy || 'Self Assigned'}
                  </span>
                  <button
                    style={styles.completeTaskBtn}
                    onClick={() => handleTaskComplete(task.id)}
                  >
                    ✅ Complete
                  </button>
                </div>
              </div>
            ))}
            {[...tasks, ...dailyTasks].filter(task => !task.completed).length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📝</div>
                <p>No pending tasks. Great job keeping up!</p>
              </div>
            )}
          </div>
        </div>

        {/* Task History */}
        <div style={styles.taskHistoryCard}>
          <h3 style={styles.cardTitle}>📚 Task History</h3>
          <div style={styles.historyList}>
            {taskHistory.slice(0, 10).map((task, index) => (
              <div key={index} style={styles.historyItem}>
                <div style={styles.historyIcon}>
                  {task.type === 'project' ? '🚀' : task.type === 'assessment' ? '📊' : '📝'}
                </div>
                <div style={styles.historyContent}>
                  <h4 style={styles.historyTitle}>{task.title}</h4>
                  <p style={styles.historyMeta}>
                    {task.type} • {new Date(task.completedAt || task.createdAt || Date.now()).toLocaleDateString()} 
                    {task.grade && ` • Grade: ${task.grade}/100`}
                  </p>
                </div>
                <div style={styles.historyStatus}>
                  <span style={styles.statusCompleted}>✅ Completed</span>
                </div>
              </div>
            ))}
            {taskHistory.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📚</div>
                <p>No completed tasks yet. Complete some tasks to see your history!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderAnalytics() {
    return (
      <div style={styles.analyticsContainer}>
        {/* Performance Overview */}
        <div style={styles.performanceCard}>
          <h3 style={styles.cardTitle}>📈 Performance Overview</h3>
          <div style={styles.metricsGrid}>
            <div style={styles.metricItem}>
              <div style={styles.metricValue}>{visualizationData.completedTasks || 0}</div>
              <div style={styles.metricLabel}>Tasks Completed</div>
              <div style={styles.metricTrend}>📈 +12% this week</div>
            </div>
            <div style={styles.metricItem}>
              <div style={styles.metricValue}>
                {Math.round((visualizationData.completedTasks / Math.max(visualizationData.completedTasks + visualizationData.pendingTasks, 1)) * 100) || 0}%
              </div>
              <div style={styles.metricLabel}>Completion Rate</div>
              <div style={styles.metricTrend}>🎯 Above Average</div>
            </div>
            <div style={styles.metricItem}>
              <div style={styles.metricValue}>{companyData.length}</div>
              <div style={styles.metricLabel}>Company Matches</div>
              <div style={styles.metricTrend}>🏢 Active Connections</div>
            </div>
            <div style={styles.metricItem}>
              <div style={styles.metricValue}>
                {taskHistory.filter(t => t.grade && t.grade >= 80).length}
              </div>
              <div style={styles.metricLabel}>High Grades (80+)</div>
              <div style={styles.metricTrend}>⭐ Excellent Work</div>
            </div>
          </div>
        </div>

        {/* Company Data Visualization */}
        <div style={styles.companyDataCard}>
          <h3 style={styles.cardTitle}>🏢 Company Connections & Opportunities</h3>
          <div style={styles.companyGrid}>
            {companyData.map((company, index) => (
              <div key={index} style={styles.companyItem}>
                <div style={styles.companyHeader}>
                  <div style={styles.companyLogo}>
                    {company.name?.charAt(0) || '🏢'}
                  </div>
                  <div style={styles.companyInfo}>
                    <h4 style={styles.companyName}>{company.name || `Company ${index + 1}`}</h4>
                    <p style={styles.companyLocation}>{company.location || 'Various Locations'}</p>
                  </div>
                </div>
                <div style={styles.companyStats}>
                  <div style={styles.companyStat}>
                    <span style={styles.statNumber}>{company.applications || Math.floor(Math.random() * 50) + 10}</span>
                    <span style={styles.statLabel}>Applications</span>
                  </div>
                  <div style={styles.companyStat}>
                    <span style={styles.statNumber}>{company.matchRate || Math.floor(Math.random() * 30) + 70}%</span>
                    <span style={styles.statLabel}>Match Rate</span>
                  </div>
                </div>
                <button style={styles.companyActionBtn}>
                  🔗 View Opportunities
                </button>
              </div>
            ))}
            {companyData.length === 0 && (
              <div style={styles.emptyCompanies}>
                <div style={styles.emptyIcon}>🏢</div>
                <p>No company connections yet. Upload your data to see matches!</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Chart */}
        <div style={styles.progressCard}>
          <h3 style={styles.cardTitle}>📊 Learning Progress</h3>
          <div style={styles.progressChart}>
            <div style={styles.chartContainer}>
              <div style={styles.progressBar}>
                <div style={styles.progressLabel}>Tasks Completed</div>
                <div style={styles.progressTrack}>
                  <div 
                    style={{
                      ...styles.progressFill,
                      width: `${Math.min((visualizationData.completedTasks / Math.max(visualizationData.completedTasks + visualizationData.pendingTasks, 1)) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <span style={styles.progressPercent}>
                  {Math.round((visualizationData.completedTasks / Math.max(visualizationData.completedTasks + visualizationData.pendingTasks, 1)) * 100)}%
                </span>
              </div>
              
              <div style={styles.progressBar}>
                <div style={styles.progressLabel}>Skill Development</div>
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressFill, width: '78%', background: 'linear-gradient(90deg, #10b981, #059669)' }}></div>
                </div>
                <span style={styles.progressPercent}>78%</span>
              </div>
              
              <div style={styles.progressBar}>
                <div style={styles.progressLabel}>Course Progress</div>
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressFill, width: '65%', background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}></div>
                </div>
                <span style={styles.progressPercent}>65%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderDataHub() {
    return (
      <div style={styles.dataHubContainer}>
        {/* File Upload Section */}
        <div style={styles.uploadCard}>
          <h3 style={styles.cardTitle}>📤 Data Upload & Analysis</h3>
          <div style={styles.uploadArea}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              style={styles.fileInput}
              id="file-upload"
            />
            <label htmlFor="file-upload" style={styles.uploadLabel}>
              <div style={styles.uploadIcon}>📁</div>
              <div style={styles.uploadText}>
                <strong>Click to upload</strong> or drag and drop
              </div>
              <div style={styles.uploadHint}>CSV, Excel files (MAX. 10MB)</div>
            </label>
          </div>
          <div style={styles.uploadInstructions}>
            <h4>📋 Upload Instructions:</h4>
            <ul>
              <li>Upload your job application tracking data (CSV/Excel)</li>
              <li>Include columns: company, position, applied_date, status</li>
              <li>Data will be analyzed for company matches and trends</li>
              <li>Recruiter connections will be mapped automatically</li>
            </ul>
          </div>
        </div>

        {/* Data Visualization */}
        <div style={styles.dataVisualizationCard}>
          <h3 style={styles.cardTitle}>📊 Data Insights & Trends</h3>
          <div style={styles.insightsGrid}>
            <div style={styles.insightCard}>
              <h4>📈 Application Trends</h4>
              <div style={styles.trendChart}>
                {[65, 78, 82, 91, 87].map((value, index) => (
                  <div key={index} style={styles.chartBar}>
                    <div 
                      style={{
                        ...styles.barFill,
                        height: `${value}%`
                      }}
                    ></div>
                    <span style={styles.barLabel}>W{index + 1}</span>
                  </div>
                ))}
              </div>
              <p style={styles.chartDescription}>Weekly application activity</p>
            </div>
            
            <div style={styles.insightCard}>
              <h4>🎯 Success Rate Analysis</h4>
              <div style={styles.successRate}>
                <div style={styles.rateCircle}>
                  <span style={styles.rateValue}>84%</span>
                </div>
                <p style={styles.rateText}>Above average performance</p>
                <div style={styles.rateBreakdown}>
                  <div style={styles.rateItem}>
                    <span style={styles.rateLabel}>Interview Rate:</span>
                    <span style={styles.ratePercent}>32%</span>
                  </div>
                  <div style={styles.rateItem}>
                    <span style={styles.rateLabel}>Offer Rate:</span>
                    <span style={styles.ratePercent}>18%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CSV Data Table */}
        {csvData.length > 0 && (
          <div style={styles.dataTableCard}>
            <h3 style={styles.cardTitle}>📋 Uploaded Data Preview</h3>
            <div style={styles.dataTableHeader}>
              <span style={styles.recordCount}>Showing {Math.min(csvData.length, 10)} of {csvData.length} records</span>
              <button style={styles.exportBtn}>📊 Export Analysis</button>
            </div>
            <div style={styles.tableContainer}>
              <table style={styles.dataTable}>
                <thead>
                  <tr>
                    {Object.keys(csvData[0] || {}).map((key, index) => (
                      <th key={index} style={styles.tableHeader}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 10).map((row, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white' }}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} style={styles.tableCell}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {csvData.length === 0 && (
          <div style={styles.emptyDataState}>
            <div style={styles.emptyIcon}>📊</div>
            <h3>No Data Uploaded Yet</h3>
            <p>Upload your job application data to see insights and company matches.</p>
            <button 
              style={styles.uploadPromptBtn}
              onClick={() => document.getElementById('file-upload').click()}
            >
              📤 Upload Your First File
            </button>
          </div>
        )}
      </div>
    );
  }
}

// Enhanced Styles with modern design
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  
  // Loading and Error States
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  spinner: {
    fontSize: '48px',
    animation: 'spin 2s linear infinite'
  },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textAlign: 'center'
  },
  errorIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '12px'
  },
  errorText: {
    fontSize: '16px',
    opacity: 0.8
  },

  // Header
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '20px 0',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  logoIcon: {
    fontSize: '32px'
  },
  logoText: {
    fontSize: '28px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  welcomeText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b'
  },
  roleText: {
    fontSize: '14px',
    color: '#64748b'
  },
  logoutBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  },

  // Navigation Tabs
  tabContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
    display: 'flex',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    marginTop: '20px'
  },
  tab: {
    flex: 1,
    padding: '16px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center'
  },
  activeTab: {
    background: 'rgba(255, 255, 255, 0.95)',
    color: '#1e293b',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  },

  // Main Content
  mainContent: {
    maxWidth: '1400px',
    margin: '24px auto',
    padding: '0 24px',
    paddingBottom: '60px'
  },

  // Dashboard
  dashboardGrid: {
    display: 'grid',
    gap: '24px',
    gridTemplateColumns: '1fr',
    marginBottom: '40px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },
  statIcon: {
    fontSize: '32px'
  },
  statInfo: {
    flex: 1
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1e293b',
    margin: '0 0 4px 0'
  },
  statLabel: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    fontWeight: '500'
  },

  // Cards
  quickActionsCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  recentTasksCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 20px 0'
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  actionBtn: {
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center'
  },

  // Task Management
  taskManagementContainer: {
    display: 'grid',
    gap: '24px'
  },
  taskSubmissionCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  formGroup: {
    marginBottom: '20px'
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  },
  formInput: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease'
  },
  formTextarea: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
    transition: 'border-color 0.2s ease'
  },
  formSelect: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
    background: 'white',
    cursor: 'pointer'
  },
  submitBtn: {
    width: '100%',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  // Daily Tasks
  dailyTasksCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  taskGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px'
  },
  dailyTaskItem: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.3s ease'
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  taskBadge: {
    background: '#e0e7ff',
    color: '#3730a3',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  taskPriority: {
    fontSize: '16px'
  },
  taskItemTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 8px 0'
  },
  taskItemDesc: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 16px 0',
    lineHeight: '1.5'
  },
  taskFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  taskAssignedBy: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500'
  },
  completeTaskBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  completedBadge: {
    color: '#059669',
    fontWeight: '600',
    fontSize: '12px'
  },

  // Task History
  taskHistoryCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  historyIcon: {
    fontSize: '20px'
  },
  historyContent: {
    flex: 1
  },
  historyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 4px 0'
  },
  historyMeta: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0
  },
  historyStatus: {
    display: 'flex',
    alignItems: 'center'
  },
  statusCompleted: {
    color: '#059669',
    fontWeight: '600',
    fontSize: '12px'
  },
  statusPending: {
    color: '#d97706',
    fontWeight: '600',
    fontSize: '12px'
  },

  // Analytics
  analyticsContainer: {
    display: 'grid',
    gap: '24px'
  },
  performanceCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px'
  },
  metricItem: {
    textAlign: 'center',
    padding: '20px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  metricValue: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1e293b',
    margin: '0 0 8px 0'
  },
  metricLabel: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 4px 0',
    fontWeight: '600'
  },
  metricTrend: {
    fontSize: '12px',
    color: '#059669',
    fontWeight: '500'
  },

  // Company Data
  companyDataCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  companyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  companyItem: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    transition: 'transform 0.2s ease'
  },
  companyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px'
  },
  companyLogo: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '20px',
    fontWeight: '700'
  },
  companyInfo: {
    flex: 1
  },
  companyName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 4px 0'
  },
  companyLocation: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  companyStats: {
    display: 'flex',
    gap: '20px',
    marginBottom: '16px'
  },
  companyStat: {
    textAlign: 'center'
  },
  statNumber: {
    display: 'block',
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b'
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500'
  },
  companyActionBtn: {
    width: '100%',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  // Progress Chart
  progressCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  progressLabel: {
    minWidth: '150px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  progressTrack: {
    flex: 1,
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
    borderRadius: '4px',
    transition: 'width 0.5s ease'
  },
  progressPercent: {
    minWidth: '50px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right'
  },

  // Data Hub
  dataHubContainer: {
    display: 'grid',
    gap: '24px'
  },
  uploadCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  uploadArea: {
    position: 'relative',
    marginBottom: '24px'
  },
  fileInput: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer'
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#f9fafb'
  },
  uploadIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  uploadText: {
    fontSize: '16px',
    color: '#374151',
    marginBottom: '8px'
  },
  uploadHint: {
    fontSize: '14px',
    color: '#6b7280'
  },
  uploadInstructions: {
    background: '#f0f9ff',
    border: '1px solid #e0f2fe',
    borderRadius: '12px',
    padding: '20px'
  },

  // Data Visualization
  dataVisualizationCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px'
  },
  insightCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px'
  },
  trendChart: {
    display: 'flex',
    alignItems: 'end',
    gap: '8px',
    height: '100px',
    marginTop: '16px',
    marginBottom: '8px'
  },
  chartBar: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  barFill: {
    width: '100%',
    background: 'linear-gradient(to top, #3b82f6, #1d4ed8)',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease'
  },
  barLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500'
  },
  chartDescription: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center',
    margin: 0
  },
  successRate: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    marginTop: '16px'
  },
  rateCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'conic-gradient(from 0deg, #059669 0%, #059669 84%, #e5e7eb 84%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  rateValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b'
  },
  rateText: {
    fontSize: '14px',
    color: '#64748b',
    textAlign: 'center',
    margin: 0
  },
  rateBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignSelf: 'stretch'
  },
  rateItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  rateLabel: {
    fontSize: '12px',
    color: '#6b7280'
  },
  ratePercent: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#1e293b'
  },

  // Data Table
  dataTableCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  dataTableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  recordCount: {
    fontSize: '14px',
    color: '#6b7280'
  },
  exportBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  tableHeader: {
    background: '#f1f5f9',
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e2e8f0'
  },
  tableCell: {
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0',
    color: '#374151'
  },

  // Empty States
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#6b7280',
    textAlign: 'center'
  },
  emptyCompanies: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#6b7280',
    textAlign: 'center'
  },
  emptyDataState: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '60px 32px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    textAlign: 'center',
    color: '#6b7280'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5
  },
  noTasks: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    padding: '40px 20px'
  },
  uploadPromptBtn: {
    marginTop: '16px',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  // Task List Items
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  taskIcon: {
    fontSize: '20px'
  },
  taskContent: {
    flex: 1
  },
  taskTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 4px 0'
  },
  taskDescription: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 8px 0'
  },
  taskDate: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  completeBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default StudentDashboard;
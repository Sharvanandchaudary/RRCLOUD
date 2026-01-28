import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TrainerDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('overview'); // overview, students, tasks
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ 
    student_id: '', 
    title: '', 
    description: '', 
    due_date: '', 
    priority: 'medium' 
  });
  const [selectedStudent, setSelectedStudent] = useState('');
  const [error, setError] = useState('');
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (authToken) {
      fetchData();
    }
  }, [authToken, currentView]);

  const checkAuthentication = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'trainer') {
      navigate('/');
      return;
    }
    
    setAuthToken(token);
  };

  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
      
      // Fetch applications/students
      const appsRes = await fetch(`${backendUrl}/api/applications`);
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        const approvedStudents = appsData.filter(app => app.status === 'approved');
        setApplications(approvedStudents);
        setStudents(approvedStudents);
      }

      // Fetch tasks assigned by this trainer
      try {
        const tasksRes = await fetch(`${backendUrl}/api/trainer-tasks`, {
          headers: getAuthHeaders()
        });
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData || []);
        }
      } catch (err) {
        console.log('Tasks endpoint not available yet');
        setTasks([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!taskForm.student_id || !taskForm.title || !taskForm.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
      const taskData = {
        ...taskForm,
        task_date: new Date().toISOString().split('T')[0] // Today's date
      };
      
      const res = await fetch(`${backendUrl}/api/trainer-tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
      });

      if (res.ok) {
        const result = await res.json();
        console.log('✅ Task created:', result);
        setShowTaskModal(false);
        setTaskForm({ student_id: '', title: '', description: '', due_date: '', priority: 'medium' });
        await fetchData(); // Reload tasks
        alert('Task assigned successfully!');
      } else {
        const errorText = await res.text();
        setError(`Failed to create task: HTTP ${res.status}: ${errorText}`);
      }
    } catch (err) {
      console.error('💥 Error creating task:', err);
      setError('Network error creating task: ' + err.message);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-nsmgws4u4a-uc.a.run.app';
      const res = await fetch(`${backendUrl}/api/trainer-tasks/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        await fetchData(); // Reload tasks
        alert('Task status updated!');
      } else {
        const errorText = await res.text();
        setError(`Failed to update task: ${errorText}`);
      }
    } catch (err) {
      setError('Error updating task: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user');
    navigate('/');
  };

  const stats = {
    totalStudents: students.length,
    activeTasks: tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    overdueTasks: tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{
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
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🎯 Trainer Dashboard
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
            Welcome, Trainer
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {error}
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
          </div>
        )}

        {/* Navigation */}
        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { key: 'overview', label: '📊 Overview', count: null },
            { key: 'students', label: '👥 Students', count: stats.totalStudents },
            { key: 'tasks', label: '📋 Task Management', count: tasks.length }
          ].map(nav => (
            <button
              key={nav.key}
              onClick={() => setCurrentView(nav.key)}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                background: currentView === nav.key
                  ? 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)'
                  : 'rgba(255, 255, 255, 0.9)',
                color: currentView === nav.key ? 'white' : '#64748b',
                transition: 'all 0.2s ease'
              }}
            >
              {nav.label} {nav.count !== null && `(${nav.count})`}
            </button>
          ))}
        </div>

        {/* Overview */}
        {currentView === 'overview' && (
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
              Training Dashboard
            </h1>
            <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '40px' }}>
              Manage your students and training tasks
            </p>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
              marginBottom: '40px'
            }}>
              {[
                { label: 'Students', value: stats.totalStudents, color: '#3b82f6', icon: '👥' },
                { label: 'Active Tasks', value: stats.activeTasks, color: '#f59e0b', icon: '📋' },
                { label: 'Completed', value: stats.completedTasks, color: '#10b981', icon: '✅' },
                { label: 'Overdue', value: stats.overdueTasks, color: '#ef4444', icon: '⚠️' }
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '16px',
                  padding: '32px',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: stat.color }}>
                    {stat.value}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students View */}
        {currentView === 'students' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>My Students</h2>
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading students...</div>}

            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Email</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Phone</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id} style={{ borderTop: index > 0 ? '1px solid #e2e8f0' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>{student.full_name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>{student.email}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>{student.phone}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: '12px',
                            background: '#dcfce7',
                            color: '#166534'
                          }}>
                            Active
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => {
                              setTaskForm({...taskForm, student_id: student.id});
                              setSelectedStudent(student.full_name);
                              setShowTaskModal(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Assign Task
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tasks View */}
        {currentView === 'tasks' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>Task Management</h2>
              <button
                onClick={() => setShowTaskModal(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                + Create Task
              </button>
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading tasks...</div>}

            <div style={{ display: 'grid', gap: '20px' }}>
              {tasks.length === 0 ? (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '16px',
                  padding: '40px',
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  No tasks assigned yet. Create your first task to get started!
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                          {task.title}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
                          Student: {task.student_name || 'Unknown'}
                        </p>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>
                          {task.description}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          borderRadius: '12px',
                          background: task.priority === 'high' ? '#fef2f2' : task.priority === 'low' ? '#f0fdf4' : '#fef3c7',
                          color: task.priority === 'high' ? '#dc2626' : task.priority === 'low' ? '#16a34a' : '#d97706'
                        }}>
                          {task.priority} priority
                        </span>
                        <span style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          borderRadius: '12px',
                          background: task.status === 'completed' ? '#dcfce7' : task.status === 'in_progress' ? '#fef3c7' : '#f1f5f9',
                          color: task.status === 'completed' ? '#166534' : task.status === 'in_progress' ? '#d97706' : '#475569'
                        }}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {task.due_date && `Due: ${new Date(task.due_date).toLocaleDateString()}`}
                        {task.created_at && ` • Created: ${new Date(task.created_at).toLocaleDateString()}`}
                      </div>
                      
                      {task.status !== 'completed' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            disabled={task.status === 'in_progress'}
                            style={{
                              padding: '4px 8px',
                              background: task.status === 'in_progress' ? '#9ca3af' : '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: task.status === 'in_progress' ? 'not-allowed' : 'pointer'
                            }}
                          >
                            In Progress
                          </button>
                          <button
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            style={{
                              padding: '4px 8px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Complete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Create Task Modal */}
        {showTaskModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              width: '100%',
              maxWidth: '500px'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
                Create New Task {selectedStudent && `for ${selectedStudent}`}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {!selectedStudent && (
                  <select
                    value={taskForm.student_id}
                    onChange={(e) => setTaskForm({...taskForm, student_id: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Student *</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>{student.full_name}</option>
                    ))}
                  </select>
                )}
                
                <input
                  type="text"
                  placeholder="Task Title *"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                
                <textarea
                  placeholder="Task Description *"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                  
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={createTask}
                  disabled={!taskForm.student_id || !taskForm.title || !taskForm.description}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: (!taskForm.student_id || !taskForm.title || !taskForm.description) 
                      ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: (!taskForm.student_id || !taskForm.title || !taskForm.description) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Create Task
                </button>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setTaskForm({ student_id: '', title: '', description: '', due_date: '', priority: 'medium' });
                    setSelectedStudent('');
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
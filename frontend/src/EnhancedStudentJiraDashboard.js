import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EnhancedStudentJiraDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jiraTasks, setJiraTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskFilter, setTaskFilter] = useState('all');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'Task',
    priority: 'Medium'
  });

  useEffect(() => {
    checkAuth();
    fetchJiraTasks();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('auth_token');
    const userData = JSON.parse(localStorage.getItem('auth_user') || '{}');
    
    if (!token || userData.role !== 'student') {
      navigate('/login');
      return;
    }
    
    setUser(userData);
  };

  const fetchJiraTasks = async () => {
    try {
      setLoading(true);
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${backendUrl}/api/jira/my-issues`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setJiraTasks(data.issues || []);
      }
    } catch (err) {
      console.error('Error fetching Jira tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    try {
      if (!newTask.title) {
        alert('Task title is required');
        return;
      }

      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${backendUrl}/api/jira/issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTask)
      });
      
      if (response.ok) {
        setShowCreateTask(false);
        setNewTask({ title: '', description: '', type: 'Task', priority: 'Medium' });
        fetchJiraTasks();
        alert('✅ Task created successfully!');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Failed to create task');
    }
  };

  const updateTaskStatus = async (taskKey, newStatus) => {
    try {
      const backendUrl = window.RUNTIME_CONFIG?.BACKEND_URL || 'https://rrcloud-backend-415414350152.us-central1.run.app';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${backendUrl}/api/jira/issue/${taskKey}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchJiraTasks();
        alert('✅ Status updated successfully!');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/');
  };

  const getFilteredTasks = () => {
    if (taskFilter === 'all') return jiraTasks;
    if (taskFilter === 'todo') return jiraTasks.filter(t => t.status === 'To Do');
    if (taskFilter === 'in-progress') return jiraTasks.filter(t => t.status === 'In Progress');
    if (taskFilter === 'done') return jiraTasks.filter(t => t.status === 'Done');
    return jiraTasks;
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'To Do': 'bg-gray-100 text-gray-700 border-gray-300',
      'In Progress': 'bg-blue-100 text-blue-700 border-blue-300',
      'Done': 'bg-green-100 text-green-700 border-green-300'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getPriorityColor = (priority) => {
    const priorityMap = {
      'High': 'text-red-600',
      'Medium': 'text-orange-600',
      'Low': 'text-green-600'
    };
    return priorityMap[priority] || 'text-gray-600';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'To Do': '📋',
      'In Progress': '⏳',
      'Done': '✅'
    };
    return iconMap[status] || '📄';
  };

  const stats = {
    total: jiraTasks.length,
    todo: jiraTasks.filter(t => t.status === 'To Do').length,
    inProgress: jiraTasks.filter(t => t.status === 'In Progress').length,
    done: jiraTasks.filter(t => t.status === 'Done').length
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* Header */}
      <div className="sticky top-0 z-50" style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(25px)',
        borderBottom: '2px solid rgba(226, 232, 240, 0.6)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-4xl">👨‍🎓</div>
              <div>
                <h1 className="text-3xl font-extrabold" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Student Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.full_name || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateTask(true)}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                ➕ Create Task
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
                }}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="rounded-2xl p-6 transform hover:scale-105 transition-all cursor-pointer" style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)'
          }}>
            <div className="text-white">
              <div className="text-6xl mb-3 opacity-20">📊</div>
              <p className="text-sm font-semibold opacity-90">TOTAL TASKS</p>
              <p className="text-5xl font-extrabold mt-2">{stats.total}</p>
            </div>
          </div>

          <div className="rounded-2xl p-6 transform hover:scale-105 transition-all cursor-pointer" style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
          }}>
            <div className="text-white">
              <div className="text-6xl mb-3 opacity-20">📋</div>
              <p className="text-sm font-semibold opacity-90">TO DO</p>
              <p className="text-5xl font-extrabold mt-2">{stats.todo}</p>
            </div>
          </div>

          <div className="rounded-2xl p-6 transform hover:scale-105 transition-all cursor-pointer" style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)'
          }}>
            <div className="text-white">
              <div className="text-6xl mb-3 opacity-20">⏳</div>
              <p className="text-sm font-semibold opacity-90">IN PROGRESS</p>
              <p className="text-5xl font-extrabold mt-2">{stats.inProgress}</p>
            </div>
          </div>

          <div className="rounded-2xl p-6 transform hover:scale-105 transition-all cursor-pointer" style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
          }}>
            <div className="text-white">
              <div className="text-6xl mb-3 opacity-20">✅</div>
              <p className="text-sm font-semibold opacity-90">COMPLETED</p>
              <p className="text-5xl font-extrabold mt-2">{stats.done}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl p-6 mb-6" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
        }}>
          <div className="flex gap-3">
            {['all', 'todo', 'in-progress', 'done'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTaskFilter(filter)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  taskFilter === filter
                    ? 'text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={taskFilter === filter ? {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                } : {}}
              >
                {filter === 'all' && '📊 All Tasks'}
                {filter === 'todo' && '📋 To Do'}
                {filter === 'in-progress' && '⏳ In Progress'}
                {filter === 'done' && '✅ Done'}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        <div className="rounded-2xl overflow-hidden" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
        }}>
          <div className="p-8">
            <h2 className="text-3xl font-extrabold mb-6" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Your Jira Tasks</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 animate-spin">⏳</div>
                <p className="text-gray-600 text-lg">Loading tasks...</p>
              </div>
            ) : getFilteredTasks().length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600 text-lg">No tasks found</p>
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="mt-4 px-6 py-3 rounded-xl font-semibold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  }}
                >
                  Create Your First Task
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredTasks().map((task) => (
                  <div
                    key={task.id}
                    className="border-2 rounded-xl p-6 hover:shadow-lg transition-all"
                    style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getStatusIcon(task.status)}</span>
                          <h3 className="text-xl font-bold text-gray-800">{task.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{task.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <span className={`font-semibold ${getPriorityColor(task.priority)}`}>
                              {task.priority === 'High' && '🔴'}
                              {task.priority === 'Medium' && '🟡'}
                              {task.priority === 'Low' && '🟢'}
                              {task.priority} Priority
                            </span>
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-600">🏷️ {task.type}</span>
                          {task.dueDate && (
                            <>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-600">📅 Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </>
                          )}
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-600">🔑 {task.key}</span>
                        </div>
                      </div>
                      {task.url !== '#' && (
                        <a
                          href={task.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-all"
                        >
                          View in Jira →
                        </a>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      {task.status !== 'To Do' && (
                        <button
                          onClick={() => updateTaskStatus(task.key, 'To Do')}
                          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all"
                        >
                          ← To Do
                        </button>
                      )}
                      {task.status !== 'In Progress' && (
                        <button
                          onClick={() => updateTaskStatus(task.key, 'In Progress')}
                          className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold transition-all"
                        >
                          ⏳ In Progress
                        </button>
                      )}
                      {task.status !== 'Done' && (
                        <button
                          onClick={() => updateTaskStatus(task.key, 'Done')}
                          className="px-4 py-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-semibold transition-all"
                        >
                          ✅ Mark Done
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-8 max-w-2xl w-full" style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 className="text-3xl font-extrabold mb-6" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Create New Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="Enter task title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  rows="4"
                  placeholder="Enter task description..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Task">Task</option>
                    <option value="Bug">Bug</option>
                    <option value="Story">Story</option>
                    <option value="Documentation">Documentation</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={createTask}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}
              >
                ✅ Create Task
              </button>
              <button
                onClick={() => {
                  setShowCreateTask(false);
                  setNewTask({ title: '', description: '', type: 'Task', priority: 'Medium' });
                }}
                className="flex-1 px-6 py-3 rounded-xl font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

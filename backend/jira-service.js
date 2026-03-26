const axios = require('axios');

class JiraService {
  constructor() {
    this.baseUrl = process.env.JIRA_BASE_URL || 'https://your-domain.atlassian.net';
    this.email = process.env.JIRA_EMAIL || '';
    this.apiToken = process.env.JIRA_API_TOKEN || '';
    this.projectKey = process.env.JIRA_PROJECT_KEY || 'DEMO';
    
    // Check if Jira is configured
    this.isConfigured = !!(this.baseUrl && this.email && this.apiToken);
    
    if (!this.isConfigured) {
      console.warn('⚠️ Jira integration not configured. Using mock data.');
      console.log('   Set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN environment variables');
    } else {
      console.log('✅ Jira integration configured');
    }
    
    this.auth = {
      username: this.email,
      password: this.apiToken
    };
  }

  // Get authorization headers
  getHeaders() {
    return {
      'Authorization': `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  // Get all issues for a project
  async getIssues(projectKey = null) {
    if (!this.isConfigured) {
      return this.getMockIssues();
    }

    try {
      const project = projectKey || this.projectKey;
      const response = await axios.get(
        `${this.baseUrl}/rest/api/3/search`,
        {
          headers: this.getHeaders(),
          params: {
            jql: `project = ${project} ORDER BY created DESC`,
            maxResults: 100
          }
        }
      );
      
      return this.formatIssues(response.data.issues);
    } catch (error) {
      console.error('Error fetching Jira issues:', error.message);
      return this.getMockIssues();
    }
  }

  // Get issues assigned to a specific user
  async getUserIssues(userEmail) {
    if (!this.isConfigured) {
      return this.getMockIssues();
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/rest/api/3/search`,
        {
          headers: this.getHeaders(),
          params: {
            jql: `assignee = "${userEmail}" ORDER BY created DESC`,
            maxResults: 100
          }
        }
      );
      
      return this.formatIssues(response.data.issues);
    } catch (error) {
      console.error('Error fetching user Jira issues:', error.message);
      return this.getMockIssues();
    }
  }

  // Create a new issue
  async createIssue(data) {
    if (!this.isConfigured) {
      return this.createMockIssue(data);
    }

    try {
      const issueData = {
        fields: {
          project: {
            key: data.projectKey || this.projectKey
          },
          summary: data.title || data.summary,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: data.description || ''
                  }
                ]
              }
            ]
          },
          issuetype: {
            name: data.type || 'Task'
          },
          priority: {
            name: data.priority || 'Medium'
          }
        }
      };

      if (data.assignee) {
        issueData.fields.assignee = { accountId: data.assignee };
      }

      const response = await axios.post(
        `${this.baseUrl}/rest/api/3/issue`,
        issueData,
        { headers: this.getHeaders() }
      );
      
      return {
        success: true,
        issue: response.data
      };
    } catch (error) {
      console.error('Error creating Jira issue:', error.message);
      return this.createMockIssue(data);
    }
  }

  // Update issue status
  async updateIssueStatus(issueKey, status) {
    if (!this.isConfigured) {
      return { success: true, message: 'Mock update successful' };
    }

    try {
      // Get available transitions
      const transitionsResponse = await axios.get(
        `${this.baseUrl}/rest/api/3/issue/${issueKey}/transitions`,
        { headers: this.getHeaders() }
      );

      const transition = transitionsResponse.data.transitions.find(
        t => t.name.toLowerCase() === status.toLowerCase() ||
             t.to.name.toLowerCase() === status.toLowerCase()
      );

      if (!transition) {
        throw new Error(`Transition to ${status} not found`);
      }

      await axios.post(
        `${this.baseUrl}/rest/api/3/issue/${issueKey}/transitions`,
        {
          transition: {
            id: transition.id
          }
        },
        { headers: this.getHeaders() }
      );

      return { success: true, message: 'Status updated successfully' };
    } catch (error) {
      console.error('Error updating Jira issue status:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Format Jira issues to a consistent structure
  formatIssues(issues) {
    return issues.map(issue => ({
      id: issue.key,
      key: issue.key,
      title: issue.fields.summary,
      description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
      status: issue.fields.status.name,
      type: issue.fields.issuetype.name,
      priority: issue.fields.priority?.name || 'Medium',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      assigneeEmail: issue.fields.assignee?.emailAddress || null,
      reporter: issue.fields.reporter?.displayName || 'Unknown',
      created: issue.fields.created,
      updated: issue.fields.updated,
      dueDate: issue.fields.duedate || null,
      url: `${this.baseUrl}/browse/${issue.key}`
    }));
  }

  // Mock data for testing when Jira is not configured
  getMockIssues() {
    return [
      {
        id: 'DEMO-101',
        key: 'DEMO-101',
        title: 'Complete React Dashboard Setup',
        description: 'Set up the main dashboard with all components and styling',
        status: 'In Progress',
        type: 'Task',
        priority: 'High',
        assignee: 'Student Demo',
        assigneeEmail: 'student@demo.com',
        reporter: 'Trainer Demo',
        created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        url: '#'
      },
      {
        id: 'DEMO-102',
        key: 'DEMO-102',
        title: 'Implement User Authentication',
        description: 'Add JWT-based authentication with role-based access control',
        status: 'Done',
        type: 'Task',
        priority: 'High',
        assignee: 'Student Demo',
        assigneeEmail: 'student@demo.com',
        reporter: 'Admin',
        created: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        url: '#'
      },
      {
        id: 'DEMO-103',
        key: 'DEMO-103',
        title: 'Design Database Schema',
        description: 'Create comprehensive database schema for all entities',
        status: 'To Do',
        type: 'Task',
        priority: 'Medium',
        assignee: 'Student Demo',
        assigneeEmail: 'student@demo.com',
        reporter: 'Trainer Demo',
        created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        url: '#'
      },
      {
        id: 'DEMO-104',
        key: 'DEMO-104',
        title: 'Write API Documentation',
        description: 'Document all REST API endpoints with examples',
        status: 'In Progress',
        type: 'Documentation',
        priority: 'Low',
        assignee: 'Student Demo',
        assigneeEmail: 'student@demo.com',
        reporter: 'Recruiter Demo',
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        url: '#'
      },
      {
        id: 'DEMO-105',
        key: 'DEMO-105',
        title: 'Setup CI/CD Pipeline',
        description: 'Configure GitHub Actions for automated deployment',
        status: 'To Do',
        type: 'Task',
        priority: 'Medium',
        assignee: 'Unassigned',
        assigneeEmail: null,
        reporter: 'Admin',
        created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        url: '#'
      }
    ];
  }

  createMockIssue(data) {
    const newIssue = {
      id: `DEMO-${Math.floor(Math.random() * 900) + 100}`,
      key: `DEMO-${Math.floor(Math.random() * 900) + 100}`,
      title: data.title || data.summary,
      description: data.description || '',
      status: 'To Do',
      type: data.type || 'Task',
      priority: data.priority || 'Medium',
      assignee: 'Unassigned',
      assigneeEmail: null,
      reporter: 'System',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      dueDate: null,
      url: '#'
    };

    return {
      success: true,
      issue: newIssue
    };
  }
}

module.exports = new JiraService();

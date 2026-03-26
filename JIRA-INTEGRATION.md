# 🚀 Jira Integration Guide

## Overview
This application integrates with Jira for comprehensive task management. Students, trainers, and recruiters can manage tasks directly from their dashboards with real-time Jira synchronization.

## ✨ Features

### 🎯 For Students
- **View Tasks**: See all Jira issues assigned to you
- **Create Tasks**: Create new Jira issues directly from dashboard
- **Update Status**: Move tasks between To Do, In Progress, and Done
- **Task Details**: View priority, type, due dates, and descriptions
- **Direct Links**: Click to view tasks in Jira

### 💼 For Trainers & Recruiters
- **Monitor Students**: Track student task progress
- **Assign Tasks**: Create and assign tasks to students
- **Project Overview**: See all project tasks and status

### 🎨 Dashboard Features
- **Beautiful UI**: Modern gradient designs with glassmorphism
- **Stats Cards**: Real-time task statistics (Total, To Do, In Progress, Done)
- **Filtering**: Filter tasks by status
- **Priority Indicators**: Color-coded priority levels (High/Medium/Low)
- **Status Management**: Quick status updates with visual feedback

## 🔧 Setup

### Option 1: With Real Jira (Production)

#### 1. Create Jira API Token
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name (e.g., "RRCLOUD Integration")
4. Copy the token

#### 2. Set Environment Variables
Add these to your `.env` file or Cloud Run configuration:

```bash
# Jira Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token-here
JIRA_PROJECT_KEY=YOUR-PROJECT-KEY
```

#### 3. Deploy with Environment Variables

**For Cloud Run:**
```bash
gcloud run services update rrcloud-backend \
  --update-env-vars JIRA_BASE_URL=https://your-domain.atlassian.net \
  --update-env-vars JIRA_EMAIL=your-email@example.com \
  --update-env-vars JIRA_API_TOKEN=your-token \
  --update-env-vars JIRA_PROJECT_KEY=DEMO \
  --region us-central1
```

**For GitHub Secrets:**
Add these secrets in GitHub → Settings → Secrets:
- `JIRA_BASE_URL`
- `JIRA_EMAIL`
- `JIRA_API_TOKEN`
- `JIRA_PROJECT_KEY`

### Option 2: Mock Data (Development/Demo)

No configuration needed! The application automatically uses mock Jira data when real credentials aren't provided. Perfect for:
- Development and testing
- Demo presentations
- Trying out features without Jira account

## 📊 API Endpoints

### Get All Project Issues
```
GET /api/jira/issues?project=PROJECT_KEY
Authorization: Bearer <token>
```

### Get My Issues
```
GET /api/jira/my-issues
Authorization: Bearer <token>
```

### Create Issue
```
POST /api/jira/issue
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Task title",
  "description": "Task description",
  "type": "Task",
  "priority": "Medium"
}
```

### Update Issue Status
```
PUT /api/jira/issue/:key/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "In Progress"
}
```

## 🎓 Demo Accounts

Use these test accounts to explore the Jira-integrated dashboards:

| Role | Email | Password | Dashboard URL |
|------|-------|----------|---------------|
| Student | student@demo.com | demo123 | /dashboard |
| Recruiter | recruiter@demo.com | demo123 | /recruiter-dashboard |
| Trainer | trainer@demo.com | demo123 | /trainer-dashboard |
| Admin | admin@zgenai.com | admin123 | /admin |

### Create Demo Accounts

**Option 1: Using Script**
```bash
./setup-demo-accounts.sh
```

**Option 2: Manual SQL**
```bash
psql -h localhost -U postgres -d rrcloud_db -f create-demo-accounts.sql
```

**Option 3: Cloud SQL (GCP)**
```bash
gcloud sql connect rrcloud-db --user=postgres < create-demo-accounts.sql
```

## 📱 Usage Guide

### For Students

1. **Login** with student@demo.com / demo123
2. **View Dashboard** - See your task statistics
3. **Filter Tasks** - Click All, To Do, In Progress, or Done
4. **Create Task** - Click "Create Task" button
5. **Update Status** - Click status buttons on each task card
6. **View in Jira** - Click "View in Jira →" to see task details

### For Trainers/Recruiters

1. **Login** with your credentials
2. **Monitor Students** - See assigned student tasks
3. **Create Tasks** - Assign new tasks to students
4. **Track Progress** - View completion rates

## 🔍 Mock Data

When Jira credentials are not configured, the system uses realistic mock data:

- **5 Sample Tasks** with different statuses
- **Priority Levels**: High, Medium, Low
- **Task Types**: Task, Bug, Story, Documentation
- **Realistic Dates**: Created, updated, due dates
- **Sample Assignees**: Student Demo, Trainer Demo, etc.

## 🚀 Deployment

The Jira integration is automatically deployed with your application. The GitHub Actions workflow will:

1. Build backend with Jira service
2. Install dependencies (including axios)
3. Deploy to Cloud Run with environment variables
4. Update frontend with enhanced student dashboard

## 🐛 Troubleshooting

### "Jira integration not configured" Warning
**Solution**: This is normal if you haven't set up Jira credentials. The app will use mock data.

### Tasks Not Loading
**Check**:
1. Are you logged in as a student?
2. Check browser console for errors
3. Verify backend is running
4. Check if JIRA_BASE_URL is accessible

### Status Updates Not Working
**Check**:
1. Jira API token is valid
2. User has permission to transition issues
3. Target status exists in your Jira workflow

## 📚 Technical Details

### Architecture
- **Backend**: Node.js + Express with Jira REST API v3
- **Frontend**: React with modern hooks
- **Authentication**: JWT-based with role checking
- **Styling**: Tailwind CSS with custom gradients

### Security
- API tokens stored as environment variables
- Basic Auth for Jira API
- JWT tokens for application authentication
- Role-based access control

### Performance
- Efficient API calls with caching potential
- Optimistic UI updates
- Graceful fallback to mock data
- Minimal bundle size impact

## 🎯 Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Bulk task operations
- [ ] Advanced filtering and search
- [ ] Task comments and attachments
- [ ] Time tracking integration
- [ ] Sprint management
- [ ] Custom Jira workflows
- [ ] Email notifications
- [ ] Mobile app integration

## 📞 Support

For issues or questions:
- Check the console logs for detailed error messages
- Review Jira API documentation: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- Verify environment variables are set correctly

---

**Version**: 1.0.0  
**Last Updated**: March 26, 2026  
**Status**: ✅ Production Ready

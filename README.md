# ZgenAi Platform 🚀

Full-stack career application platform with student signup and admin dashboard, built with React and Node.js, deployed on Google Cloud Platform.

## 🏗️ Architecture

- **Frontend**: React 18 + React Router
- **Backend**: Node.js + Express + PostgreSQL
- **Deployment**: GCP Cloud Run (containerized)
- **CI/CD**: GitHub Actions

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL
- Git

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd RRCLOUD
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
node setup_db.js  # Initialize database
npm start  # Runs on http://localhost:5001
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

The frontend proxy automatically connects to backend on port 5001.

## 🚀 Deployment to GCP

### Method 1: Automated CI/CD (Recommended)

1. **Setup GitHub Secrets**:
   - `GCP_PROJECT_ID`: Your GCP project ID (e.g., rrcloud-platform)
   - `GCP_SA_KEY`: Service account JSON key with permissions:
     - Cloud Run Admin
     - Storage Admin
     - Service Account User
   - `DATABASE_URL`: PostgreSQL connection string
   - `FRONTEND_URL`: Will be set after first deploy

2. **Push to main branch**:
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

GitHub Actions will automatically:
- Build Docker images
- Push to Google Container Registry
- Deploy to Cloud Run
- Configure environment variables

### Method 2: Manual Deployment

**Using PowerShell (Windows)**:
```powershell
.\deploy.ps1 -ProjectId "rrcloud-platform" -Region "us-central1"
```

**Using Bash (Linux/Mac)**:
```bash
chmod +x deploy.sh
./deploy.sh rrcloud-platform us-central1
```

### Method 3: Manual Step-by-Step

```bash
# Set project
gcloud config set project rrcloud-platform

# Deploy Backend
cd backend
gcloud builds submit --tag gcr.io/rrcloud-platform/rrcloud-backend
gcloud run deploy rrcloud-backend \
  --image gcr.io/rrcloud-platform/rrcloud-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="your-db-url" \
  --port 5001

# Get backend URL
BACKEND_URL=$(gcloud run services describe rrcloud-backend --region us-central1 --format 'value(status.url)')

# Deploy Frontend
cd ../frontend
echo "REACT_APP_API_URL=$BACKEND_URL" > .env.production
gcloud builds submit --tag gcr.io/rrcloud-platform/rrcloud-frontend
gcloud run deploy rrcloud-frontend \
  --image gcr.io/rrcloud-platform/rrcloud-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80
```

## 🗄️ Database Setup (Cloud SQL)

1. **Create PostgreSQL instance**:
```bash
gcloud sql instances create rrcloud-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1
```

2. **Create database**:
```bash
gcloud sql databases create sharvanandchaudhary --instance=rrcloud-db
```

3. **Set password**:
```bash
gcloud sql users set-password postgres \
  --instance=rrcloud-db \
  --password=your-secure-password
```

4. **Enable Cloud SQL Admin API** and configure connection.

## 🔍 Testing

### Test Locally
```bash
# Backend health check
curl http://localhost:5001/health

# Test signup
curl -X POST http://localhost:5001/api/applications \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","phone":"1234567890","aboutMe":"Testing"}'
```

### Test Production
```bash
# Replace with your URLs
curl https://rrcloud-backend-xxx.run.app/health
```

## 📊 Monitoring

- **Cloud Run Logs**: `gcloud run services logs read rrcloud-backend --region us-central1`
- **Cloud Console**: Navigate to Cloud Run > Select service > Logs

## 🛠️ Common Issues & Fixes

### Frontend not connecting to backend
- Check `setupProxy.js` port (should be 5001)
- Verify backend is running: `curl http://localhost:5001/health`
- Check CORS settings in backend `server.js`

### Database connection errors
- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is running
- Run `node setup_db.js` to initialize tables

### Deployment failures
- Check GCP quotas and billing
- Verify service account permissions
- Review Cloud Build logs in GCP Console

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgres://user:pass@host:5432/db
FRONTEND_URL=https://your-frontend.run.app
PORT=5001
NODE_ENV=production
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://your-backend.run.app
```

## 🔒 Security Notes

- Never commit `.env` files
- Use Cloud Secret Manager for sensitive data
- Enable Cloud Armor for DDoS protection
- Configure IAM roles with least privilege
- Use Cloud SQL Auth Proxy for secure database connections

## 📦 Project Structure

```
RRCLOUD/
├── backend/
│   ├── server.js          # Express server
│   ├── db.js              # Database connection
│   ├── setup_db.js        # Database initialization
│   ├── Dockerfile         # Backend container
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main app + routing
│   │   ├── StudentSignup.js  # Application form
│   │   └── setupProxy.js  # Dev proxy config
│   ├── Dockerfile         # Frontend container
│   └── nginx.conf         # Nginx configuration
├── .github/
│   └── workflows/
│       └── deploy-gcp.yml # CI/CD pipeline
├── deploy.sh              # Bash deployment script
└── deploy.ps1             # PowerShell deployment script
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for ZgenAi Platform**
# Updated on Mon Jan 19 23:49:31 PST 2026

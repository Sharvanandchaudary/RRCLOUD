# 🚀 Quick Start Guide

## Fix Connection Issues & Deploy

### ✅ Issues Fixed:
1. **Port mismatch**: Frontend proxy now points to correct port (5001)
2. **CORS**: Backend configured with proper CORS for production
3. **Environment**: Production-ready .env templates created
4. **Health checks**: Added health endpoints for monitoring

### 🔧 Local Testing

**Option 1: Quick Test (Recommended)**
```powershell
# Test if backend and database are working
.\test-connection.ps1
```

**Option 2: Manual Start**

1. **Start Backend** (Terminal 1):
```powershell
cd backend
node server.js
```
You should see: `✅ Server running on port 5001`

2. **Start Frontend** (Terminal 2):
```powershell
cd frontend
npm start
```
Browser will open at http://localhost:3000

3. **Test**:
   - Go to http://localhost:3000
   - Click "APPLY NOW"
   - Fill form and submit
   - Check admin dashboard

### 🚀 Deploy to GCP (3 Options)

#### Option 1: Automated CI/CD (Best for production)

1. **Setup GitHub Repository**:
```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Configure GitHub Secrets** (in repo Settings > Secrets):
   - `GCP_PROJECT_ID`: `rrcloud-platform`
   - `GCP_SA_KEY`: Service account JSON (see below)
   - `DATABASE_URL`: Your Cloud SQL connection string
   - `FRONTEND_URL`: (will update after first deploy)

3. **Push changes** - Auto-deploys:
```powershell
git add .
git commit -m "Deploy to production"
git push origin main
```

#### Option 2: PowerShell Script (Quick deploy)
```powershell
.\deploy.ps1 -ProjectId "rrcloud-platform" -Region "us-central1"
```

#### Option 3: Manual GCP Console

**Backend**:
```powershell
cd backend
gcloud builds submit --tag gcr.io/rrcloud-platform/rrcloud-backend
gcloud run deploy rrcloud-backend --image gcr.io/rrcloud-platform/rrcloud-backend --platform managed --region us-central1 --allow-unauthenticated --port 5001
```

**Frontend**:
```powershell
cd frontend
# First, get backend URL from Cloud Run console
echo "REACT_APP_API_URL=<backend-url>" > .env.production
gcloud builds submit --tag gcr.io/rrcloud-platform/rrcloud-frontend
gcloud run deploy rrcloud-frontend --image gcr.io/rrcloud-platform/rrcloud-frontend --platform managed --region us-central1 --allow-unauthenticated --port 80
```

### 🔑 Create GCP Service Account (for CI/CD)

```powershell
# Create service account
gcloud iam service-accounts create github-actions --display-name="GitHub Actions"

# Grant permissions
gcloud projects add-iam-policy-binding rrcloud-platform --member="serviceAccount:github-actions@rrcloud-platform.iam.gserviceaccount.com" --role="roles/run.admin"

gcloud projects add-iam-policy-binding rrcloud-platform --member="serviceAccount:github-actions@rrcloud-platform.iam.gserviceaccount.com" --role="roles/storage.admin"

gcloud projects add-iam-policy-binding rrcloud-platform --member="serviceAccount:github-actions@rrcloud-platform.iam.gserviceaccount.com" --role="roles/iam.serviceAccountUser"

# Create JSON key
gcloud iam service-accounts keys create key.json --iam-account=github-actions@rrcloud-platform.iam.gserviceaccount.com
```

Copy contents of `key.json` to GitHub Secret `GCP_SA_KEY`

### 🗄️ Setup Cloud SQL Database

```powershell
# Create instance
gcloud sql instances create rrcloud-db --database-version=POSTGRES_14 --tier=db-f1-micro --region=us-central1

# Create database
gcloud sql databases create sharvanandchaudhary --instance=rrcloud-db

# Set password
gcloud sql users set-password postgres --instance=rrcloud-db --password=<your-secure-password>

# Get connection name
gcloud sql instances describe rrcloud-db --format="value(connectionName)"
```

Update `DATABASE_URL` in backend/.env:
```
DATABASE_URL=postgres://postgres:<password>@/sharvanandchaudhary?host=/cloudsql/<connection-name>
```

### 📋 Deployment Checklist

- [ ] Backend runs locally (http://localhost:5001/health)
- [ ] Frontend connects to backend
- [ ] Signup form submits successfully
- [ ] Admin dashboard loads applications
- [ ] Database initialized with tables
- [ ] .env files configured (do NOT commit)
- [ ] GitHub repository created
- [ ] GitHub secrets configured
- [ ] Cloud SQL instance created
- [ ] Service account created with permissions
- [ ] First deployment successful
- [ ] Production URLs tested

### 🐛 Troubleshooting

**"Backend not connecting"**
- Check port: backend should be 5001
- Verify .env DATABASE_URL
- Run: `.\test-connection.ps1`

**"CORS errors"**
- Update FRONTEND_URL in backend/.env
- Restart backend server

**"Database errors"**
- Run: `cd backend; node setup_db.js`
- Check PostgreSQL is running
- Verify DATABASE_URL format

**"Deployment fails"**
- Check GCP billing enabled
- Verify service account permissions
- Review Cloud Build logs in console

### 📞 Support

For issues, check:
1. README.md for full documentation
2. test-connection.ps1 for local testing
3. Cloud Run logs: `gcloud run services logs read rrcloud-backend`

### 🎉 Success URLs

After deployment, you'll have:
- **Frontend**: https://rrcloud-frontend-xxx.run.app
- **Backend**: https://rrcloud-backend-xxx.run.app
- **Health**: https://rrcloud-backend-xxx.run.app/health

---
**Need help?** Open an issue or contact the team!

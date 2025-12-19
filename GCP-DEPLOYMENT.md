# 🚀 GCP Deployment Explanation

## How Local vs Production Works

### 🏠 LOCAL TESTING (Current Setup)
- **File**: `backend/server-local.js` 
- **Database**: In-memory JavaScript array
- **Data**: Temporary (resets on restart)
- **Purpose**: Quick testing without PostgreSQL

### ☁️ GCP PRODUCTION DEPLOYMENT
- **File**: `backend/server.js` (original file)
- **Database**: Cloud SQL PostgreSQL
- **Data**: Persistent, permanent storage
- **Purpose**: Real production environment

---

## Deployment Process (Automatic Switch)

### 1. **Docker Build for GCP**
When you deploy to GCP, the [backend/Dockerfile](backend/Dockerfile) uses:
```dockerfile
CMD ["node", "server.js"]  # NOT server-local.js
```

### 2. **Database Connection**
Production `server.js` connects to Cloud SQL:
```javascript
const db = require('./db');  // Real PostgreSQL connection
await db.query('INSERT INTO applications...');  // Saves to database
```

### 3. **Environment Variables**
GCP Cloud Run automatically injects:
- `DATABASE_URL`: Cloud SQL connection string
- `FRONTEND_URL`: Your frontend URL for CORS
- `PORT`: Cloud Run assigns this
- `NODE_ENV=production`: Enables SSL for database

---

## Complete Deployment Flow

### Step 1: Setup Cloud SQL Database
```powershell
# Create PostgreSQL instance
gcloud sql instances create rrcloud-db `
  --database-version=POSTGRES_14 `
  --tier=db-f1-micro `
  --region=us-central1

# Create database
gcloud sql databases create sharvanandchaudhary --instance=rrcloud-db

# Set password
gcloud sql users set-password postgres `
  --instance=rrcloud-db `
  --password=YOUR_SECURE_PASSWORD
```

### Step 2: Deploy Backend (Uses server.js automatically)
```powershell
cd backend
gcloud builds submit --tag gcr.io/rrcloud-platform/rrcloud-backend

gcloud run deploy rrcloud-backend `
  --image gcr.io/rrcloud-platform/rrcloud-backend `
  --add-cloudsql-instances rrcloud-platform:us-central1:rrcloud-db `
  --set-env-vars DATABASE_URL="postgres://postgres:PASSWORD@/sharvanandchaudhary?host=/cloudsql/rrcloud-platform:us-central1:rrcloud-db" `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 5001
```

### Step 3: Deploy Frontend
```powershell
cd frontend
# Get backend URL
$BACKEND_URL = gcloud run services describe rrcloud-backend --region us-central1 --format 'value(status.url)'

# Build with backend URL
echo "REACT_APP_API_URL=$BACKEND_URL" > .env.production
gcloud builds submit --tag gcr.io/rrcloud-platform/rrcloud-frontend

gcloud run deploy rrcloud-frontend `
  --image gcr.io/rrcloud-platform/rrcloud-frontend `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 80
```

### Step 4: Initialize Database Tables
On first deployment, the database tables will be created automatically when `setup_db.js` runs, or you can run it manually:

```powershell
# Connect to Cloud SQL
gcloud sql connect rrcloud-db --user=postgres

# Or run setup script via Cloud Run Job
```

---

## Key Files for Production

### ✅ Files Used in GCP:
- `backend/server.js` ← **Production server with PostgreSQL**
- `backend/db.js` ← Database connection (Cloud SQL)
- `backend/setup_db.js` ← Creates tables on first run
- `backend/Dockerfile` ← Builds container
- `frontend/Dockerfile` ← Builds React app with nginx

### ❌ Files NOT Used in GCP:
- `backend/server-local.js` ← Only for local testing

---

## Production Architecture

```
[Users] 
   ↓
[Cloud Load Balancer]
   ↓
[Frontend - Cloud Run]  ← nginx serving React build
   ↓ API calls
[Backend - Cloud Run]   ← Node.js + Express
   ↓ Database queries
[Cloud SQL PostgreSQL]  ← Permanent data storage
```

---

## Testing the Deployment

After deployment, test:

```powershell
# Test backend health
$BACKEND_URL = "https://rrcloud-backend-xxx.run.app"
Invoke-WebRequest "$BACKEND_URL/health"

# Test applications endpoint
Invoke-WebRequest "$BACKEND_URL/api/applications"

# Test frontend
$FRONTEND_URL = "https://rrcloud-frontend-xxx.run.app"
Start-Process $FRONTEND_URL
```

---

## Quick Deploy Command

Use the PowerShell script:
```powershell
.\deploy.ps1 -ProjectId "rrcloud-platform" -Region "us-central1"
```

This script:
1. ✅ Builds backend Docker image (uses server.js)
2. ✅ Deploys to Cloud Run
3. ✅ Gets backend URL
4. ✅ Builds frontend with backend URL
5. ✅ Deploys frontend to Cloud Run
6. ✅ Returns both URLs

---

## Summary

| Aspect | Local (Now) | Production (GCP) |
|--------|-------------|------------------|
| Server | server-local.js | server.js |
| Database | In-memory | Cloud SQL PostgreSQL |
| Data | Temporary | Permanent |
| Setup | No DB needed | Cloud SQL required |
| Deploy | npm start | Docker + Cloud Run |
| URL | localhost | .run.app domain |
| SSL | No | Automatic HTTPS |

**Bottom line**: Your production deployment will automatically use the real database. The local test version is just for quick development!

---

## Next Steps

1. **Fix Frontend Display Issue** (working on it now)
2. **Test signup and admin locally**
3. **Setup Cloud SQL database**
4. **Deploy to GCP**
5. **Test production URLs**

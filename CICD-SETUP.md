# 🚀 Complete CI/CD Setup Guide for ZgenAi

## ✅ Step 1: Code Pushed to GitHub
Your code is now at: https://github.com/Sharvanandchaudary/RRCLOUD

---

## 📋 Step 2: Setup GCP Cloud SQL Database

Run these commands in your GCP Cloud Shell or local terminal with gcloud:

```bash
# Set your project
gcloud config set project rrcloud-platform

# Create PostgreSQL instance (takes 5-10 minutes)
gcloud sql instances create rrcloud-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD_HERE

# Create database
gcloud sql databases create sharvanandchaudhary --instance=rrcloud-db

# Get connection name (save this!)
gcloud sql instances describe rrcloud-db --format="value(connectionName)"
# Output will be: rrcloud-platform:us-central1:rrcloud-db
```

---

## 🔐 Step 3: Create GCP Service Account

```bash
# Create service account for GitHub Actions
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployment"

# Grant necessary permissions
gcloud projects add-iam-policy-binding rrcloud-platform \
  --member="serviceAccount:github-actions@rrcloud-platform.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding rrcloud-platform \
  --member="serviceAccount:github-actions@rrcloud-platform.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding rrcloud-platform \
  --member="serviceAccount:github-actions@rrcloud-platform.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding rrcloud-platform \
  --member="serviceAccount:github-actions@rrcloud-platform.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Create JSON key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@rrcloud-platform.iam.gserviceaccount.com

# Display the key (copy this entire JSON content)
cat github-actions-key.json
```

**⚠️ IMPORTANT**: Copy the entire JSON content. You'll paste it into GitHub Secrets.

---

## 🔑 Step 4: Enable Required GCP APIs

```bash
# Enable all required APIs
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable compute.googleapis.com
```

---

## 🔒 Step 5: Configure GitHub Secrets

Go to: https://github.com/Sharvanandchaudary/RRCLOUD/settings/secrets/actions

Click **"New repository secret"** and add each of these:

### Secret 1: `GCP_PROJECT_ID`
```
rrcloud-platform
```

### Secret 2: `GCP_SA_KEY`
```
Paste the ENTIRE JSON content from github-actions-key.json here
(It should start with { "type": "service_account", ... })
```

### Secret 3: `DATABASE_URL`
```
postgres://postgres:YOUR_SECURE_PASSWORD@/sharvanandchaudhary?host=/cloudsql/rrcloud-platform:us-central1:rrcloud-db
```
⚠️ Replace `YOUR_SECURE_PASSWORD` with the password you set in Step 2

### Secret 4: `FRONTEND_URL`
```
https://rrcloud-frontend-PLACEHOLDER.run.app
```
Note: This will be updated after first deployment

---

## 📊 Step 6: Verify GitHub Actions Setup

1. Go to: https://github.com/Sharvanandchaudary/RRCLOUD/actions
2. You should see the workflow file: **"Deploy to GCP Cloud Run"**
3. Check that all 4 secrets are added

---

## 🚀 Step 7: Deploy!

### Option A: Trigger via Push
```bash
# Make any small change
cd "C:\Users\vsaravan\OneDrive - Cadence Design Systems Inc\Desktop\RRCLOUD"
echo "# Auto-deploy test" >> README.md
git add .
git commit -m "trigger deployment"
git push origin main
```

### Option B: Manual Trigger
1. Go to: https://github.com/Sharvanandchaudary/RRCLOUD/actions
2. Click "Deploy to GCP Cloud Run"
3. Click "Run workflow" → "Run workflow"

---

## 📈 Step 8: Monitor Deployment

1. Go to Actions tab: https://github.com/Sharvanandchaudary/RRCLOUD/actions
2. Click on the running workflow
3. Watch the logs:
   - ✅ Backend deployment
   - ✅ Frontend deployment
   - ✅ URLs displayed at the end

**Deployment takes about 5-10 minutes**

---

## 🎯 Step 9: Get Your URLs

After successful deployment, check the Action logs for:

```
✅ Backend deployed at: https://rrcloud-backend-xxxxx.run.app
✅ Frontend deployed at: https://rrcloud-frontend-xxxxx.run.app
```

### Update Frontend URL Secret
1. Copy the frontend URL from logs
2. Go to: https://github.com/Sharvanandchaudary/RRCLOUD/settings/secrets/actions
3. Update `FRONTEND_URL` secret with the actual URL
4. This enables CORS for production

---

## 🧪 Step 10: Test Production

```powershell
# Test backend health
Invoke-WebRequest "https://rrcloud-backend-xxxxx.run.app/health"

# Test applications API
Invoke-WebRequest "https://rrcloud-backend-xxxxx.run.app/api/applications"

# Open frontend in browser
Start-Process "https://rrcloud-frontend-xxxxx.run.app"
```

---

## 🔄 Future Deployments (Automatic!)

Every time you push code to main branch:

```bash
git add .
git commit -m "your changes"
git push origin main
```

GitHub Actions will automatically:
1. ✅ Build new Docker images
2. ✅ Deploy to Cloud Run
3. ✅ Run health checks
4. ✅ Notify you of success/failure

---

## 📋 Quick Checklist

- [ ] Cloud SQL instance created
- [ ] Database password set
- [ ] Service account created
- [ ] Service account key downloaded
- [ ] Required APIs enabled
- [ ] All 4 GitHub secrets added
- [ ] Workflow triggered
- [ ] Backend URL obtained
- [ ] Frontend URL obtained
- [ ] FRONTEND_URL secret updated
- [ ] Production tested

---

## 🐛 Troubleshooting

### "Permission denied" errors
- Check service account has all required roles
- Verify GCP_SA_KEY secret is complete JSON

### "Database connection failed"
- Verify DATABASE_URL format is correct
- Check password matches what you set
- Ensure Cloud SQL instance is running

### "CORS errors"
- Update FRONTEND_URL secret with actual production URL
- Redeploy backend after updating

### "Build fails"
- Check GitHub Actions logs for specific error
- Verify all APIs are enabled in GCP
- Ensure billing is enabled

---

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs for detailed errors
2. Check GCP Cloud Run logs: `gcloud run services logs read rrcloud-backend`
3. Verify all secrets are set correctly
4. Ensure billing is enabled on GCP project

---

## 🎉 Success!

Once deployed, your RRCloud Platform will:
- ✅ Auto-deploy on every push to main
- ✅ Use PostgreSQL for permanent data
- ✅ Auto-scale based on traffic
- ✅ Have HTTPS enabled automatically
- ✅ Store data permanently in Cloud SQL

**Now go ahead and complete the setup steps!** 🚀

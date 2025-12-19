# RRCloud GCP Setup - Quick Commands
# Run these in GCP Cloud Shell or with gcloud CLI

Write-Host "🚀 RRCloud GCP Setup Script`n" -ForegroundColor Cyan

# Step 1: Set Project
Write-Host "Step 1: Setting GCP Project..." -ForegroundColor Yellow
gcloud config set project rrcloud-platform

# Step 2: Enable APIs
Write-Host "`nStep 2: Enabling Required APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable compute.googleapis.com

Write-Host "✅ APIs Enabled!`n" -ForegroundColor Green

# Step 3: Create Cloud SQL
Write-Host "Step 3: Creating Cloud SQL Database..." -ForegroundColor Yellow
Write-Host "⚠️  This takes 5-10 minutes. Please wait...`n" -ForegroundColor Red

$password = Read-Host "Enter a secure password for PostgreSQL"

gcloud sql instances create rrcloud-db `
  --database-version=POSTGRES_14 `
  --tier=db-f1-micro `
  --region=us-central1 `
  --root-password=$password

gcloud sql databases create sharvanandchaudhary --instance=rrcloud-db

Write-Host "✅ Cloud SQL Created!`n" -ForegroundColor Green

# Step 4: Get Connection String
Write-Host "Step 4: Getting Connection Details..." -ForegroundColor Yellow
$connectionName = gcloud sql instances describe rrcloud-db --format="value(connectionName)"
Write-Host "Connection Name: $connectionName`n" -ForegroundColor Cyan

$databaseUrl = "postgres://postgres:$password@/sharvanandchaudhary?host=/cloudsql/$connectionName"
Write-Host "📋 DATABASE_URL for GitHub Secret:" -ForegroundColor Yellow
Write-Host $databaseUrl -ForegroundColor White
Write-Host "`n⚠️  Copy this DATABASE_URL - you'll need it for GitHub Secrets!`n" -ForegroundColor Red

# Step 5: Create Service Account
Write-Host "Step 5: Creating Service Account..." -ForegroundColor Yellow

gcloud iam service-accounts create github-actions --display-name="GitHub Actions Deployment"

Write-Host "Adding permissions..." -ForegroundColor Gray

gcloud projects add-iam-policy-binding rrcloud-platform `
  --member="serviceAccount:github-actions@rrcloud-platform.iam.gserviceaccount.com" `
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding rrcloud-platform `
  --member="serviceAccount:github-actions@rrcloud-platform.iam.gserviceaccount.com" `
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding rrcloud-platform `
  --member="serviceAccount:github-actions@rrcloud-platform.iam.gserviceaccount.com" `
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding rrcloud-platform `
  --member="serviceAccount:github-actions@rrcloud-platform.iam.gserviceaccount.com" `
  --role="roles/cloudsql.client"

# Step 6: Create Key
Write-Host "`nStep 6: Creating Service Account Key..." -ForegroundColor Yellow

gcloud iam service-accounts keys create github-actions-key.json `
  --iam-account=github-actions@rrcloud-platform.iam.gserviceaccount.com

Write-Host "✅ Service Account Created!`n" -ForegroundColor Green

# Step 7: Display Key
Write-Host "📋 GCP_SA_KEY for GitHub Secret:" -ForegroundColor Yellow
Write-Host "⚠️  Copy ALL the content below (entire JSON):`n" -ForegroundColor Red
Get-Content github-actions-key.json
Write-Host ""

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              🎉 GCP Setup Complete!                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Go to: https://github.com/Sharvanandchaudary/RRCLOUD/settings/secrets/actions" -ForegroundColor White
Write-Host "2. Add these 4 secrets:" -ForegroundColor White
Write-Host "   • GCP_PROJECT_ID = rrcloud-platform" -ForegroundColor Gray
Write-Host "   • GCP_SA_KEY = (JSON content above)" -ForegroundColor Gray
Write-Host "   • DATABASE_URL = (connection string above)" -ForegroundColor Gray
Write-Host "   • FRONTEND_URL = https://placeholder.com (update after deploy)" -ForegroundColor Gray
Write-Host "`n3. Push code to trigger deployment!" -ForegroundColor White
Write-Host "   git push origin main`n" -ForegroundColor Gray

Write-Host "📚 See CICD-SETUP.md for detailed instructions" -ForegroundColor Cyan

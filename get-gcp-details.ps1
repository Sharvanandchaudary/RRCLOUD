# Fetch All GCP Details for GitHub Secrets
# Run this in GCP Cloud Shell or with gcloud CLI installed

Write-Host "`n🔍 Fetching GCP Configuration Details...`n" -ForegroundColor Cyan

# 1. Get Project ID
Write-Host "1️⃣  GCP_PROJECT_ID:" -ForegroundColor Yellow
$projectId = gcloud config get-value project
Write-Host "   $projectId" -ForegroundColor Green
Write-Host ""

# 2. Check if Cloud SQL instance exists
Write-Host "2️⃣  Checking Cloud SQL Database..." -ForegroundColor Yellow
$sqlExists = gcloud sql instances list --filter="name:rrcloud-db" --format="value(name)" 2>$null

if ($sqlExists) {
    Write-Host "   ✅ Cloud SQL instance 'rrcloud-db' exists" -ForegroundColor Green
    
    # Get connection name
    $connectionName = gcloud sql instances describe rrcloud-db --format="value(connectionName)"
    Write-Host "   Connection: $connectionName" -ForegroundColor Gray
    
    # Construct DATABASE_URL
    Write-Host "`n   📋 DATABASE_URL:" -ForegroundColor Yellow
    Write-Host "   postgres://postgres:YOUR_PASSWORD@/sharvanandchaudhary?host=/cloudsql/$connectionName" -ForegroundColor White
    Write-Host "   ⚠️  Replace YOUR_PASSWORD with your actual password`n" -ForegroundColor Red
} else {
    Write-Host "   ❌ Cloud SQL instance not found" -ForegroundColor Red
    Write-Host "   Creating it now (takes 5-10 minutes)...`n" -ForegroundColor Yellow
    
    $password = Read-Host "Enter a secure password for PostgreSQL" -AsSecureString
    $passwordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    
    gcloud sql instances create rrcloud-db `
      --database-version=POSTGRES_14 `
      --tier=db-f1-micro `
      --region=us-central1 `
      --root-password=$passwordText `
      --no-backup
    
    gcloud sql databases create sharvanandchaudhary --instance=rrcloud-db
    
    $connectionName = gcloud sql instances describe rrcloud-db --format="value(connectionName)"
    
    Write-Host "`n   📋 DATABASE_URL:" -ForegroundColor Yellow
    Write-Host "   postgres://postgres:$passwordText@/sharvanandchaudhary?host=/cloudsql/$connectionName" -ForegroundColor White
    Write-Host ""
}

# 3. Check if service account exists
Write-Host "3️⃣  Checking Service Account..." -ForegroundColor Yellow
$saExists = gcloud iam service-accounts list --filter="email:github-actions@$projectId.iam.gserviceaccount.com" --format="value(email)" 2>$null

if ($saExists) {
    Write-Host "   ✅ Service account exists" -ForegroundColor Green
    Write-Host "   Checking for existing key..." -ForegroundColor Gray
    
    if (Test-Path "github-actions-key.json") {
        Write-Host "   ✅ Key file found: github-actions-key.json`n" -ForegroundColor Green
    } else {
        Write-Host "   Creating new key..." -ForegroundColor Yellow
        gcloud iam service-accounts keys create github-actions-key.json `
          --iam-account=github-actions@$projectId.iam.gserviceaccount.com
        Write-Host "   ✅ Key created: github-actions-key.json`n" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Service account not found. Creating..." -ForegroundColor Yellow
    
    gcloud iam service-accounts create github-actions --display-name="GitHub Actions"
    
    # Grant permissions
    gcloud projects add-iam-policy-binding $projectId `
      --member="serviceAccount:github-actions@$projectId.iam.gserviceaccount.com" `
      --role="roles/run.admin" --quiet
    
    gcloud projects add-iam-policy-binding $projectId `
      --member="serviceAccount:github-actions@$projectId.iam.gserviceaccount.com" `
      --role="roles/storage.admin" --quiet
    
    gcloud projects add-iam-policy-binding $projectId `
      --member="serviceAccount:github-actions@$projectId.iam.gserviceaccount.com" `
      --role="roles/iam.serviceAccountUser" --quiet
    
    gcloud projects add-iam-policy-binding $projectId `
      --member="serviceAccount:github-actions@$projectId.iam.gserviceaccount.com" `
      --role="roles/cloudsql.client" --quiet
    
    # Create key
    gcloud iam service-accounts keys create github-actions-key.json `
      --iam-account=github-actions@$projectId.iam.gserviceaccount.com
    
    Write-Host "   ✅ Service account created with key`n" -ForegroundColor Green
}

# 4. Display GCP_SA_KEY
Write-Host "   📋 GCP_SA_KEY (copy entire JSON):" -ForegroundColor Yellow
Get-Content github-actions-key.json
Write-Host ""

# 5. Frontend URL
Write-Host "4️⃣  FRONTEND_URL:" -ForegroundColor Yellow
$frontendExists = gcloud run services list --filter="metadata.name:rrcloud-frontend" --format="value(status.url)" 2>$null

if ($frontendExists) {
    Write-Host "   $frontendExists" -ForegroundColor Green
} else {
    Write-Host "   Not deployed yet. Use: https://placeholder.com" -ForegroundColor Gray
    Write-Host "   Update this secret after first deployment`n" -ForegroundColor Gray
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           📋 GitHub Secrets Summary                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Copy these values to GitHub Secrets:" -ForegroundColor Yellow
Write-Host "https://github.com/Sharvanandchaudary/RRCLOUD/settings/secrets/actions`n" -ForegroundColor Cyan

Write-Host "Secret Name: GCP_PROJECT_ID" -ForegroundColor White
Write-Host "Value: $projectId`n" -ForegroundColor Gray

Write-Host "Secret Name: GCP_SA_KEY" -ForegroundColor White
Write-Host "Value: (entire JSON content from github-actions-key.json above)`n" -ForegroundColor Gray

Write-Host "Secret Name: DATABASE_URL" -ForegroundColor White
Write-Host "Value: (connection string shown in step 2 above)`n" -ForegroundColor Gray

Write-Host "Secret Name: FRONTEND_URL" -ForegroundColor White
Write-Host "Value: https://placeholder.com (update after first deploy)`n" -ForegroundColor Gray

Write-Host "⚠️  Make sure to save github-actions-key.json securely!" -ForegroundColor Red
Write-Host "🚀 After adding secrets, push to GitHub to trigger deployment!`n" -ForegroundColor Green

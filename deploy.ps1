# RRCloud GCP Deployment Script (PowerShell)
# Usage: .\deploy.ps1 -ProjectId "rrcloud-platform" -Region "us-central1"

param(
    [string]$ProjectId = "rrcloud-platform",
    [string]$Region = "us-central1"
)

Write-Host "🚀 Starting deployment to GCP Cloud Run" -ForegroundColor Green
Write-Host "Project: $ProjectId"
Write-Host "Region: $Region"

# Set project
Write-Host "📝 Configuring GCP project..." -ForegroundColor Yellow
gcloud config set project $ProjectId

# Deploy Backend
Write-Host "🔧 Building and deploying backend..." -ForegroundColor Yellow
Set-Location backend
gcloud builds submit --tag gcr.io/$ProjectId/rrcloud-backend
gcloud run deploy rrcloud-backend `
  --image gcr.io/$ProjectId/rrcloud-backend `
  --platform managed `
  --region $Region `
  --allow-unauthenticated `
  --port 5001 `
  --memory 512Mi

$BackendUrl = (gcloud run services describe rrcloud-backend --platform managed --region $Region --format 'value(status.url)')
Write-Host "✅ Backend deployed: $BackendUrl" -ForegroundColor Green

# Deploy Frontend
Set-Location ../frontend
Write-Host "🎨 Building and deploying frontend..." -ForegroundColor Yellow
"REACT_APP_API_URL=$BackendUrl" | Out-File -FilePath .env.production -Encoding UTF8
gcloud builds submit --tag gcr.io/$ProjectId/rrcloud-frontend
gcloud run deploy rrcloud-frontend `
  --image gcr.io/$ProjectId/rrcloud-frontend `
  --platform managed `
  --region $Region `
  --allow-unauthenticated `
  --port 80 `
  --memory 256Mi

$FrontendUrl = (gcloud run services describe rrcloud-frontend --platform managed --region $Region --format 'value(status.url)')
Write-Host "✅ Frontend deployed: $FrontendUrl" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "Frontend: $FrontendUrl"
Write-Host "Backend: $BackendUrl"

Set-Location ..

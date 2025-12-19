# Complete Local Testing Script
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   RRCloud Local Test Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$backendPath = "C:\Users\vsaravan\OneDrive - Cadence Design Systems Inc\Desktop\RRCLOUD\backend"
$frontendPath = "C:\Users\vsaravan\OneDrive - Cadence Design Systems Inc\Desktop\RRCLOUD\frontend"

# Step 1: Start Backend
Write-Host "Step 1: Starting Backend Server (Test Mode)..." -ForegroundColor Yellow
Write-Host "Opening new window for backend..." -ForegroundColor Gray

Start-Process powershell -ArgumentList @(
    '-NoExit'
    '-Command'
    "cd '$backendPath'; Write-Host '🚀 Starting Backend Server...' -ForegroundColor Green; node server-test.js"
)

Write-Host "✅ Backend starting in new window" -ForegroundColor Green

# Wait for backend
Write-Host "`nStep 2: Waiting for backend to be ready..." -ForegroundColor Yellow
$maxWait = 10
$waited = 0
$backendReady = $false

while ($waited -lt $maxWait -and -not $backendReady) {
    Start-Sleep -Seconds 1
    $waited++
    Write-Host "  Checking... ($waited/$maxWait)" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5001/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.status -eq "healthy") {
            $backendReady = $true
            Write-Host "✅ Backend is READY!" -ForegroundColor Green
            Write-Host "   Status: $($response.status)" -ForegroundColor White
            Write-Host "   Message: $($response.message)" -ForegroundColor White
        }
    } catch {
        # Continue waiting
    }
}

if (-not $backendReady) {
    Write-Host "`n⚠️  Backend took longer than expected" -ForegroundColor Yellow
    Write-Host "Check the backend window for any errors" -ForegroundColor Yellow
    Write-Host "Press Enter to continue with frontend anyway..." -ForegroundColor Gray
    Read-Host
}

# Step 3: Test Backend
Write-Host "`nStep 3: Testing Backend Endpoints..." -ForegroundColor Yellow

try {
    Write-Host "  Testing /health..." -ForegroundColor Gray
    $health = Invoke-RestMethod -Uri "http://localhost:5001/health"
    Write-Host "  ✅ Health check passed" -ForegroundColor Green
    
    Write-Host "  Testing /api/test..." -ForegroundColor Gray
    $test = Invoke-RestMethod -Uri "http://localhost:5001/api/test"
    Write-Host "  ✅ API test passed: $($test.message)" -ForegroundColor Green
    
    Write-Host "  Testing /api/applications..." -ForegroundColor Gray
    $apps = Invoke-RestMethod -Uri "http://localhost:5001/api/applications"
    Write-Host "  ✅ Applications endpoint working ($($apps.Count) sample records)" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Some endpoints not responding yet" -ForegroundColor Yellow
}

# Step 4: Start Frontend
Write-Host "`nStep 4: Starting Frontend..." -ForegroundColor Yellow
Write-Host "Opening new window for frontend..." -ForegroundColor Gray

Start-Process powershell -ArgumentList @(
    '-NoExit'
    '-Command'
    "cd '$frontendPath'; Write-Host '🎨 Starting Frontend Server...' -ForegroundColor Green; Write-Host 'Installing dependencies if needed...' -ForegroundColor Gray; npm install --silent; Write-Host 'Starting React app...' -ForegroundColor Green; npm start"
)

Write-Host "✅ Frontend starting in new window" -ForegroundColor Green

# Summary
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Write-Host "`n📊 Status:" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5001" -ForegroundColor Gray
Write-Host "   Frontend: http://localhost:3000 (opening soon)" -ForegroundColor Gray

Write-Host "`n🧪 Test Mode:" -ForegroundColor Yellow
Write-Host "   - Backend running WITHOUT database" -ForegroundColor Gray
Write-Host "   - Form submissions will show success but not save" -ForegroundColor Gray
Write-Host "   - Admin dashboard shows sample data" -ForegroundColor Gray

Write-Host "`n📝 Next Steps:" -ForegroundColor White
Write-Host "   1. Wait for browser to open (http://localhost:3000)" -ForegroundColor Gray
Write-Host "   2. Click 'APPLY NOW' to test signup form" -ForegroundColor Gray
Write-Host "   3. Click 'ADMIN LOGIN' to see dashboard" -ForegroundColor Gray
Write-Host "   4. Once verified, deploy with: .\deploy.ps1" -ForegroundColor Gray

Write-Host "`n⚠️  Keep terminal windows open while testing!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C in each window to stop servers`n" -ForegroundColor Gray

# Simple Backend Test (No Database Required)
Write-Host "🧪 Testing Backend Server..." -ForegroundColor Cyan

$backendPort = 5001
$maxAttempts = 5
$attempt = 0
$serverRunning = $false

Write-Host "`nChecking if backend is running on port $backendPort..." -ForegroundColor Yellow

while ($attempt -lt $maxAttempts -and -not $serverRunning) {
    $attempt++
    Start-Sleep -Seconds 1
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$backendPort/health" -Method Get -TimeoutSec 2
        $serverRunning = $true
        Write-Host "✅ Backend is RUNNING!" -ForegroundColor Green
        Write-Host "Status: $($response.status)" -ForegroundColor Green
        Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Green
    } catch {
        Write-Host "Attempt $attempt/$maxAttempts - Backend not responding yet..." -ForegroundColor Yellow
    }
}

if (-not $serverRunning) {
    Write-Host "`n❌ Backend is NOT running" -ForegroundColor Red
    Write-Host "`nTo start backend:" -ForegroundColor Yellow
    Write-Host "1. Open a new terminal" -ForegroundColor White
    Write-Host "2. cd backend" -ForegroundColor White
    Write-Host "3. node server.js" -ForegroundColor White
    Write-Host "`nOR run this command:" -ForegroundColor Yellow
    Write-Host "Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backend; node server.js'" -ForegroundColor Cyan
    exit 1
}

Write-Host "`n🎯 Backend server is ready for connections!" -ForegroundColor Green
Write-Host "You can now start the frontend with: cd frontend; npm start" -ForegroundColor Cyan

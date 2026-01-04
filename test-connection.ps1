# Test Connection Script
Write-Host "🧪 Testing ZgenAi Connection..." -ForegroundColor Cyan

# Test 1: Check if backend port is available
Write-Host "`n1️⃣ Testing backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is running!" -ForegroundColor Green
        Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json)
    }
} catch {
    Write-Host "❌ Backend not running on port 5001" -ForegroundColor Red
    Write-Host "Run: cd backend; node server.js" -ForegroundColor Yellow
}

# Test 2: Check database connection
Write-Host "`n2️⃣ Testing database connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/api/applications" -Method GET -TimeoutSec 5
    Write-Host "✅ Database connected!" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Found $($data.Count) applications"
} catch {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
    Write-Host "Check DATABASE_URL in backend/.env" -ForegroundColor Yellow
}

# Test 3: Test application submission
Write-Host "`n3️⃣ Testing signup endpoint..." -ForegroundColor Yellow
$testData = @{
    fullName = "Test User"
    email = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    phone = "1234567890"
    aboutMe = "Automated test"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/api/applications" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testData `
        -TimeoutSec 5
    
    if ($response.StatusCode -eq 201) {
        Write-Host "✅ Signup endpoint working!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Signup endpoint failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
}

# Test 4: Check frontend
Write-Host "`n4️⃣ Checking frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is running!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend not running on port 3000" -ForegroundColor Red
    Write-Host "Run: cd frontend; npm start" -ForegroundColor Yellow
}

Write-Host "`n✅ Testing completed!" -ForegroundColor Cyan

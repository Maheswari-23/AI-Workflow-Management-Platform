# Orchestr Platform Startup Script
# This script ensures a clean start of the platform

Write-Host "🚀 Starting Orchestr Platform..." -ForegroundColor Cyan
Write-Host ""

# Stop any existing Node processes
Write-Host "1. Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clean up Docker containers
Write-Host "2. Cleaning up Docker containers..." -ForegroundColor Yellow
docker ps -a --filter "name=orchestr-task" --format "{{.Names}}" | ForEach-Object { 
    docker rm -f $_ 2>$null
}

# Verify Docker image exists
Write-Host "3. Checking Docker image..." -ForegroundColor Yellow
$imageExists = docker images -q orchestr-task-runner:latest
if (-not $imageExists) {
    Write-Host "   Building Docker image..." -ForegroundColor Yellow
    docker build -t orchestr-task-runner:latest -f containers/task-runner.dockerfile .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
        exit 1
    }
}
Write-Host "   ✓ Docker image ready" -ForegroundColor Green

# Start Backend
Write-Host ""
Write-Host "4. Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; node server.js" -WindowStyle Normal
Start-Sleep -Seconds 3

# Check if backend started
$backendRunning = netstat -ano | Select-String ":5000" | Select-Object -First 1
if ($backendRunning) {
    Write-Host "   ✓ Backend running on http://localhost:5000" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Backend may not have started properly" -ForegroundColor Yellow
}

# Start Frontend
Write-Host ""
Write-Host "5. Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Platform startup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access the platform at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "   - Check the new terminal windows for logs" -ForegroundColor White
Write-Host "   - Press Ctrl+C in each window to stop services" -ForegroundColor White
Write-Host "   - Run this script again to restart everything" -ForegroundColor White
Write-Host ""

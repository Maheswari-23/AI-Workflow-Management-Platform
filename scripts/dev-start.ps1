
# AI Workflow Platform - Development Start Script

Write-Host "Starting AI Workflow Platform..." -ForegroundColor Green

# Start databases
Write-Host "Starting databases..." -ForegroundColor Yellow
Set-Location containers
podman-compose up -d
Set-Location ..

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm run install:all
}

# Start development servers
Write-Host "Starting development servers..." -ForegroundColor Yellow
npm run dev


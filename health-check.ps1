# Orchestr Platform Health Check
Write-Host "Orchestr Platform Health Check" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

$allHealthy = $true

# Check Node.js
Write-Host "1. Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   OK Node.js $nodeVersion installed" -ForegroundColor Green
} catch {
    Write-Host "   ERROR Node.js not found" -ForegroundColor Red
    $allHealthy = $false
}

# Check Docker
Write-Host "2. Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   OK Docker installed" -ForegroundColor Green
} catch {
    Write-Host "   ERROR Docker not found" -ForegroundColor Red
    $allHealthy = $false
}

# Check Database
Write-Host "3. Checking Database..." -ForegroundColor Yellow
if (Test-Path "data/workflow.db") {
    Write-Host "   OK Database exists" -ForegroundColor Green
} else {
    Write-Host "   WARN Database will be created on first run" -ForegroundColor Yellow
}

# Check Backend Dependencies
Write-Host "4. Checking Backend Dependencies..." -ForegroundColor Yellow
if (Test-Path "backend/node_modules") {
    Write-Host "   OK Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ERROR Backend dependencies missing" -ForegroundColor Red
    $allHealthy = $false
}

# Check Frontend Dependencies
Write-Host "5. Checking Frontend Dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend/node_modules") {
    Write-Host "   OK Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ERROR Frontend dependencies missing" -ForegroundColor Red
    $allHealthy = $false
}

# Check Environment
Write-Host "6. Checking Environment..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   OK .env file exists" -ForegroundColor Green
} else {
    Write-Host "   ERROR .env file missing" -ForegroundColor Red
    $allHealthy = $false
}

# Check Syntax
Write-Host "7. Checking Code Syntax..." -ForegroundColor Yellow
$syntaxOK = $true
node -c backend/server.js 2>$null
if ($LASTEXITCODE -ne 0) { $syntaxOK = $false }
node -c backend/src/database/db.js 2>$null
if ($LASTEXITCODE -ne 0) { $syntaxOK = $false }

if ($syntaxOK) {
    Write-Host "   OK All files have valid syntax" -ForegroundColor Green
} else {
    Write-Host "   ERROR Syntax errors found" -ForegroundColor Red
    $allHealthy = $false
}

# Summary
Write-Host ""
Write-Host "===============================" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host "SUCCESS All critical checks passed!" -ForegroundColor Green
} else {
    Write-Host "WARNING Some issues detected" -ForegroundColor Yellow
}
Write-Host ""

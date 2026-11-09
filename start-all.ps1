# KindMinds Platform Unified Runner
Write-Host "Starting KindMinds Services..." -ForegroundColor Cyan

# 1. Start Backend in separate process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; .\start-backend.ps1"

# 2. Start Frontend in separate process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; .\start-frontend.ps1"

Write-Host "Both services are launching in their own consoles!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:4321" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:8001" -ForegroundColor Yellow


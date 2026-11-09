# KindMinds Backend Startup
# Run from project root: .\start-backend.ps1
Set-Location $PSScriptRoot
Write-Host "Starting KindMinds Backend on http://localhost:8001" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8001/docs" -ForegroundColor Green
backend\.venv\Scripts\python.exe backend\run.py


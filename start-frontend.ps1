# KindMinds Frontend Startup
# Run from project root: .\start-frontend.ps1
Set-Location $PSScriptRoot\frontend
Write-Host "Starting KindMinds Frontend on http://localhost:4321" -ForegroundColor Cyan
Write-Host "Helper Panel: http://localhost:4321/helper" -ForegroundColor Green
Write-Host "Needer Panel: http://localhost:4321/needer" -ForegroundColor Green
pnpm run dev


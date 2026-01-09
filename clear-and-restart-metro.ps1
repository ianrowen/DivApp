# Clear Metro cache completely and restart
# This fixes route errors and stale cache issues

Write-Host "`n=== Clearing Metro Cache and Restarting ===" -ForegroundColor Cyan

# Kill any running Metro processes
Write-Host "`nStopping any running Metro processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*expo*" -or $_.CommandLine -like "*metro*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clear Metro cache
Write-Host "Clearing Metro cache..." -ForegroundColor Yellow
if (Test-Path "$env:TEMP\metro-*") {
    Remove-Item "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "$env:TEMP\haste-*") {
    Remove-Item "$env:TEMP\haste-*" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path ".\.expo") {
    Remove-Item ".\.expo" -Recurse -Force -ErrorAction SilentlyContinue
}

# Clear watchman cache if available
if (Get-Command watchman -ErrorAction SilentlyContinue) {
    Write-Host "Clearing Watchman cache..." -ForegroundColor Yellow
    watchman watch-del-all 2>&1 | Out-Null
}

# Clear node_modules/.cache
if (Test-Path "node_modules\.cache") {
    Write-Host "Clearing node_modules cache..." -ForegroundColor Yellow
    Remove-Item "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "`n✅ Cache cleared!" -ForegroundColor Green

# Disconnect ghost emulator
Write-Host "`nDisconnecting ghost emulator..." -ForegroundColor Yellow
adb -s emulator-5554 disconnect 2>&1 | Out-Null

# Start Metro with cache clear
Write-Host "`nStarting Metro with cleared cache..." -ForegroundColor Cyan
Write-Host "Choose mode:" -ForegroundColor Cyan
Write-Host "  [1] Tunnel (works from anywhere)" -ForegroundColor White
Write-Host "  [2] LAN (faster, same WiFi)" -ForegroundColor White
Write-Host "  [3] Default (auto-detect)" -ForegroundColor White
$choice = Read-Host "Enter choice (1-3, default: 2)"

switch ($choice) {
    "1" {
        Write-Host "`nStarting Metro with Tunnel..." -ForegroundColor Green
        npx expo start --tunnel --clear
    }
    "2" {
        Write-Host "`nStarting Metro with LAN..." -ForegroundColor Green
        npx expo start --lan --clear
    }
    default {
        Write-Host "`nStarting Metro (auto-detect)..." -ForegroundColor Green
        npx expo start --clear
    }
}








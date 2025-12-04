# Start Metro bundler with ghost emulator workaround
# Disconnects ghost device before starting Metro

Write-Host "Starting Metro bundler..." -ForegroundColor Cyan
Write-Host "Disconnecting ghost emulator to prevent errors..." -ForegroundColor Yellow

# Disconnect ghost device
adb -s emulator-5554 disconnect 2>&1 | Out-Null
Start-Sleep -Milliseconds 500

# Check if user wants to clear cache
Write-Host "`nClear Metro cache?" -ForegroundColor Cyan
Write-Host "  [Y] Yes (recommended after code changes)"
Write-Host "  [N] No (faster startup)"
$clearCache = Read-Host "Enter choice (Y/N, default: Y)"
$shouldClear = $clearCache -eq "Y" -or $clearCache -eq "y" -or [string]::IsNullOrWhiteSpace($clearCache)

# Check if user wants tunnel or lan mode
Write-Host "`nChoose Metro mode:" -ForegroundColor Cyan
Write-Host "  [1] Tunnel (works from anywhere, most reliable)"
Write-Host "  [2] LAN (faster, requires same WiFi network)"
Write-Host "  [3] Default (auto-detect, best for USB)"
$choice = Read-Host "Enter choice (1-3, default: 3)"

switch ($choice) {
    "1" {
        Write-Host "`nStarting Metro with tunnel..." -ForegroundColor Green
        if ($shouldClear) {
            Write-Host "Clearing cache..." -ForegroundColor Yellow
            npx expo start --tunnel --clear
        } else {
            npx expo start --tunnel
        }
    }
    "2" {
        Write-Host "`nStarting Metro with LAN..." -ForegroundColor Green
        if ($shouldClear) {
            Write-Host "Clearing cache..." -ForegroundColor Yellow
            npx expo start --lan --clear
        } else {
            npx expo start --lan
        }
    }
    default {
        Write-Host "`nStarting Metro (auto-detect)..." -ForegroundColor Green
        if ($shouldClear) {
            Write-Host "Clearing cache..." -ForegroundColor Yellow
            npx expo start --clear
        } else {
            npx expo start
        }
        Write-Host "Note: If you see ghost emulator errors, they're harmless - Metro will still work!" -ForegroundColor Yellow
    }
}


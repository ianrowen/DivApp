# Clear all caches for clean rebuild
Write-Host "Clearing all caches..." -ForegroundColor Yellow

# Stop Metro if running
Write-Host "`nStopping Metro bundler..." -ForegroundColor Cyan
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*metro*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clear Metro cache
Write-Host "Clearing Metro cache..." -ForegroundColor Cyan
if (Test-Path "$env:TEMP\metro-*") {
    Remove-Item "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "$env:TEMP\haste-map-*") {
    Remove-Item "$env:TEMP\haste-map-*" -Recurse -Force -ErrorAction SilentlyContinue
}

# Clear Expo cache
Write-Host "Clearing Expo cache..." -ForegroundColor Cyan
if (Test-Path ".expo") {
    Remove-Item ".expo" -Recurse -Force -ErrorAction SilentlyContinue
}

# Clear node_modules/.cache
Write-Host "Clearing node_modules cache..." -ForegroundColor Cyan
if (Test-Path "node_modules\.cache") {
    Remove-Item "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
}

# Clear watchman cache (if installed)
Write-Host "Clearing Watchman cache..." -ForegroundColor Cyan
watchman watch-del-all 2>$null

# Clear Android build cache
Write-Host "Clearing Android build cache..." -ForegroundColor Cyan
if (Test-Path "android\.gradle") {
    Remove-Item "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "android\app\build") {
    Remove-Item "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "`n✓ Cache cleared! Now run: npx expo start --clear" -ForegroundColor Green


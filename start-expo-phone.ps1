# Start Expo Metro bundler for phone development
# This script sets up port forwarding and starts Metro for Expo Go

Write-Host "`n=== Starting Expo for Phone Development ===" -ForegroundColor Cyan

# Check for connected devices
$allDevices = adb devices -l
$devices = $allDevices | Select-Object -Skip 1 | Where-Object { $_ -match "device\s" -and $_ -notmatch "emulator" }

if (-not $devices) {
    Write-Host "`n❌ No phone/device found!" -ForegroundColor Red
    Write-Host "`nCurrent ADB devices:" -ForegroundColor Cyan
    Write-Host $allDevices -ForegroundColor White
    Write-Host "`nMake sure your phone is connected via USB with USB debugging enabled." -ForegroundColor Yellow
    exit 1
}

# Get the first physical device
$deviceId = ($devices | Select-Object -First 1) -replace '\s+device.*', '' -replace '^\s+', ''
Write-Host "`n✅ Phone found: $deviceId" -ForegroundColor Green

# Set up port forwarding for Metro bundler
Write-Host "`nSetting up Metro port forwarding (8081)..." -ForegroundColor Cyan
$portForwardResult = adb -s $deviceId reverse tcp:8081 tcp:8081 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Port forwarding configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Port forwarding failed: $portForwardResult" -ForegroundColor Yellow
}

Write-Host "`nStarting Expo Metro bundler..." -ForegroundColor Cyan
Write-Host "`n📱 Instructions:" -ForegroundColor Yellow
Write-Host "1. Open Expo Go app on your phone" -ForegroundColor White
Write-Host "2. Scan the QR code that appears, or" -ForegroundColor White
Write-Host "3. Connect to the same Wi-Fi network and use the connection URL" -ForegroundColor White
Write-Host "`nPress Ctrl+C to stop Metro when done." -ForegroundColor Cyan
Write-Host ""

# Start Expo
npx expo start









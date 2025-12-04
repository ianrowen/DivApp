# Quick install script - installs to all connected devices (phone + BlueStacks if connected)

Write-Host "`n=== Quick Install to All Devices ===" -ForegroundColor Cyan

$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"

if (-not (Test-Path $apkPath)) {
    Write-Host "`n❌ APK not found. Building..." -ForegroundColor Yellow
    cd android
    .\gradlew.bat assembleDebug --no-daemon
    cd ..
    
    if (-not (Test-Path $apkPath)) {
        Write-Host "`n❌ Build failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✅ APK ready: $apkPath" -ForegroundColor Green

# Get all connected devices (excluding ghost emulator)
$devices = adb devices -l | Select-Object -Skip 1 | Where-Object { $_ -match "device" -and $_ -notmatch "emulator-5554" }

if ($devices.Count -eq 0) {
    Write-Host "`n⚠️  No devices found!" -ForegroundColor Yellow
    Write-Host "`nMake sure:" -ForegroundColor Cyan
    Write-Host "  - Your phone is connected via USB (or wireless ADB)" -ForegroundColor White
    Write-Host "  - BlueStacks ADB is enabled (Settings > Advanced > ADB)" -ForegroundColor White
    exit 1
}

Write-Host "`nFound $($devices.Count) device(s):" -ForegroundColor Green

$successCount = 0
foreach ($device in $devices) {
    if ($device -match "^(\S+)\s+device") {
        $deviceId = $matches[1]
        
        # Get device info
        $deviceInfo = adb -s $deviceId shell getprop ro.product.model 2>&1
        if ($deviceInfo -match "error") {
            $deviceInfo = "Unknown"
        }
        
        Write-Host "`nInstalling to: $deviceId ($deviceInfo)" -ForegroundColor Cyan
        adb -s $deviceId install -r $apkPath 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Installed successfully!" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  ❌ Installation failed" -ForegroundColor Red
        }
    }
}

if ($successCount -gt 0) {
    Write-Host "`n✅ Installed on $successCount device(s)!" -ForegroundColor Green
    Write-Host "`n**To test with hot reload:**" -ForegroundColor Cyan
    Write-Host "  1. Start Metro: .\start-metro.ps1" -ForegroundColor White
    Write-Host "  2. Choose LAN mode (option 2)" -ForegroundColor White
    Write-Host "  3. Launch the app on your device(s)" -ForegroundColor White
} else {
    Write-Host "`n❌ Installation failed on all devices!" -ForegroundColor Red
}


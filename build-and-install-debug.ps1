# Build DEBUG APK and install to connected devices
# This version supports hot reload with Metro bundler

Write-Host "Building DEBUG APK (supports hot reload with Metro)..." -ForegroundColor Cyan
Write-Host "⚠️  Make sure Metro is running: npx expo start" -ForegroundColor Yellow

# Set environment
$env:NODE_ENV = "development"

Write-Host "Building Android Debug APK..." -ForegroundColor Cyan
cd android
.\gradlew.bat assembleDebug --no-daemon

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed!" -ForegroundColor Red
    exit 1
}

cd ..
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"

if (-not (Test-Path $apkPath)) {
    Write-Host "`n❌ APK not found at: $apkPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Build successful!" -ForegroundColor Green

# Get list of connected devices (excluding ghost emulator-5554)
Write-Host "`nChecking connected devices..." -ForegroundColor Cyan
$devicesOutput = adb devices -l | Select-Object -Skip 1 | Where-Object { $_ -match "device" -and $_ -notmatch "emulator-5554" }
$devices = @()

foreach ($line in $devicesOutput) {
    if ($line -match "^(\S+)\s+device") {
        $deviceId = $matches[1]
        $devices += $deviceId
    }
}

# Connect to BlueStacks if not already connected
if ($devices -notcontains "127.0.0.1:5555") {
    Write-Host "Connecting to BlueStacks..." -ForegroundColor Cyan
    adb connect 127.0.0.1:5555 2>&1 | Out-Null
    Start-Sleep -Seconds 2
    $devicesOutput = adb devices -l | Select-Object -Skip 1 | Where-Object { $_ -match "device" -and $_ -notmatch "emulator-5554" }
    $devices = @()
    foreach ($line in $devicesOutput) {
        if ($line -match "^(\S+)\s+device") {
            $deviceId = $matches[1]
            $devices += $deviceId
        }
    }
}

if ($devices.Count -eq 0) {
    Write-Host "`n⚠️  No devices found!" -ForegroundColor Yellow
    Write-Host "`nTo connect your physical device:" -ForegroundColor Cyan
    Write-Host "  1. Enable USB debugging on your phone (Settings > Developer Options)"
    Write-Host "  2. Connect via USB, or use: adb connect <device-ip>:5555"
    Write-Host "  3. Run this script again"
    exit 1
}

Write-Host "`nFound $($devices.Count) device(s):" -ForegroundColor Green
for ($i = 0; $i -lt $devices.Count; $i++) {
    $deviceInfo = adb -s $devices[$i] shell getprop ro.product.model 2>&1
    if ($deviceInfo -match "error") {
        $deviceInfo = "Unknown device"
    }
    Write-Host "  [$($i+1)] $($devices[$i]) - $deviceInfo" -ForegroundColor Cyan
}

# Install to all devices or let user choose
if ($devices.Count -eq 1) {
    $selectedDevices = $devices
    Write-Host "`nInstalling to: $($devices[0])" -ForegroundColor Cyan
} else {
    Write-Host "`nInstall to:" -ForegroundColor Cyan
    Write-Host "  [A] All devices"
    Write-Host "  [1-$($devices.Count)] Specific device"
    $choice = Read-Host "Enter choice"
    
    if ($choice -eq "A" -or $choice -eq "a") {
        $selectedDevices = $devices
    } elseif ([int]$choice -ge 1 -and [int]$choice -le $devices.Count) {
        $selectedDevices = @($devices[[int]$choice - 1])
    } else {
        Write-Host "Invalid choice. Installing to all devices." -ForegroundColor Yellow
        $selectedDevices = $devices
    }
}

# Install APK to selected devices
$successCount = 0
foreach ($device in $selectedDevices) {
    Write-Host "`nInstalling to $device..." -ForegroundColor Cyan
    adb -s $device install -r $apkPath 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Installed successfully on $device" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "❌ Installation failed on $device" -ForegroundColor Red
    }
}

if ($successCount -gt 0) {
    Write-Host "`n✅ Installed on $successCount device(s)!" -ForegroundColor Green
    Write-Host "`n📱 **Hot Reload Setup:**" -ForegroundColor Cyan
    Write-Host "1. Make sure Metro is running: npx expo start" -ForegroundColor Yellow
    Write-Host "2. Launch the app on your device" -ForegroundColor Yellow
    Write-Host "3. The app will connect to Metro automatically" -ForegroundColor Yellow
    Write-Host "4. Changes will hot reload! 🔥" -ForegroundColor Green
    Write-Host "`n💡 Tip: For USB devices, Metro auto-detects. For wireless, make sure phone and computer are on same WiFi." -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Installation failed on all devices!" -ForegroundColor Red
    exit 1
}






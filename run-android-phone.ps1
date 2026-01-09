# Run Android app on connected phone
# This script builds and installs the app on your connected Android phone

Write-Host "`n=== Running Android App on Phone ===" -ForegroundColor Cyan

# Check for connected devices
$allDevices = adb devices -l
$devices = $allDevices | Select-Object -Skip 1 | Where-Object { $_ -match "device\s" -and $_ -notmatch "emulator" }

if (-not $devices) {
    Write-Host "`n❌ No phone/device found!" -ForegroundColor Red
    Write-Host "`nCurrent ADB devices:" -ForegroundColor Cyan
    Write-Host $allDevices -ForegroundColor White
    Write-Host "`nMake sure:" -ForegroundColor Yellow
    Write-Host "1. Your phone is connected via USB" -ForegroundColor White
    Write-Host "2. USB debugging is enabled on your phone" -ForegroundColor White
    Write-Host "3. You've authorized the computer on your phone" -ForegroundColor White
    exit 1
}

# Get the first physical device (skip emulators)
$deviceId = ($devices | Select-Object -First 1) -replace '\s+device.*', '' -replace '^\s+', ''
Write-Host "`n✅ Phone found: $deviceId" -ForegroundColor Green

# Set up port forwarding for Metro bundler
Write-Host "`nSetting up Metro port forwarding (8081)..." -ForegroundColor Cyan
$portForwardResult = adb -s $deviceId reverse tcp:8081 tcp:8081 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Port forwarding configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Port forwarding failed: $portForwardResult" -ForegroundColor Yellow
    Write-Host "Metro connection may not work. Continuing anyway..." -ForegroundColor Yellow
}

Write-Host "`nBuilding and installing app..." -ForegroundColor Cyan

# Build APK directly using Gradle
Write-Host "`nStep 1: Building debug APK..." -ForegroundColor Cyan
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

Push-Location android
$buildResult = .\gradlew.bat assembleDebug --no-daemon 2>&1
$buildExitCode = $LASTEXITCODE
Pop-Location

if ($buildExitCode -ne 0) {
    Write-Host "`n❌ Build failed!" -ForegroundColor Red
    # Show last 20 lines of build output for debugging
    $buildResultLines = $buildResult -split "`n"
    $lastLines = $buildResultLines[-20..-1] -join "`n"
    Write-Host $lastLines -ForegroundColor Red
    exit 1
}

# Find the APK
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkPath)) {
    Write-Host "`n❌ APK not found at: $apkPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ APK built successfully" -ForegroundColor Green

# Install APK
Write-Host "`nStep 2: Installing APK to phone ($deviceId)..." -ForegroundColor Cyan
$installResult = adb -s $deviceId install -r $apkPath 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ APK installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Installation failed: $installResult" -ForegroundColor Red
    exit 1
}

# Launch the app
Write-Host "`nStep 3: Launching app..." -ForegroundColor Cyan
$launchResult = adb -s $deviceId shell monkey -p com.divin8.app -c android.intent.category.LAUNCHER 1 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App launched" -ForegroundColor Green
} else {
    Write-Host "⚠️  Launch command completed (app may already be running)" -ForegroundColor Yellow
}

Write-Host "`n✅ Done! The app should now be running on your phone." -ForegroundColor Green
Write-Host "`nNote: Make sure Metro bundler is running (npx expo start) for hot reload to work." -ForegroundColor Cyan











# Run Android app on BlueStacks using device ID (avoids port connection errors)
# This script ensures Expo uses the ADB device ID instead of trying direct TCP connections

Write-Host "`n=== Running Android App on BlueStacks ===" -ForegroundColor Cyan

# Check if BlueStacks is connected
$allDevices = adb devices -l
# BlueStacks can appear as "emulator-5560", "emulator-5561", or "127.0.0.1:5561" depending on connection method
$devices = $allDevices | Select-Object -Skip 1 | Where-Object { $_ -match "(emulator-556[01]|127\.0\.0\.1:5561)" }

if (-not $devices) {
    Write-Host "`n⚠️  BlueStacks not found in ADB devices" -ForegroundColor Yellow
    Write-Host "`nAttempting to connect to BlueStacks on port 5561..." -ForegroundColor Cyan
    $connectResult = adb connect 127.0.0.1:5561 2>&1
    Write-Host $connectResult -ForegroundColor $(if ($LASTEXITCODE -eq 0) { "Green" } else { "Yellow" })
    
    # Check again after connection attempt
    Start-Sleep -Seconds 1
    $allDevices = adb devices -l
    $devices = $allDevices | Select-Object -Skip 1 | Where-Object { $_ -match "(emulator-556[01]|127\.0\.0\.1:5561)" }
    
    if (-not $devices) {
        Write-Host "`n❌ Still unable to connect to BlueStacks!" -ForegroundColor Red
        Write-Host "`nCurrent ADB devices:" -ForegroundColor Cyan
        Write-Host $allDevices -ForegroundColor White
        Write-Host "`nTo enable ADB in BlueStacks:" -ForegroundColor Cyan
        Write-Host "1. Open BlueStacks Settings" -ForegroundColor White
        Write-Host "2. Go to Advanced > Android Debug Bridge (ADB)" -ForegroundColor White
        Write-Host "3. Enable 'Enable Android Debug Bridge (ADB)'" -ForegroundColor White
        Write-Host "4. Note the port number (should be 5561)" -ForegroundColor White
        Write-Host "5. Run this script again" -ForegroundColor White
        exit 1
    }
}

# Disconnect ALL stale emulator connections that point to non-existent ports
# This prevents build tools from trying to connect to wrong ports
Write-Host "`nCleaning up stale device connections..." -ForegroundColor Cyan
$maxDisconnectAttempts = 5
$disconnectAttempt = 0
while ($disconnectAttempt -lt $maxDisconnectAttempts) {
    $allDevicesList = adb devices -l | Select-Object -Skip 1
    $foundEmulator5560 = $false
    foreach ($deviceLine in $allDevicesList) {
        if ($deviceLine -match "emulator-5560") {
            $foundEmulator5560 = $true
            Write-Host "Disconnecting emulator-5560 (attempt $($disconnectAttempt + 1))..." -ForegroundColor Yellow
            adb disconnect emulator-5560 2>&1 | Out-Null
            Start-Sleep -Milliseconds 500
        }
    }
    if (-not $foundEmulator5560) {
        break
    }
    $disconnectAttempt++
}

# Refresh device list after cleanup
$allDevices = adb devices -l
$devices = $allDevices | Select-Object -Skip 1 | Where-Object { $_ -match "(emulator-556[01]|127\.0\.0\.1:5561)" }

# Verify we still have a valid device after cleanup
if (-not $devices) {
    Write-Host "`n⚠️  No BlueStacks device found after cleanup. Reconnecting..." -ForegroundColor Yellow
    $connectResult = adb connect 127.0.0.1:5561 2>&1
    Write-Host $connectResult -ForegroundColor $(if ($LASTEXITCODE -eq 0) { "Green" } else { "Yellow" })
    Start-Sleep -Seconds 2
    $allDevices = adb devices -l
    $devices = $allDevices | Select-Object -Skip 1 | Where-Object { $_ -match "(emulator-556[01]|127\.0\.0\.1:5561)" }
}

# Determine which device ID to use
# Prefer 127.0.0.1:5561 since emulator-5560 causes port 5560 connection errors
$deviceId = $null
if ($devices -match "127\.0\.0\.1:5561") {
    $deviceId = "127.0.0.1:5561"
} elseif ($devices -match "emulator-5561") {
    $deviceId = "emulator-5561"
} elseif ($devices -match "emulator-5560") {
    # Only use emulator-5560 if nothing else is available (but it will likely fail)
    Write-Host "⚠️  Only emulator-5560 found. This may cause port 5560 connection errors." -ForegroundColor Yellow
    $deviceId = "emulator-5560"
}

Write-Host "`n✅ BlueStacks found: $deviceId" -ForegroundColor Green

# Set up port forwarding for Metro bundler (required for BlueStacks)
Write-Host "`nSetting up Metro port forwarding (8081)..." -ForegroundColor Cyan
$portForwardResult = adb -s $deviceId reverse tcp:8081 tcp:8081 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Port forwarding configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Port forwarding failed: $portForwardResult" -ForegroundColor Yellow
    Write-Host "Metro connection may not work. Continuing anyway..." -ForegroundColor Yellow
}

Write-Host "`nBuilding and installing app (bypassing Expo device resolution)..." -ForegroundColor Cyan

# Set ANDROID_SERIAL to force ALL ADB commands to use the correct device
# This prevents build tools from detecting and trying to use emulator-5560
$env:ANDROID_SERIAL = $deviceId
Write-Host "Set ANDROID_SERIAL=$deviceId to force ADB to use correct device" -ForegroundColor Cyan

# Also set EXPO_NO_DOTENV to prevent Expo from interfering
$env:EXPO_NO_DOTENV = "1"

# Build APK directly using Gradle to avoid Expo's device resolution issues
Write-Host "`nStep 1: Building debug APK..." -ForegroundColor Cyan
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host "Note: If you see port 5560 errors, they can be ignored - the build will continue." -ForegroundColor Yellow

# Start a background job to keep emulator-5560 disconnected during build
$keepDisconnectedJob = Start-Job -ScriptBlock {
    while ($true) {
        $devices = adb devices -l | Select-Object -Skip 1
        foreach ($deviceLine in $devices) {
            if ($deviceLine -match "emulator-5560") {
                adb disconnect emulator-5560 2>&1 | Out-Null
            }
        }
        Start-Sleep -Seconds 2
    }
}

Push-Location android
$buildResult = .\gradlew.bat assembleDebug --no-daemon 2>&1
$buildExitCode = $LASTEXITCODE
Pop-Location

# Stop the background job
Stop-Job $keepDisconnectedJob -ErrorAction SilentlyContinue
Remove-Job $keepDisconnectedJob -ErrorAction SilentlyContinue

# Clear environment variables after build
Remove-Item Env:\ANDROID_SERIAL -ErrorAction SilentlyContinue
Remove-Item Env:\EXPO_NO_DOTENV -ErrorAction SilentlyContinue

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
Write-Host "`nStep 2: Installing APK to BlueStacks ($deviceId)..." -ForegroundColor Cyan
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

Write-Host "`n✅ Done! The app should now be running on BlueStacks." -ForegroundColor Green
Write-Host "`nNote: Make sure Metro bundler is running (npx expo start) for hot reload to work." -ForegroundColor Cyan





r
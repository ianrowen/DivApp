# Install app to BlueStacks emulator
# Make sure BlueStacks is running and ADB debugging is enabled

Write-Host "`n=== Installing Divin8 App to BlueStacks ===" -ForegroundColor Cyan

# Check if APK exists
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkPath)) {
    Write-Host "`n❌ Debug APK not found!" -ForegroundColor Red
    Write-Host "Building debug APK first..." -ForegroundColor Yellow
    
    cd android
    .\gradlew.bat assembleDebug --no-daemon
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    
    cd ..
}

Write-Host "`n✅ APK found: $apkPath" -ForegroundColor Green

# Try to connect to BlueStacks on common ports
Write-Host "`nConnecting to BlueStacks..." -ForegroundColor Cyan

$bluestacksPorts = @(5555, 5556, 5557, 5558)
$connected = $false

foreach ($port in $bluestacksPorts) {
    Write-Host "Trying port $port..." -ForegroundColor Yellow
    $result = adb connect "127.0.0.1:$port" 2>&1
    
    if ($result -match "connected" -or $result -match "already connected") {
        Write-Host "✅ Connected to BlueStacks on port $port!" -ForegroundColor Green
        Start-Sleep -Seconds 2
        $connected = $true
        break
    }
}

if (-not $connected) {
    Write-Host "`n⚠️  Could not connect to BlueStacks automatically." -ForegroundColor Yellow
    Write-Host "`n**To enable ADB in BlueStacks:**" -ForegroundColor Cyan
    Write-Host "1. Open BlueStacks Settings" -ForegroundColor White
    Write-Host "2. Go to Advanced > Android Debug Bridge (ADB)" -ForegroundColor White
    Write-Host "3. Enable 'Enable Android Debug Bridge (ADB)'" -ForegroundColor White
    Write-Host "4. Note the port number shown (usually 5555)" -ForegroundColor White
    Write-Host "5. Run this script again" -ForegroundColor White
    Write-Host "`nOr manually connect with:" -ForegroundColor Cyan
    Write-Host "  adb connect 127.0.0.1:<port>" -ForegroundColor White
    Write-Host "`n**Alternative: Install to your connected device instead?**" -ForegroundColor Cyan
    $choice = Read-Host "Install to connected device (Y/N)"
    if ($choice -eq "Y" -or $choice -eq "y") {
        $deviceId = (adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "device" -and $_ -notmatch "emulator-5554" } | Select-Object -First 1)
        if ($deviceId -match "^(\S+)\s+device") {
            $deviceId = $matches[1]
            Write-Host "`nInstalling to device: $deviceId" -ForegroundColor Cyan
            adb -s $deviceId install -r $apkPath
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n✅ Installed successfully!" -ForegroundColor Green
            } else {
                Write-Host "`n❌ Installation failed" -ForegroundColor Red
            }
        }
    }
    exit 1
}

# List all devices
Write-Host "`nConnected devices:" -ForegroundColor Cyan
adb devices -l

# Find BlueStacks device
$bluestacksDevice = (adb devices -l | Select-Object -Skip 1 | Where-Object { $_ -match "127.0.0.1" -or $_ -match "emulator" } | Select-Object -First 1)

if (-not $bluestacksDevice) {
    Write-Host "`n⚠️  BlueStacks device not found in device list" -ForegroundColor Yellow
    Write-Host "Make sure ADB debugging is enabled in BlueStacks settings" -ForegroundColor Yellow
    exit 1
}

if ($bluestacksDevice -match "^(\S+)\s+device") {
    $deviceId = $matches[1]
    Write-Host "`nInstalling to BlueStacks: $deviceId" -ForegroundColor Cyan
    
    adb -s $deviceId install -r $apkPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Installed successfully to BlueStacks!" -ForegroundColor Green
        Write-Host "`nYou can now launch the app from BlueStacks app drawer." -ForegroundColor Cyan
        Write-Host "`n**Note:** For hot reload, make sure Metro is running:" -ForegroundColor Yellow
        Write-Host "  .\start-metro.ps1" -ForegroundColor White
    } else {
        Write-Host "`n❌ Installation failed" -ForegroundColor Red
        Write-Host "Try uninstalling the old app first:" -ForegroundColor Yellow
        Write-Host "  adb -s $deviceId uninstall com.divin8.app" -ForegroundColor White
    }
} else {
    Write-Host "`n❌ Could not parse BlueStacks device ID" -ForegroundColor Red
}








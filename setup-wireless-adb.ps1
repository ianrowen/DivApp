# Helper script to set up wireless ADB connection to your phone
# Make sure your phone is connected via USB first

Write-Host "Setting up wireless ADB connection..." -ForegroundColor Cyan
Write-Host "`nMake sure your phone is connected via USB and USB debugging is enabled.`n" -ForegroundColor Yellow

# Check if device is connected via USB
$usbDevices = adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "device" -and $_ -notmatch "127.0.0.1" -and $_ -notmatch "emulator" }
if ($usbDevices.Count -eq 0) {
    Write-Host "❌ No USB device found!" -ForegroundColor Red
    Write-Host "`nPlease:" -ForegroundColor Yellow
    Write-Host "  1. Connect your phone via USB"
    Write-Host "  2. Enable USB debugging"
    Write-Host "  3. Accept the USB debugging prompt on your phone"
    Write-Host "  4. Run this script again"
    exit 1
}

Write-Host "✅ USB device found!" -ForegroundColor Green

# Get device IP address
Write-Host "`nGetting device IP address..." -ForegroundColor Cyan
$ipResult = adb shell "getprop dhcp.wlan0.ipaddress" 2>&1
$ipAddress = ""

# Extract IP from result (handle both string and array outputs)
if ($ipResult -is [string]) {
    $ipAddress = $ipResult.Trim()
} elseif ($ipResult -is [array]) {
    $ipAddress = ($ipResult | Where-Object { $_ -notmatch "error" -and $_ -match "^\d+\.\d+\.\d+\.\d+" } | Select-Object -First 1)
    if ($ipAddress) { $ipAddress = $ipAddress.ToString().Trim() }
}

# Try alternative method if first didn't work
if ([string]::IsNullOrWhiteSpace($ipAddress) -or $ipAddress -match "error" -or $ipAddress -eq "") {
    $ipResult2 = adb shell "ip addr show wlan0 2>/dev/null | grep 'inet ' | awk '{print `$2}' | cut -d/ -f1" 2>&1
    if ($ipResult2 -is [string] -and $ipResult2 -match "^\d+\.\d+\.\d+\.\d+") {
        $ipAddress = $ipResult2.Trim()
    }
}

# If still no IP, ask user
if ([string]::IsNullOrWhiteSpace($ipAddress) -or $ipAddress -match "error" -or $ipAddress -eq "" -or -not ($ipAddress -match "^\d+\.\d+\.\d+\.\d+")) {
    Write-Host "`n⚠️  Could not get IP address automatically." -ForegroundColor Yellow
    Write-Host "`nPlease find your phone's IP address manually:" -ForegroundColor Cyan
    Write-Host "  Settings > About Phone > Status > IP Address"
    Write-Host "  Or: Settings > WiFi > Tap your network > IP Address"
    $ipAddress = Read-Host "`nEnter your phone's IP address"
    $ipAddress = $ipAddress.Trim()
}

# Enable TCP/IP mode
Write-Host "`nEnabling TCP/IP mode on port 5555..." -ForegroundColor Cyan
adb tcpip 5555 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to enable TCP/IP mode" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# Connect wirelessly
Write-Host "Connecting to $ipAddress:5555..." -ForegroundColor Cyan
adb connect "$ipAddress:5555" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Connected wirelessly!" -ForegroundColor Green
    Write-Host "`nYou can now disconnect the USB cable." -ForegroundColor Cyan
    Write-Host "`nTo verify, run: adb devices" -ForegroundColor Cyan
    Write-Host "You should see: $ipAddress:5555 device" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to connect wirelessly" -ForegroundColor Red
    Write-Host "`nMake sure:" -ForegroundColor Yellow
    Write-Host "  - Phone and computer are on the same WiFi network"
    Write-Host "  - Firewall isn't blocking port 5555"
    Write-Host "  - IP address is correct: $ipAddress"
}


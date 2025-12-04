# Disconnect ghost device and run Expo
Write-Host "Disconnecting ghost emulator-5554..."
adb -s emulator-5554 disconnect 2>&1 | Out-Null
Start-Sleep -Milliseconds 500

Write-Host "Ensuring BlueStacks is connected..."
adb connect 127.0.0.1:5555 2>&1 | Out-Null
Start-Sleep -Seconds 1

Write-Host "Current devices:"
adb devices

Write-Host "`nRunning Expo with BlueStacks..."
$env:ANDROID_SERIAL = "127.0.0.1:5555"
npx expo run:android --device 127.0.0.1:5555

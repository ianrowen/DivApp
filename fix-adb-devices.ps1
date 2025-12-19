# Script to disconnect ghost emulator-5554 device
# Run this before starting Expo to avoid device detection errors

Write-Host "Disconnecting ghost emulator-5554..." -ForegroundColor Yellow
adb disconnect emulator-5554
adb kill-server
Start-Sleep -Seconds 1
adb start-server
Start-Sleep -Seconds 1

Write-Host "`nConnected devices:" -ForegroundColor Green
adb devices

Write-Host "`nTo start Expo without device detection issues, run:" -ForegroundColor Cyan
Write-Host "  npx expo start" -ForegroundColor White
Write-Host "`nOr if you need tunnel mode, disconnect emulator-5554 first:" -ForegroundColor Cyan
Write-Host "  adb disconnect emulator-5554" -ForegroundColor White
Write-Host "  npx expo start --tunnel" -ForegroundColor White






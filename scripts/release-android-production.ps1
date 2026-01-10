# Android Production Release Script (PowerShell)
# This script builds, submits to Google Play, and publishes OTA update

Write-Host "🚀 Starting Android Production Release Process" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build Android Production
Write-Host "📦 Step 1: Building Android production build..." -ForegroundColor Yellow
npm run build:android:production

Write-Host ""
Write-Host "✅ Build completed! Waiting for build to finish processing..." -ForegroundColor Green
Write-Host ""

# Step 2: Submit to Google Play
Write-Host "📤 Step 2: Submitting to Google Play..." -ForegroundColor Yellow
npm run submit:android

Write-Host ""
Write-Host "✅ Submitted to Google Play!" -ForegroundColor Green
Write-Host ""

# Step 3: Publish OTA Update
Write-Host "🔄 Step 3: Publishing OTA update to production channel..." -ForegroundColor Yellow
eas update --branch production --message "Production release update"

Write-Host ""
Write-Host "✅ OTA update published!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Release complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Monitor build status: https://expo.dev/accounts/irowen/projects/divin8-app/builds"
Write-Host "2. Check Google Play Console for submission status"
Write-Host "3. Users will receive OTA update automatically"

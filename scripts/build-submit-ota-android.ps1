# Build, Submit, and Publish OTA for Android Production
# This script builds Android production, submits to Google Play, and publishes OTA update

param(
    [string]$OtaMessage = "Production release update"
)

Write-Host "Starting Android Production Release Process" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build and Auto-Submit
Write-Host "Building Android production build with auto-submit..." -ForegroundColor Yellow
npm run build:android:production

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Build completed and submitted to Google Play!" -ForegroundColor Green
Write-Host ""

# Step 2: Publish OTA Update
Write-Host "Publishing OTA update to production channel..." -ForegroundColor Yellow
eas update --branch production --message $OtaMessage --non-interactive

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to publish OTA update" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "OTA update published!" -ForegroundColor Green
Write-Host ""
Write-Host "Release complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Monitor submission: https://expo.dev/accounts/irowen/projects/divin8-app/submissions"
Write-Host "2. Check Google Play Console for submission status"
Write-Host "3. Users will receive OTA update automatically"

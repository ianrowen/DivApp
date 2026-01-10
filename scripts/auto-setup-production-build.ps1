# Automated Production Build Setup Script
# This script checks EAS credentials, helps find/upload keystore, and builds/submits automatically

param(
    [string]$KeystorePath = "",
    [string]$KeystorePassword = "",
    [string]$KeyAlias = "",
    [string]$KeyPassword = "",
    [switch]$SkipKeystoreCheck = $false
)

Write-Host "🚀 Automated Production Build Setup" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check EAS Credentials
Write-Host "Step 1: Checking EAS credentials..." -ForegroundColor Yellow
$credentialsCheck = eas credentials --platform android --profile production 2>&1

if ($LASTEXITCODE -eq 0 -and $credentialsCheck -match "keystore|credentials") {
    Write-Host "✅ EAS credentials found!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⚠️  No credentials found or need to be set up" -ForegroundColor Yellow
    Write-Host ""
    
    if (-not $SkipKeystoreCheck) {
        Write-Host "Step 1a: Searching for keystore files..." -ForegroundColor Yellow
        
        # Search for keystore files
        $keystores = @()
        $keystores += Get-ChildItem -Path . -Filter *.jks -Recurse -ErrorAction SilentlyContinue
        $keystores += Get-ChildItem -Path . -Filter *.keystore -Recurse -ErrorAction SilentlyContinue
        
        if ($keystores.Count -gt 0) {
            Write-Host "Found keystore files:" -ForegroundColor Green
            $keystores | ForEach-Object { Write-Host "  - $($_.FullName)" -ForegroundColor Gray }
            Write-Host ""
            
            if (-not $KeystorePath -and $keystores.Count -eq 1) {
                $KeystorePath = $keystores[0].FullName
                Write-Host "Auto-selected: $KeystorePath" -ForegroundColor Cyan
            }
        } else {
            Write-Host "❌ No keystore files found in project" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please provide keystore information:" -ForegroundColor Yellow
            Write-Host "1. Keystore file path (or press Enter to skip and upload manually)"
            $KeystorePath = Read-Host "Keystore path"
            
            if ($KeystorePath) {
                $KeystorePassword = Read-Host "Keystore password" -AsSecureString
                $KeyAlias = Read-Host "Key alias"
                $KeyPassword = Read-Host "Key password" -AsSecureString
            }
        }
        
        # Upload keystore if provided
        if ($KeystorePath -and (Test-Path $KeystorePath)) {
            Write-Host ""
            Write-Host "Step 1b: Uploading keystore to EAS..." -ForegroundColor Yellow
            
            # Verify fingerprint first
            Write-Host "Verifying keystore fingerprint..." -ForegroundColor Gray
            $fingerprint = keytool -list -v -keystore $KeystorePath -alias $KeyAlias 2>&1
            
            if ($fingerprint -match "6D:5F:A2:7E:20:5D:2A:07:51:63:E8:4B:78:58:18:0F:F9:A9:C7:21") {
                Write-Host "✅ Fingerprint matches Google Play expected value!" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Fingerprint doesn't match expected value" -ForegroundColor Yellow
                Write-Host "Expected: 6D:5F:A2:7E:20:5D:2A:07:51:63:E8:4B:78:58:18:0F:F9:A9:C7:21" -ForegroundColor Gray
            }
            
            Write-Host ""
            Write-Host "Uploading keystore (interactive prompts will appear)..." -ForegroundColor Yellow
            Write-Host "Run this command manually if automated upload fails:" -ForegroundColor Gray
            Write-Host "  eas credentials --platform android --profile production" -ForegroundColor Gray
            Write-Host ""
            
            # Note: EAS credentials command is interactive, so we can't fully automate it
            # But we can guide the user
        } else {
            Write-Host ""
            Write-Host "⚠️  Keystore not provided. You'll need to upload it manually:" -ForegroundColor Yellow
            Write-Host "  eas credentials --platform android --profile production" -ForegroundColor Cyan
            Write-Host ""
            $continue = Read-Host "Continue anyway? (y/n)"
            if ($continue -ne "y") {
                Write-Host "Exiting. Please upload keystore first." -ForegroundColor Red
                exit 1
            }
        }
    }
}

# Step 2: Verify package name configuration
Write-Host ""
Write-Host "Step 2: Verifying package name configuration..." -ForegroundColor Yellow
$easJson = Get-Content eas.json | ConvertFrom-Json
$productionPackage = $easJson.build.production.android.package

if ($productionPackage -eq "com.divin8.app") {
    Write-Host "✅ Production package name configured correctly: $productionPackage" -ForegroundColor Green
} else {
    Write-Host "⚠️  Production package name: $productionPackage" -ForegroundColor Yellow
    Write-Host "Expected: com.divin8.app" -ForegroundColor Gray
}

# Step 3: Build and submit
Write-Host ""
Write-Host "Step 3: Building and submitting to Google Play..." -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor Gray
Write-Host "  1. Build Android production app bundle" -ForegroundColor Gray
Write-Host "  2. Automatically submit to Google Play (alpha track)" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Continue with build? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Build cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting build..." -ForegroundColor Cyan
npm run build:android:production

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build and submission completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Monitor progress:" -ForegroundColor Cyan
    Write-Host "  - Builds: https://expo.dev/accounts/irowen/projects/divin8-app/builds" -ForegroundColor Gray
    Write-Host "  - Submissions: https://expo.dev/accounts/irowen/projects/divin8-app/submissions" -ForegroundColor Gray
    Write-Host "  - Google Play: https://play.google.com/console" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    exit 1
}

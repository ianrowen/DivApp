# Submit Build to Google Play and Publish OTA Update
# This script waits for the latest Android production build to complete,
# then submits it to Google Play and publishes an OTA update

param(
    [string]$BuildId = "",
    [string]$OtaMessage = "Production release update"
)

Write-Host "Starting Submit and OTA Publish Process" -ForegroundColor Cyan
Write-Host ""

# Function to check build status
function Get-BuildStatus {
    $output = eas build:list --platform android --limit 1 --non-interactive 2>&1 | Out-String
    return $output
}

# Function to extract status from build list output
function Get-StatusFromOutput {
    param([string]$Output)
    
    $statusLine = $Output | Select-String -Pattern "Status\s+([^\r\n]+)"
    if ($statusLine) {
        $status = ($statusLine.Matches[0].Groups[1].Value).Trim()
        return $status
    }
    return $null
}

# Function to extract build ID from output
function Get-BuildIdFromOutput {
    param([string]$Output)
    
    $idLine = $Output | Select-String -Pattern "ID\s+([a-f0-9-]+)"
    if ($idLine) {
        $id = $idLine.Matches[0].Groups[1].Value.Trim()
        return $id
    }
    return $null
}

# Step 1: Wait for build to complete
Write-Host "Step 1: Checking build status..." -ForegroundColor Yellow

$maxAttempts = 120  # 60 minutes max (30 second intervals)
$attempt = 0
$buildComplete = $false
$latestBuildId = $null

while (-not $buildComplete -and $attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "Checking build status (attempt $attempt/$maxAttempts)..." -ForegroundColor Gray
    
    $buildOutput = Get-BuildStatus
    $status = Get-StatusFromOutput -Output $buildOutput
    
    if (-not $latestBuildId) {
        $latestBuildId = Get-BuildIdFromOutput -Output $buildOutput
    }
    
    if ($status -match "finished") {
        $buildComplete = $true
        Write-Host "Build completed!" -ForegroundColor Green
        Write-Host ""
        break
    } elseif ($status -match "errored" -or $status -match "canceled") {
        Write-Host "Build failed with status: $status" -ForegroundColor Red
        Write-Host "Build output:" -ForegroundColor Red
        Write-Host $buildOutput
        exit 1
    } else {
        Write-Host "Build status: $status - waiting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    }
}

if (-not $buildComplete) {
    Write-Host "Timeout waiting for build to complete" -ForegroundColor Red
    exit 1
}

# Step 2: Submit to Google Play
Write-Host "Step 2: Submitting to Google Play..." -ForegroundColor Yellow
npm run submit:android

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to submit to Google Play" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Submitted to Google Play!" -ForegroundColor Green
Write-Host ""

# Step 3: Publish OTA Update
Write-Host "Step 3: Publishing OTA update to production channel..." -ForegroundColor Yellow
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

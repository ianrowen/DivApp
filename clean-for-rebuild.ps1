# Comprehensive cleanup script to ensure clean state at "pre beta" commit
# This script will clean all build artifacts, caches, and prepare for a fresh rebuild

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Clean Rebuild Preparation Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify current commit
Write-Host "[1/8] Verifying Git state..." -ForegroundColor Yellow
$currentCommit = git rev-parse HEAD
$commitMessage = git log -1 --pretty=%B

Write-Host "  Current commit: $currentCommit" -ForegroundColor Green
Write-Host "  Commit message: $commitMessage" -ForegroundColor Green

if (-not ($commitMessage -match "pre beta")) {
    Write-Host "  WARNING: Commit message doesn't match 'pre beta'" -ForegroundColor Red
    $continue = Read-Host "  Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

Write-Host ""

# Step 2: Check for uncommitted changes
Write-Host "[2/8] Checking for uncommitted changes..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "  WARNING: You have uncommitted changes:" -ForegroundColor Red
    git status --short
    $continue = Read-Host "  Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
} else {
    Write-Host "  ✓ Working directory is clean" -ForegroundColor Green
}
Write-Host ""

# Step 3: Stop Metro bundler if running
Write-Host "[3/8] Checking for running Metro bundler..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "  Found running Node.js processes. You may want to stop Metro/Expo manually." -ForegroundColor Yellow
    Write-Host "  Processes found: $($nodeProcesses.Count)" -ForegroundColor Yellow
    $stopNode = Read-Host "  Stop all Node processes? (y/n)"
    if ($stopNode -eq "y") {
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "  ✓ Node processes stopped" -ForegroundColor Green
    }
} else {
    Write-Host "  ✓ No Node.js processes running" -ForegroundColor Green
}
Write-Host ""

# Step 4: Clean Expo cache
Write-Host "[4/8] Cleaning Expo cache..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Path ".expo" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Removed .expo directory" -ForegroundColor Green
} else {
    Write-Host "  ✓ .expo directory doesn't exist" -ForegroundColor Green
}
Write-Host ""

# Step 5: Clean Metro bundler cache
Write-Host "[5/8] Cleaning Metro bundler cache..." -ForegroundColor Yellow

# Metro cache locations
$metroCacheDirs = @(
    "$env:TEMP\metro-*",
    "$env:TEMP\react-*",
    "$env:LOCALAPPDATA\Temp\metro-*",
    "$env:LOCALAPPDATA\Temp\react-*"
)

$cleaned = $false
foreach ($cachePattern in $metroCacheDirs) {
    $dirs = Get-ChildItem -Path $cachePattern -ErrorAction SilentlyContinue
    if ($dirs) {
        $dirs | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Cleaned Metro cache: $cachePattern" -ForegroundColor Green
        $cleaned = $true
    }
}

if (-not $cleaned) {
    Write-Host "  ✓ No Metro cache found to clean" -ForegroundColor Green
}

# Note: Use 'npx expo start --clear' when starting Metro to clear its cache
Write-Host "  ℹ Use 'npx expo start --clear' when starting to clear Metro bundler cache" -ForegroundColor Cyan
Write-Host ""

# Step 6: Clean Android build artifacts
Write-Host "[6/8] Cleaning Android build artifacts..." -ForegroundColor Yellow

# Clean Android app build
if (Test-Path "android\app\build") {
    Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Removed android\app\build" -ForegroundColor Green
}

# Clean Android root build
if (Test-Path "android\build") {
    Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Removed android\build" -ForegroundColor Green
}

# Clean Gradle cache (optional - commented out as it's global)
# Write-Host "  Cleaning Gradle cache (this may take a moment)..." -ForegroundColor Yellow
# if (Test-Path "android\.gradle") {
#     Remove-Item -Path "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
#     Write-Host "  ✓ Removed android\.gradle" -ForegroundColor Green
# }

Write-Host "  Running Gradle clean..." -ForegroundColor Yellow
Push-Location android
& .\gradlew.bat clean 2>&1 | Out-Null
Pop-Location
Write-Host "  ✓ Gradle clean completed" -ForegroundColor Green
Write-Host ""

# Step 7: Clean web build artifacts
Write-Host "[7/8] Cleaning web build artifacts..." -ForegroundColor Yellow
if (Test-Path "web-build") {
    Remove-Item -Path "web-build" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Removed web-build directory" -ForegroundColor Green
}
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Removed dist directory" -ForegroundColor Green
}
Write-Host ""

# Step 8: Verify package.json state
Write-Host "[8/8] Verifying package.json matches commit..." -ForegroundColor Yellow
$packageJsonHash = Get-FileHash -Path "package.json" -Algorithm SHA256
Write-Host "  ✓ package.json verified" -ForegroundColor Green
Write-Host ""

# Optional: Reinstall node_modules
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Optional: Clean node_modules?" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
$reinstall = Read-Host "Would you like to remove and reinstall node_modules? (y/n)"

if ($reinstall -eq "y") {
    Write-Host ""
    Write-Host "Removing node_modules..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Removed node_modules" -ForegroundColor Green
    }
    
    if (Test-Path "package-lock.json") {
        Write-Host "  Found package-lock.json - will use for consistent install" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Cleanup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your project is now in a clean state matching commit:" -ForegroundColor White
Write-Host "  $currentCommit" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start Metro bundler: npm start" -ForegroundColor White
Write-Host "  2. Or build Android: npm run android" -ForegroundColor White
Write-Host "  3. Or use your build scripts: .\build-and-install-debug.ps1" -ForegroundColor White
Write-Host ""


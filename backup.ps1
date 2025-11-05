# Quick Backup Script
# Usage: .\backup.ps1 "Your commit message"

$message = if ($args.Count -gt 0) { $args[0] } else { "Auto backup - $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }

Write-Host "Backing up to Google Drive..." -ForegroundColor Cyan
git add .
git commit -m "$message"
git push gdrive main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup complete!" -ForegroundColor Green
} else {
    Write-Host "Nothing to backup or push failed" -ForegroundColor Yellow
}
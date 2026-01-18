# Script to prepare Google credentials for Vercel deployment
# This converts your credentials JSON file to base64 for use as an environment variable

$credentialsFile = "beaming-opus-452719-u5-b39abc625ad4.json"

if (-not (Test-Path $credentialsFile)) {
    Write-Host "Error: $credentialsFile not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Converting $credentialsFile to base64..." -ForegroundColor Cyan

# Read the JSON file
$content = Get-Content $credentialsFile -Raw -Encoding UTF8

# Convert to base64
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$base64 = [System.Convert]::ToBase64String($bytes)

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "Copy this value and add it as GOOGLE_CREDENTIALS_JSON in Vercel:" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host $base64 -ForegroundColor White
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "Steps:" -ForegroundColor Cyan
Write-Host "1. Go to Vercel Dashboard -> Your Project -> Settings -> Environment Variables" -ForegroundColor White
Write-Host "2. Add new variable:" -ForegroundColor White
Write-Host "   Name: GOOGLE_CREDENTIALS_JSON" -ForegroundColor White
Write-Host "   Value: (paste the base64 string above)" -ForegroundColor White
Write-Host "3. Redeploy your project" -ForegroundColor White
Write-Host ""

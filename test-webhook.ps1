# Test script to verify webhook is accessible
# Run this after starting ngrok to test if your webhook endpoint is reachable

param(
    [string]$WebhookUrl = "http://localhost:3000/webhook"
)

Write-Host "Testing webhook endpoint: $WebhookUrl" -ForegroundColor Cyan
Write-Host ""

# Test if server is running locally
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -ErrorAction Stop
    Write-Host "✓ Local server is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Local server is not running. Start it with: npm run dev" -ForegroundColor Red
    exit
}

# Test webhook endpoint (simulate Twilio webhook)
$testBody = @{
    From = "whatsapp:+1234567890"
    Body = "Test message"
    MessageSid = "SMtest123"
} | ConvertTo-Json

try {
    Write-Host "Testing webhook endpoint..." -ForegroundColor Yellow
    $webhookResponse = Invoke-WebRequest -Uri "http://localhost:3000/webhook" -Method POST -Body $testBody -ContentType "application/x-www-form-urlencoded" -ErrorAction Stop
    Write-Host "✓ Webhook endpoint is responding" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $webhookResponse.Content
} catch {
    Write-Host "✗ Webhook test failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start ngrok: ngrok http 3000" -ForegroundColor White
Write-Host "2. Copy the HTTPS URL from ngrok" -ForegroundColor White
Write-Host "3. Add it to Twilio Console: https://your-ngrok-url.ngrok.io/webhook" -ForegroundColor White

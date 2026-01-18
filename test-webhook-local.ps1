# Test webhook locally - simulates a Twilio webhook call
# Make sure your server is running first: npm run dev

$webhookUrl = "http://localhost:3000/webhook"

Write-Host "Testing webhook endpoint: $webhookUrl" -ForegroundColor Cyan
Write-Host ""

# Simulate Twilio webhook payload
$body = @{
    From = "whatsapp:+972543456305"
    Body = "Test message from local script"
    MessageSid = "SMtest123456"
    AccountSid = "ACtest123"
} | ConvertTo-Json

Write-Host "Sending test webhook..." -ForegroundColor Yellow
Write-Host "Payload:" -ForegroundColor Gray
Write-Host $body -ForegroundColor DarkGray
Write-Host ""

try {
    # Twilio sends data as form-urlencoded, but for testing we'll use JSON
    $response = Invoke-WebRequest -Uri $webhookUrl `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ Webhook responded successfully!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response (TwiML):" -ForegroundColor Cyan
    Write-Host $response.Content
} catch {
    Write-Host "❌ Webhook test failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "💡 Make sure your server is running:" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor White
}

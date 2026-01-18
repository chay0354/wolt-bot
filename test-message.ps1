# PowerShell script to test the send-message endpoint

$body = @{
    to = "whatsapp:+972543456305"
    from = "whatsapp:+14155238886"
    contentSid = "HXb5b62575e6e4ff6129ad7c8efe1f983e"
    contentVariables = '{"1":"12/1","2":"3pm"}'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/send-message" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}

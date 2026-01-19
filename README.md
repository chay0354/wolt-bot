# Leads Bot - Twilio WhatsApp Server

A Node.js server for sending WhatsApp messages via Twilio using content templates.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your credentials:
   - `ACCOUNT_SID`: Your Twilio Account SID
   - `AUTH_TOKEN`: Your Twilio Auth Token
   - `DEFAULT_FROM`: Your Twilio WhatsApp number
   - `DEFAULT_TO`: Default recipient WhatsApp number
   - `CONTENT_SID`: Your Twilio Content Template SID
   - `CONTENT_VARIABLES`: JSON string with template variables
   - `GOOGLE_CREDENTIALS_PATH`: Path to your Google service account JSON file (default: `beaming-opus-452719-u5-b39abc625ad4.json`)
   - `SPREADSHEET_ID`: Your Google Sheet ID (default: `1GULHxajfokRK2rcTHW_XgJgbLp7-IS9_2ziIt6skePs`)
   - `VOICE_MESSAGE_URL`: (Optional) URL to an audio file (.mp3, .ogg, .wav) to send as voice message instead of text

4. **Share Google Sheet with Service Account:**
   - Open your Google Sheet: https://docs.google.com/spreadsheets/d/1GULHxajfokRK2rcTHW_XgJgbLp7-IS9_2ziIt6skePs/edit
   - Click "Share" button
   - Add the service account email: `wolt-743@beaming-opus-452719-u5.iam.gserviceaccount.com`
   - Give it "Editor" permissions
   - Click "Send"

## Running the Server

### Local Development

```bash
npm start
```

The server will start on port 3000 (or the port specified in your `.env` file).

### Deploy to Vercel

Yes! You can deploy this to Vercel for a permanent URL. See **[VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)** for detailed instructions.

Quick steps:
1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard
4. Get your webhook URL: `https://your-project.vercel.app/webhook`
5. Configure in Twilio Console

**Benefits of Vercel:**
- ✅ Permanent URL (no need for ngrok)
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Easy deployments

## API Endpoints

### POST /send-message
Send a WhatsApp message using a content template.

**Request Body (optional - uses .env defaults if not provided):**
```json
{
  "to": "whatsapp:+972543456305",
  "from": "whatsapp:+14155238886",
  "contentSid": "HXb5b62575e6e4ff6129ad7c8efe1f983e",
  "contentVariables": "{\"1\":\"12/1\",\"2\":\"3pm\"}"
}
```

**Response:**
```json
{
  "success": true,
  "messageSid": "SM...",
  "message": "Message sent successfully"
}
```

### POST /webhook
Twilio webhook endpoint for incoming WhatsApp messages. This endpoint:
- Automatically replies with "hi" to any incoming message
- Logs the message data to Google Sheets (Phone, Message, Timestamp, Date, Time)

**Note:** You need to configure this URL in your Twilio Console:
1. Go to Twilio Console → Messaging → Settings → WhatsApp Sandbox Settings
2. Set the webhook URL to: `https://your-domain.com/webhook`
3. Make sure your server is publicly accessible (use ngrok for local testing)

### GET /health
Health check endpoint.

### GET /
Server information and available endpoints.

## Example Usage

### Using PowerShell (Windows):
```powershell
# Simple request with defaults from .env
Invoke-RestMethod -Uri "http://localhost:3000/send-message" -Method POST

# With custom parameters
$body = @{
    to = "whatsapp:+972543456305"
    contentVariables = '{"1":"12/1","2":"3pm"}'
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/send-message" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

Or use the provided test script:
```powershell
.\test-message.ps1
```

### Using curl (Linux/Mac/Git Bash):
```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "whatsapp:+972543456305",
    "contentVariables": "{\"1\":\"12/1\",\"2\":\"3pm\"}"
  }'
```

Or send a request with default values (from .env):
```bash
curl -X POST http://localhost:3000/send-message
```

## Webhook Setup for Incoming Messages

The server automatically replies "hi" to any incoming WhatsApp message and logs it to Google Sheets.

### Local Testing with ngrok:

1. Install ngrok: https://ngrok.com/download
2. Start your server: `npm start`
3. In a new terminal, expose your local server:
   ```bash
   ngrok http 3000
   ```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. In Twilio Console, set webhook URL to: `https://abc123.ngrok.io/webhook`

### Production Deployment:

Deploy your server to a cloud provider (Heroku, Railway, Render, etc.) and set the webhook URL in Twilio Console to your production URL.

## Google Sheets Integration

Incoming messages are automatically logged to Google Sheets with the following columns:
- **Phone**: Sender's WhatsApp number
- **Message**: Message content received
- **Timestamp**: ISO timestamp
- **Date**: Local date
- **Time**: Local time

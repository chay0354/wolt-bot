# Twilio WhatsApp Sandbox Setup Guide

## Step 1: Connect Your Phone to the Sandbox

1. In the Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. You'll see a **"Connect to sandbox"** section with a code (like "join [code]")
3. Send this code via WhatsApp to: **+1 415 523 8886** (Twilio's sandbox number)
4. You'll receive a confirmation message when connected

## Step 2: Expose Your Local Server (Using ngrok)

Since your server runs locally, you need to expose it publicly so Twilio can send webhooks to it.

### Install ngrok:
1. Download from: https://ngrok.com/download
2. Extract and add to your PATH, or use it directly

### Start your server:
```powershell
npm run dev
```

### In a NEW terminal, start ngrok:
```powershell
ngrok http 3000
```
(Or whatever port your server is using - check the console output)

### Copy the HTTPS URL:
You'll see something like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the HTTPS URL** (the one starting with `https://`)

## Step 3: Configure Webhook in Twilio Console

1. Go to **Twilio Console** → **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
2. Find **"When a message comes in"** section
3. Paste your ngrok URL + `/webhook`:
   ```
   https://abc123.ngrok.io/webhook
   ```
   (Replace `abc123.ngrok.io` with your actual ngrok URL)
4. Set HTTP method to: **POST**
5. Click **Save**

## Step 4: Test It!

1. Send a WhatsApp message to: **+1 415 523 8886**
2. You should receive an automatic reply: **"hi"**
3. Check your server console - you should see:
   - "Incoming message from: whatsapp:+..."
   - "Message logged to Google Sheets"
4. Check your Google Sheet - the message should appear there!

## Important Notes:

- **ngrok URL changes**: Each time you restart ngrok, you get a new URL. You'll need to update the webhook in Twilio Console.
- **ngrok free tier**: The free tier gives you a random URL each time. For production, consider:
  - ngrok paid plan (fixed domain)
  - Deploy to cloud (Heroku, Railway, Render, etc.)
- **Keep ngrok running**: ngrok must stay running while testing. If you close it, webhooks won't work.

## Production Deployment (Optional)

For a permanent solution, deploy your server to:
- **Heroku**: https://www.heroku.com
- **Railway**: https://railway.app
- **Render**: https://render.com

Then use your production URL in the Twilio webhook settings.

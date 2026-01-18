require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const GoogleSheetsService = require('./googleSheets');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio webhook form data

// Twilio configuration
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error('Error: ACCOUNT_SID and AUTH_TOKEN must be set in .env file');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

// Google Sheets configuration
// For Vercel, prioritize environment variable over file path
let credentialsPath;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  // If we have credentials as base64 env var, create temp file for googleSheets.js
  const fs = require('fs');
  const os = require('os');
  credentialsPath = path.join(os.tmpdir(), 'google-credentials.json');
  try {
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf-8')
    );
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    console.log('Google credentials loaded from environment variable');
  } catch (error) {
    console.error('Error creating credentials file from env var:', error.message);
    // Fallback to default path
    credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || path.join(__dirname, 'beaming-opus-452719-u5-b39abc625ad4.json');
  }
} else if (process.env.VERCEL) {
  // On Vercel without env var, try Vercel's file system path
  credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || '/var/task/beaming-opus-452719-u5-b39abc625ad4.json';
} else {
  // Local development
  credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || path.join(__dirname, 'beaming-opus-452719-u5-b39abc625ad4.json');
}
const spreadsheetId = process.env.SPREADSHEET_ID || '1GULHxajfokRK2rcTHW_XgJgbLp7-IS9_2ziIt6skePs';

const sheetsService = new GoogleSheetsService(credentialsPath, spreadsheetId);

// Initialize Google Sheets on startup (non-blocking)
sheetsService.initialize().then(() => {
  // Ensure headers exist
  const headers = ['Phone', 'Message', 'Timestamp', 'Date', 'Time'];
  sheetsService.ensureHeaders(headers).catch(err => {
    console.error('Warning: Could not ensure headers, but server will continue:', err.message);
  });
}).catch(err => {
  console.error('Warning: Google Sheets initialization failed, but server will continue:', err.message);
  if (process.env.VERCEL && !process.env.GOOGLE_CREDENTIALS_JSON) {
    console.error('\n❌ CRITICAL: GOOGLE_CREDENTIALS_JSON environment variable is missing!');
    console.error('📋 Add it in Vercel Dashboard → Settings → Environment Variables');
    console.error('   Name: GOOGLE_CREDENTIALS_JSON');
    console.error('   Value: (base64 encoded credentials JSON)');
  }
  console.error('Messages will still be replied to, but won\'t be logged to Google Sheets.');
});

// Route to send test message
app.post('/send-message', async (req, res) => {
  try {
    const {
      to = process.env.DEFAULT_TO || 'whatsapp:+972543456305',
      from = process.env.DEFAULT_FROM || 'whatsapp:+14155238886',
      contentSid = process.env.CONTENT_SID || 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
      contentVariables = process.env.CONTENT_VARIABLES || '{"1":"12/1","2":"3pm"}'
    } = req.body;

    const message = await client.messages.create({
      from: from,
      contentSid: contentSid,
      contentVariables: contentVariables,
      to: to
    });

    console.log('Message sent successfully:', message.sid);
    
    res.json({
      success: true,
      messageSid: message.sid,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Webhook endpoint for incoming WhatsApp messages
app.post('/webhook', async (req, res) => {
  try {
    const twiml = new twilio.twiml.MessagingResponse();
    
    // Get incoming message data
    const fromNumber = req.body.From; // Sender's WhatsApp number
    const messageBody = req.body.Body || ''; // Message content
    const messageSid = req.body.MessageSid;
    const timestamp = new Date().toISOString();
    const date = new Date().toLocaleDateString('en-US');
    const time = new Date().toLocaleTimeString('en-US');

    console.log('Incoming message from:', fromNumber);
    console.log('Message:', messageBody);

    // Auto-reply with Hebrew message
    const replyMessage = `הסתבכת עם הניירת? 🤯
אתה רק רוצה להתחיל לעבוד עם וולט, אבל פתאום יש מלא רשויות ובלאגן?!
בדיוק בשביל זה אני פה!

✅ פתיחת תיק מהירה בלי בירוקרטיה
✅ ליווי בוואטסאפ-קל, מהיר וובלי כאבי ראש
✅ מסדר לך הכל, שתוכל לרוץ על המשלוחים בראש שקט

כבר פתחת תיק או שאתה רק בודק איך זה עובד?`;
    
    twiml.message(replyMessage);

    // Log to Google Sheets
    try {
      const rowData = [
        fromNumber,           // Phone
        messageBody,          // Message
        timestamp,            // Timestamp
        date,                 // Date
        time                  // Time
      ];
      
      await sheetsService.appendRow(rowData);
      console.log('Message logged to Google Sheets');
    } catch (sheetsError) {
      console.error('Error logging to Google Sheets:', sheetsError);
      // Don't fail the webhook if Sheets fails
    }

    // Send TwiML response
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error processing webhook:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root route
app.get('/', (req, res) => {
  // Get the actual host from the request
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'your-domain.com';
  const webhookUrl = `${protocol}://${host}/webhook`;
  
  res.json({
    message: 'Twilio WhatsApp Server',
    endpoints: {
      'POST /send-message': 'Send a WhatsApp message',
      'POST /webhook': 'Twilio webhook for incoming messages',
      'GET /health': 'Health check'
    },
    webhookUrl: webhookUrl,
    status: 'Server is running! Configure this webhook URL in Twilio Console.'
  });
});

// Export for Vercel, or start server locally
if (require.main === module) {
  // Running locally
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

// Export for Vercel
module.exports = app;

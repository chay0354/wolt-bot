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
// For Vercel, we need to handle the credentials file differently
let credentialsPath;
if (process.env.VERCEL) {
  // On Vercel, we'll use environment variables for the JSON content
  credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || '/tmp/credentials.json';
} else {
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

    // Auto-reply with "hi"
    twiml.message('hi');

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
  res.json({
    message: 'Twilio WhatsApp Server',
    endpoints: {
      'POST /send-message': 'Send a WhatsApp message',
      'POST /webhook': 'Twilio webhook for incoming messages',
      'GET /health': 'Health check'
    },
    webhookUrl: `https://your-domain.com/webhook` // Update this with your public URL
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

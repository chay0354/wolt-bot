require('dotenv').config();
const GoogleSheetsService = require('./googleSheets');
const path = require('path');

// Test writing to Google Sheets with correct column mapping (A, B, C)
async function testWrite() {
  console.log('🧪 Testing Google Sheets write to columns A, B, C...\n');

  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || 
    path.join(__dirname, 'beaming-opus-452719-u5-b39abc625ad4.json');
  const spreadsheetId = process.env.SPREADSHEET_ID || 
    '1GULHxajfokRK2rcTHW_XgJgbLp7-IS9_2ziIt6skePs';

  const fs = require('fs');
  if (!fs.existsSync(credentialsPath)) {
    console.error('❌ Credentials file not found!');
    process.exit(1);
  }

  try {
    const sheetsService = new GoogleSheetsService(credentialsPath, spreadsheetId);
    await sheetsService.initialize();
    
    const sheetName = await sheetsService.getSheetName();
    console.log(`✅ Using sheet: "${sheetName}"\n`);

    // Test phone number check
    const testPhone = 'whatsapp:+972543456305';
    console.log(`🔄 Checking if ${testPhone} exists...`);
    const exists = await sheetsService.phoneNumberExists(testPhone);
    console.log(`   Result: ${exists ? 'EXISTS' : 'NEW'}\n`);

    // Format time properly
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = (hours % 12 || 12).toString();
    const time = `${hours12}:${minutes}:${seconds} ${ampm}`;
    const date = now.toLocaleDateString('en-US');

    // Test data - same format as webhook
    const testData = [
      testPhone,                    // Phone
      'Test message from script',   // Message
      now.toISOString(),            // Timestamp
      date,                         // Date
      time                          // Time
    ];

    console.log('🔄 Writing test row...');
    console.log('   Data format: [phone, message, timestamp, date, time]');
    console.log('   Will map to: [time, date, phone] for columns A, B, C');
    console.log(`   Time: ${time}`);
    console.log(`   Date: ${date}`);
    console.log(`   Phone: ${testPhone}\n`);

    const result = await sheetsService.appendRow(testData);
    console.log('✅ Row written successfully!');
    console.log('   Updated range:', result.updates?.updatedRange || 'N/A');
    console.log('   Updated cells:', result.updates?.updatedCells || 'N/A');
    console.log('');

    // Verify by reading back
    console.log('🔄 Verifying written data...');
    const existsAfter = await sheetsService.phoneNumberExists(testPhone);
    console.log(`   Phone check after write: ${existsAfter ? 'EXISTS' : 'NOT FOUND'}`);
    console.log('');

    console.log('📊 Check your Google Sheet:');
    console.log(`   https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    console.log('   Data should be in columns A (Time), B (Date), C (Phone)');
    console.log('   Starting from row 3 (row 2 has headers)');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testWrite();

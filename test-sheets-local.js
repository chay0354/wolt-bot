require('dotenv').config();
const GoogleSheetsService = require('./googleSheets');
const path = require('path');

// Test Google Sheets integration locally
async function testGoogleSheets() {
  console.log('🧪 Testing Google Sheets integration locally...\n');

  // Use local credentials file
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || 
    path.join(__dirname, 'beaming-opus-452719-u5-b39abc625ad4.json');
  const spreadsheetId = process.env.SPREADSHEET_ID || 
    '1GULHxajfokRK2rcTHW_XgJgbLp7-IS9_2ziIt6skePs';

  console.log('📁 Credentials path:', credentialsPath);
  console.log('📊 Spreadsheet ID:', spreadsheetId);
  console.log('');

  // Check if credentials file exists
  const fs = require('fs');
  if (!fs.existsSync(credentialsPath)) {
    console.error('❌ Credentials file not found at:', credentialsPath);
    console.error('   Make sure the file exists or set GOOGLE_CREDENTIALS_PATH in .env');
    process.exit(1);
  }

  console.log('✅ Credentials file found\n');

  try {
    // Initialize service
    const sheetsService = new GoogleSheetsService(credentialsPath, spreadsheetId);
    console.log('🔄 Initializing Google Sheets service...');
    await sheetsService.initialize();
    console.log('✅ Google Sheets service initialized\n');

    // Test getting sheet name
    console.log('🔄 Getting sheet name...');
    const sheetName = await sheetsService.getSheetName();
    console.log(`✅ Using sheet: "${sheetName}"\n`);

    // Test ensuring headers
    console.log('🔄 Ensuring headers exist...');
    const headers = ['Phone', 'Message', 'Timestamp', 'Date', 'Time'];
    await sheetsService.ensureHeaders(headers);
    console.log('✅ Headers ensured\n');

    // Test appending a row
    console.log('🔄 Testing append row...');
    const testData = [
      'whatsapp:+1234567890',  // Phone
      'Test message from local script',  // Message
      new Date().toISOString(),  // Timestamp
      new Date().toLocaleDateString('en-US'),  // Date
      new Date().toLocaleTimeString('en-US')   // Time
    ];

    const result = await sheetsService.appendRow(testData);
    console.log('✅ Row appended successfully!');
    console.log('   Updated cells:', result.updates?.updatedCells || 'N/A');
    console.log('   Updated range:', result.updates?.updatedRange || 'N/A');
    console.log('');

    // Test getting headers to verify
    console.log('🔄 Verifying headers...');
    const existingHeaders = await sheetsService.getHeaders();
    console.log('✅ Current headers:', existingHeaders);
    console.log('');

    console.log('🎉 All tests passed! Google Sheets integration is working correctly.');
    console.log('📊 Check your Google Sheet to see the test row:');
    console.log(`   https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);

  } catch (error) {
    console.error('\n❌ Error testing Google Sheets:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 403) {
      console.error('\n💡 Permission denied! Make sure you:');
      console.error('   1. Shared the Google Sheet with: wolt-743@beaming-opus-452719-u5.iam.gserviceaccount.com');
      console.error('   2. Gave it "Editor" permissions');
    } else if (error.code === 400) {
      console.error('\n💡 Bad request! Check:');
      console.error('   - Spreadsheet ID is correct');
      console.error('   - Sheet name is valid');
    }
    
    process.exit(1);
  }
}

// Run the test
testGoogleSheets();

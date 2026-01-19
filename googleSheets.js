const { google } = require('googleapis');
const path = require('path');

class GoogleSheetsService {
  constructor(credentialsPath, spreadsheetId) {
    this.credentialsPath = credentialsPath;
    this.spreadsheetId = spreadsheetId;
    this.auth = null;
    this.sheets = null;
    this.sheetName = null; // Will be set dynamically
  }

  async initialize() {
    try {
      // For Vercel, try to use credentials from environment variable if available
      let authConfig;
      
      if (process.env.GOOGLE_CREDENTIALS_JSON) {
        // Use credentials from environment variable (base64 encoded)
        try {
          // Try to parse as base64 first
          let credentials;
          try {
            const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf-8');
            credentials = JSON.parse(decoded);
          } catch (base64Error) {
            // If base64 decode fails, try parsing as raw JSON (user might have pasted raw JSON)
            try {
              credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
              console.warn('⚠️  GOOGLE_CREDENTIALS_JSON appears to be raw JSON, not base64. It worked, but consider using base64 for better security.');
            } catch (jsonError) {
              throw new Error('GOOGLE_CREDENTIALS_JSON must be either base64-encoded JSON or raw JSON. Parse error: ' + base64Error.message);
            }
          }
          
          authConfig = {
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          };
          console.log('Using Google credentials from environment variable');
        } catch (parseError) {
          console.error('Error parsing GOOGLE_CREDENTIALS_JSON:', parseError.message);
          throw new Error('Invalid GOOGLE_CREDENTIALS_JSON format: ' + parseError.message);
        }
      } else if (process.env.VERCEL) {
        // On Vercel, we MUST use environment variable
        throw new Error('GOOGLE_CREDENTIALS_JSON environment variable is required on Vercel. Please add it in Vercel Dashboard → Settings → Environment Variables.');
      } else {
        // Use keyFile (local development only)
        const fs = require('fs');
        if (!fs.existsSync(this.credentialsPath)) {
          throw new Error(`Credentials file not found at: ${this.credentialsPath}`);
        }
        authConfig = {
          keyFile: this.credentialsPath,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        };
        console.log('Using Google credentials from file:', this.credentialsPath);
      }

      this.auth = new google.auth.GoogleAuth(authConfig);

      const authClient = await this.auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
      
      // Get the first sheet's name
      await this.getSheetName();
      
      console.log('Google Sheets service initialized');
    } catch (error) {
      console.error('Error initializing Google Sheets:', error.message);
      if (process.env.VERCEL && !process.env.GOOGLE_CREDENTIALS_JSON) {
        console.error('\n❌ GOOGLE_CREDENTIALS_JSON is required on Vercel!');
        console.error('📋 To fix:');
        console.error('   1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
        console.error('   2. Add GOOGLE_CREDENTIALS_JSON with the base64 encoded credentials');
        console.error('   3. Redeploy your project');
      }
      throw error;
    }
  }

  async getSheetName() {
    if (!this.sheets) {
      await this.initialize();
    }

    if (this.sheetName) {
      return this.sheetName;
    }

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      // Get the first sheet's name
      if (response.data.sheets && response.data.sheets.length > 0) {
        this.sheetName = response.data.sheets[0].properties.title;
        console.log(`Using sheet: "${this.sheetName}"`);
        return this.sheetName;
      }
      
      // Fallback to Sheet1 if we can't get the name
      this.sheetName = 'Sheet1';
      return this.sheetName;
    } catch (error) {
      console.error('Error getting sheet name, using default "Sheet1":', error.message);
      this.sheetName = 'Sheet1';
      return this.sheetName;
    }
  }

  async appendRow(data) {
    if (!this.sheets) {
      try {
        await this.initialize();
      } catch (initError) {
        // If initialization fails, don't try to use file path
        throw initError;
      }
    }

    try {
      const sheetName = await this.getSheetName();
      // Write to columns A, B, C to match Hebrew headers: שעה (Time), תאריך (Date), טלפון (Phone)
      // Headers are in row 2, data starts from row 3
      const range = `${sheetName}!A:C`; // Write to columns A, B, C
      
      // If data has 5 elements [phone, message, timestamp, date, time]
      // Map to [time, date, phone] for columns A, B, C
      let rowData;
      if (data.length >= 5) {
        // Map: [phone, message, timestamp, date, time] -> [time, date, phone]
        rowData = [data[4], data[3], data[0]]; // time, date, phone
      } else if (data.length === 3) {
        // Already in correct format [time, date, phone]
        rowData = data;
      } else {
        rowData = data;
      }
      
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [rowData],
        },
      });

      console.log('Row appended to Google Sheets:', response.data.updates.updatedCells, 'cells');
      return response.data;
    } catch (error) {
      console.error('Error appending row to Google Sheets:', error.message);
      throw error;
    }
  }

  async getHeaders() {
    if (!this.sheets) {
      await this.initialize();
    }

    try {
      const sheetName = await this.getSheetName();
      // Headers are in row 2, not row 1
      const range = `${sheetName}!A2:Z2`; // Row 2 has headers: שעה, תאריך, טלפון
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });

      return response.data.values ? response.data.values[0] : [];
    } catch (error) {
      // If error is 400 (bad range), try without sheet name
      if (error.code === 400) {
        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'A2:Z2', // Try without sheet name, row 2
          });
          return response.data.values ? response.data.values[0] : [];
        } catch (err2) {
          console.error('Error getting headers:', err2.message);
          return [];
        }
      }
      console.error('Error getting headers:', error.message);
      return [];
    }
  }

  async phoneNumberExists(phoneNumber) {
    if (!this.sheets) {
      await this.initialize();
    }

    try {
      const sheetName = await this.getSheetName();
      // Check column C (טלפון - Phone) where we write the phone numbers
      // Headers are in row 2, data starts from row 3
      const range = `${sheetName}!C3:C`; // Column C, starting from row 3 (skip header in row 2)
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });

      if (!response.data.values || response.data.values.length === 0) {
        console.log(`Phone check: No data found, ${phoneNumber} is new`);
        return false; // No data, number doesn't exist
      }

      // Normalize phone number for comparison (remove whitespace, make lowercase)
      const normalizedPhone = phoneNumber.trim().toLowerCase();
      
      // Check if phone number exists in any row
      for (const row of response.data.values) {
        if (row[0]) {
          const existingPhone = row[0].trim().toLowerCase();
          if (existingPhone === normalizedPhone) {
            console.log(`Phone check: Found existing number: ${phoneNumber}`);
            return true; // Phone number found
          }
        }
      }

      console.log(`Phone check: ${phoneNumber} is new (checked ${response.data.values.length} rows)`);
      return false; // Phone number not found
    } catch (error) {
      console.error('Error checking if phone number exists:', error.message);
      console.error('Full error:', error);
      // If check fails, assume number doesn't exist (safer to send message than not)
      return false;
    }
  }

  async ensureHeaders(headers) {
    // Headers are already set in the sheet (שעה, תאריך, טלפון in row 2)
    // This function is kept for compatibility but won't modify headers
    if (!this.sheets) {
      await this.initialize();
    }

    try {
      const existingHeaders = await this.getHeaders();
      
      // Check if Hebrew headers exist (שעה, תאריך, טלפון)
      const hasHebrewHeaders = existingHeaders.some(header => 
        header && (header.includes('שעה') || header.includes('תאריך') || header.includes('טלפון'))
      );
      
      if (hasHebrewHeaders) {
        console.log('Hebrew headers already exist in row 2 - skipping header creation');
        return; // Don't modify existing headers
      }
      
      // Only add headers if they don't exist at all
      if (existingHeaders.length === 0) {
        const sheetName = await this.getSheetName();
        const range = `${sheetName}!A2:Z2`; // Headers should be in row 2
        
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: range,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [headers],
          },
        });
        console.log('Headers added to Google Sheets');
      } else {
        console.log('Headers already exist in Google Sheets');
      }
    } catch (error) {
      if (error.code === 403) {
        console.error('\n❌ PERMISSION DENIED: Google Sheets access failed!');
        console.error('📋 To fix this, you need to share your Google Sheet with the service account:');
        console.error(`   Email: wolt-743@beaming-opus-452719-u5.iam.gserviceaccount.com`);
        console.error(`   Sheet: https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`);
        console.error('   Steps:');
        console.error('   1. Open the Google Sheet link above');
        console.error('   2. Click the "Share" button');
        console.error('   3. Add the service account email with "Editor" permissions');
        console.error('   4. Click "Send"\n');
      } else {
        console.error('Error ensuring headers:', error.message);
      }
      // Don't throw - allow server to continue running
    }
  }
}

module.exports = GoogleSheetsService;

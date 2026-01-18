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
          const credentials = JSON.parse(
            Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf-8')
          );
          authConfig = {
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          };
          console.log('Using Google credentials from environment variable');
        } catch (parseError) {
          console.error('Error parsing GOOGLE_CREDENTIALS_JSON:', parseError.message);
          throw new Error('Invalid GOOGLE_CREDENTIALS_JSON format. Must be base64 encoded JSON.');
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
      // Write to columns D, E, F to match Hebrew headers: שעת פנייה, תאריך פנייה, טלפון
      // data should be: [phone, date, time] or we'll map it
      const range = `${sheetName}!D:F`; // Write to columns D, E, F
      
      // If data has 5 elements [phone, message, timestamp, date, time]
      // Map to [time, date, phone] for columns D, E, F
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
      const range = `${sheetName}!A1:Z1`; // Use A1:Z1 format instead of 1:1
      
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
            range: 'A1:Z1', // Try without sheet name
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

  async ensureHeaders(headers) {
    if (!this.sheets) {
      await this.initialize();
    }

    try {
      const existingHeaders = await this.getHeaders();
      
      // If no headers exist, add them
      if (existingHeaders.length === 0) {
        const sheetName = await this.getSheetName();
        const range = `${sheetName}!A1:Z1`; // Use A1:Z1 format
        
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
        // Try without sheet name as fallback
        if (error.code === 400) {
          try {
            await this.sheets.spreadsheets.values.update({
              spreadsheetId: this.spreadsheetId,
              range: 'A1:Z1',
              valueInputOption: 'USER_ENTERED',
              resource: {
                values: [headers],
              },
            });
            console.log('Headers added using fallback method');
          } catch (err2) {
            console.error('Fallback also failed:', err2.message);
          }
        }
      }
      // Don't throw - allow server to continue running
    }
  }
}

module.exports = GoogleSheetsService;

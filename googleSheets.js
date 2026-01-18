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
        const credentials = JSON.parse(
          Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf-8')
        );
        authConfig = {
          credentials: credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        };
      } else {
        // Use keyFile (local development or Vercel with uploaded file)
        authConfig = {
          keyFile: this.credentialsPath,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        };
      }

      this.auth = new google.auth.GoogleAuth(authConfig);

      const authClient = await this.auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
      
      // Get the first sheet's name
      await this.getSheetName();
      
      console.log('Google Sheets service initialized');
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
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
      await this.initialize();
    }

    try {
      const sheetName = await this.getSheetName();
      const range = `${sheetName}!A:Z`;
      
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [data],
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

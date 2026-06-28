// Quick script to generate base64 from credentials file
const fs = require('fs');
const path = require('path');

const credentialsFile = path.join(__dirname, 'beaming-opus-452719-u5-b39abc625ad4.json');

try {
  const jsonContent = fs.readFileSync(credentialsFile, 'utf8');
  const base64 = Buffer.from(jsonContent, 'utf8').toString('base64');
  
  console.log('\n' + '='.repeat(80));
  console.log('Copy this ENTIRE base64 string to Vercel as GOOGLE_CREDENTIALS_JSON:');
  console.log('='.repeat(80));
  console.log('\n' + base64 + '\n');
  console.log('='.repeat(80));
  console.log('\nSteps:');
  console.log('1. Copy the ENTIRE string above (it\'s very long!)');
  console.log('2. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.log('3. Edit GOOGLE_CREDENTIALS_JSON (or create it if it doesn\'t exist)');
  console.log('4. Paste the ENTIRE base64 string as the value');
  console.log('5. Save and redeploy\n');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

# Deploy to Vercel Guide

## Step 1: Install Vercel CLI

```powershell
npm install -g vercel
```

Or use npx (no installation needed):
```powershell
npx vercel
```

## Step 2: Login to Vercel

```powershell
vercel login
```

## Step 3: Deploy

From your project directory:

```powershell
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Choose your account)
- Link to existing project? **No**
- Project name? (Press Enter for default or type a name)
- Directory? (Press Enter for `./`)
- Override settings? **No**

## Step 4: Set Environment Variables

After deployment, you need to add your environment variables in Vercel:

1. Go to your project on https://vercel.com
2. Click **Settings** → **Environment Variables**
3. Add these variables:

```
ACCOUNT_SID=your_twilio_account_sid_here
AUTH_TOKEN=your_auth_token_here
DEFAULT_FROM=whatsapp:+14155238886
DEFAULT_TO=whatsapp:+your_phone_number_here
CONTENT_SID=your_content_template_sid_here
CONTENT_VARIABLES={"1":"12/1","2":"3pm"}
SPREADSHEET_ID=your_google_sheet_id_here
GOOGLE_CREDENTIALS_PATH=beaming-opus-452719-u5-b39abc625ad4.json
```

**Important for Google Sheets:**
Since Vercel is serverless, you need to upload your Google credentials file. You have two options:

### Option A: Upload credentials file (Recommended)
1. In Vercel dashboard, go to your project
2. Go to **Settings** → **Files**
3. Upload `beaming-opus-452719-u5-b39abc625ad4.json`
4. It will be available at `/var/task/beaming-opus-452719-u5-b39abc625ad4.json`

### Option B: Use environment variable for credentials
Convert your JSON file to a base64 string and add it as an environment variable:

```powershell
# In PowerShell, convert file to base64
$content = Get-Content beaming-opus-452719-u5-b39abc625ad4.json -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$base64 = [System.Convert]::ToBase64String($bytes)
$base64
```

Then add `GOOGLE_CREDENTIALS_JSON` as an environment variable in Vercel with the base64 value, and we'll need to update the code to use it.

## Step 5: Redeploy

After adding environment variables:

```powershell
vercel --prod
```

Or trigger a new deployment from the Vercel dashboard.

## Step 6: Get Your Webhook URL

After deployment, Vercel will give you a URL like:
```
https://your-project-name.vercel.app
```

Your webhook URL will be:
```
https://your-project-name.vercel.app/webhook
```

## Step 7: Configure Twilio Webhook

1. Go to **Twilio Console** → **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
2. In **"When a message comes in"**, paste:
   ```
   https://your-project-name.vercel.app/webhook
   ```
3. Set HTTP method to: **POST**
4. Click **Save**

## Step 8: Test!

Send a WhatsApp message to **+1 415 523 8886** and you should receive "hi" as a reply!

## Updating Your Deployment

Whenever you make changes:

```powershell
vercel --prod
```

Or push to your connected Git repository (if you connected one).

## Troubleshooting

- **Check logs**: Go to Vercel dashboard → Your project → **Deployments** → Click on a deployment → **Functions** tab
- **Environment variables**: Make sure all are set correctly
- **Google Sheets**: Ensure the service account has access to your sheet

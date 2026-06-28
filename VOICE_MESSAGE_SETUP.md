# Voice Message Setup Guide

## Using Google Drive Audio File

You have a Google Drive file. To use it with Twilio, you need to convert it to a direct download link.

### Step 1: Make sure the file is publicly accessible

1. Open your Google Drive file: https://drive.google.com/file/d/10eXEq69SUQH3f3cDRFh8U-ittIgfaQ7J/view?usp=sharing
2. Click "Share" button
3. Change sharing settings to "Anyone with the link" can view
4. Click "Done"

### Step 2: Convert to direct download URL

Your Google Drive file ID is: `10eXEq69SUQH3f3cDRFh8U-ittIgfaQ7J`

Convert it to direct download format:
```
https://drive.google.com/uc?export=download&id=10eXEq69SUQH3f3cDRFh8U-ittIgfaQ7J
```

### Step 3: Set the environment variable

**For Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - Name: `VOICE_MESSAGE_URL`
   - Value: `https://drive.google.com/uc?export=download&id=10eXEq69SUQH3f3cDRFh8U-ittIgfaQ7J`
   - Environment: All Environments
3. Save and redeploy

**For local development (.env file):**
```
VOICE_MESSAGE_URL=https://drive.google.com/uc?export=download&id=10eXEq69SUQH3f3cDRFh8U-ittIgfaQ7J
```

## Important Notes

⚠️ **Google Drive Limitations:**
- Google Drive direct download links may have size limits
- For large files or production use, consider uploading to:
  - AWS S3
  - Google Cloud Storage
  - Azure Blob Storage
  - Any CDN service

✅ **Recommended for Production:**
Upload your audio file to a proper CDN or cloud storage for better reliability and performance.

## Testing

After setting the environment variable:
1. Send a WhatsApp message to your Twilio number
2. You should receive the voice message instead of text
3. Check Vercel logs to confirm the audio URL was used

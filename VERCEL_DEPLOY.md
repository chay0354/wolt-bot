# Deploy to Vercel

## 1. Push to GitHub

The repo must be on GitHub (already at `chay0354/wolt-bot`).

## 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **wolt-bot** from GitHub
3. Framework preset: **Other** (no build command needed)
4. Click **Deploy** (first deploy may fail until env vars are set — that's OK)

## 3. Add environment variables

Vercel Dashboard → your project → **Settings** → **Environment Variables**

Add every variable below for **Production** (and Preview if you want):

| Variable | Required | Example / notes |
|---|---|---|
| `ACCOUNT_SID` | Yes | Twilio Account SID |
| `AUTH_TOKEN` | Yes | Twilio Auth Token |
| `DEFAULT_FROM` | Yes | `whatsapp:+14155238886` |
| `DEFAULT_TO` | No | Your test number |
| `CONTENT_SID` | No | Twilio content template SID |
| `CONTENT_VARIABLES` | No | `{"1":"12/1","2":"3pm"}` |
| `SPREADSHEET_ID` | Yes | Google Sheet ID |
| `GOOGLE_CREDENTIALS_JSON` | Yes | Base64 service account JSON (see below) |
| `VOICE_MESSAGE_URL` | No | Public HTTPS URL to an audio file |

### Generate `GOOGLE_CREDENTIALS_JSON`

Locally, with the credentials JSON file in the project folder:

```powershell
npm run prepare-vercel
```

Copy the entire base64 string and paste it as the value of `GOOGLE_CREDENTIALS_JSON` in Vercel.

## 4. Redeploy

After saving env vars:

- Vercel Dashboard → **Deployments** → **Redeploy**, or
- Push a commit to `main` (if Git integration is connected)

## 5. Get your webhook URL

Open your deployment URL, e.g. `https://wolt-bot.vercel.app`

Your Twilio webhook is:

```
https://wolt-bot.vercel.app/webhook
```

Visit `/` on your deployment to see the live webhook URL in JSON.

## 6. Configure Twilio

1. Twilio Console → **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
2. **When a message comes in:** `https://your-project.vercel.app/webhook`
3. Method: **POST**
4. Save

## 7. Test

1. Join the WhatsApp sandbox (send `join ...` to +1 415 523 8886)
2. Send a message to the sandbox number
3. You should get an auto-reply and a new row in Google Sheets

Check **Vercel → Deployments → Functions → Logs** if something fails.

## Checklist

- [ ] All required env vars set in Vercel
- [ ] Google Sheet shared with `wolt-743@beaming-opus-452719-u5.iam.gserviceaccount.com` (Editor)
- [ ] Twilio webhook points to `https://your-project.vercel.app/webhook`
- [ ] WhatsApp sandbox joined on your phone

## CLI deploy (optional)

```powershell
npx vercel login
npx vercel --prod
```

Set env vars in the dashboard first, or via:

```powershell
npx vercel env add ACCOUNT_SID
```

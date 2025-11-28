# Fix: Google OAuth "Missing client_id" Error

## 🔴 Error
```
Access blocked: Authorization Error
Missing required parameter: client_id
Error 400: invalid_request
```

## ✅ Solution: Add Google OAuth Credentials

### Step 1: Get Google OAuth Credentials (5 minutes)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select Project**
   - Click project dropdown at top
   - Create new project: "Bstream" (or use existing)

3. **Enable YouTube Data API v3**
   - Go to: **APIs & Services** > **Library**
   - Search: "YouTube Data API v3"
   - Click **Enable**

4. **Create OAuth 2.0 Credentials**
   - Go to: **APIs & Services** > **Credentials**
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**
   - If prompted, configure OAuth consent screen first:
     - User Type: **External**
     - App name: **Bstream**
     - User support email: **your-email@example.com**
     - Developer contact: **your-email@example.com**
     - Click **Save and Continue** through all steps
   - Back to Credentials:
     - Application type: **Web application**
     - Name: **Bstream Local**
     - Authorized redirect URIs:
       ```
       http://localhost:3000/api/auth/callback/google
       ```
     - Click **Create**
   - **Copy the Client ID and Client Secret**

### Step 2: Add to `.env.local`

Open `web/.env.local` and add these lines:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

**Replace:**
- `your-client-id-here` with your actual Client ID
- `your-client-secret-here` with your actual Client Secret

### Step 3: Restart Dev Server

```bash
# Stop server (Ctrl+C)
cd web
npm run dev
```

### Step 4: Test

1. Visit: http://localhost:3000/api/auth/test-google
2. Should show: `"configured": true`
3. Try signing in with Google on the login page

## 🎯 Quick Check

Run this to verify:
```bash
cd web
curl http://localhost:3000/api/auth/test-google
```

Should return:
```json
{
  "configured": true,
  "message": "Google OAuth is configured correctly"
}
```

## 📝 Example `.env.local`

```env
DATABASE_URL="postgres://..."
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
NODE_ENV=development

# Google OAuth (Required for YouTube Import)
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz

# Optional: Other OAuth Providers
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...
INSTAGRAM_CLIENT_ID=...
INSTAGRAM_CLIENT_SECRET=...
```

## ⚠️ Important Notes

- **Never commit `.env.local`** to Git (it's already in `.gitignore`)
- **For Vercel**: Add the same variables in Vercel Dashboard > Project Settings > Environment Variables
- **Redirect URI must match exactly**: `http://localhost:3000/api/auth/callback/google`


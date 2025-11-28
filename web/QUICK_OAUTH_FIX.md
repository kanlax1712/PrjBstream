# Quick OAuth Fix - Step by Step

## The Error: `OAuthSignin:1`

This means Google OAuth is not properly configured. Follow these steps:

## Step 1: Check Your .env.local File

Create or edit `.env.local` in the `web` folder:

```bash
cd web
nano .env.local
```

Add these lines (replace with YOUR actual values):

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any-random-string-here-min-32-chars
```

**Important**: 
- Get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from Google Cloud Console
- `NEXTAUTH_SECRET` can be any random string (32+ characters)
- Save the file

## Step 2: Get Google OAuth Credentials

1. Go to: https://console.cloud.google.com/
2. Select your project (or create one)
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Choose **Web application**
6. Add **Authorized redirect URI**:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**
9. Paste them into your `.env.local` file

## Step 3: Enable YouTube Data API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "YouTube Data API v3"
3. Click **Enable**

## Step 4: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Fill in:
   - **App name**: Bstream (or any name)
   - **User support email**: your-email@gmail.com
   - **Developer contact**: your-email@gmail.com
3. Click **Save and Continue**
4. Add scopes (click **Add or Remove Scopes**):
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/youtube.readonly`
5. Click **Save and Continue**
6. Add test users (if in Testing mode):
   - Add your email: kanlax1712@gmail.com
7. Click **Save and Continue**

## Step 5: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Step 6: Test Configuration

Visit: http://localhost:3000/api/auth/test-google

This will show you:
- ✅ Which variables are set
- ✅ Expected callback URL
- ❌ What's missing

## Step 7: Try Sign In Again

1. Go to: http://localhost:3000/login
2. Click **Sign in with Google**
3. Should redirect to Google OAuth page (not show error)

## Common Issues

### "redirect_uri_mismatch"
**Fix**: Make sure redirect URI in Google Console is EXACTLY:
```
http://localhost:3000/api/auth/callback/google
```
(No trailing slash, exact match)

### "invalid_client"
**Fix**: 
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Restart dev server after updating .env.local

### "access_denied"
**Fix**: 
- Complete OAuth consent screen setup
- Add your email as test user (if in Testing mode)

## Still Not Working?

1. Check: http://localhost:3000/api/auth/test-google
2. Verify all 4 environment variables are set
3. Check browser console for detailed errors
4. Check server terminal for OAuth errors
5. Make sure you restarted the dev server after updating .env.local


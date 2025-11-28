# Google OAuth Configuration Fix

## Error: OAuthSignin:1

This error occurs when Google OAuth is not properly configured. Here's how to fix it:

## Step 1: Check Environment Variables

Make sure these are set in your `.env.local` file:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

## Step 2: Verify Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, make sure you have:

   For localhost:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

   For production:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   ```

## Step 3: Check OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Make sure:
   - User type is set (Internal or External)
   - App name is set
   - Support email is set
   - Scopes include:
     - `openid`
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/youtube.readonly`
   - Test users added (if in Testing mode)

## Step 4: Test Configuration

Visit: `http://localhost:3000/api/auth/test-google`

This will show you:
- Which environment variables are set
- Expected callback URL
- Configuration status

## Step 5: Common Issues

### Issue: "OAuthSignin:1"
**Cause**: Missing or incorrect GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET
**Fix**: Check your `.env.local` file and restart the dev server

### Issue: "redirect_uri_mismatch"
**Cause**: Redirect URI in Google Console doesn't match NEXTAUTH_URL
**Fix**: Add exact redirect URI: `http://localhost:3000/api/auth/callback/google`

### Issue: "invalid_client"
**Cause**: Client ID or Secret is incorrect
**Fix**: Regenerate credentials in Google Cloud Console and update `.env.local`

### Issue: "access_denied"
**Cause**: OAuth consent screen not configured or app in Testing mode
**Fix**: Complete OAuth consent screen setup and add test users

## Step 6: Restart Dev Server

After updating environment variables:
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Verification

1. Check config: `http://localhost:3000/api/auth/test-google`
2. Try signing in: Click "Sign in with Google" on login page
3. Should redirect to Google OAuth page (not show error)

## Still Having Issues?

1. Check browser console for detailed errors
2. Check server logs for OAuth errors
3. Verify all environment variables are loaded (restart server)
4. Make sure redirect URI matches exactly (no trailing slashes)
5. Check Google Cloud Console for any error messages


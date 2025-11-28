# OAuth Providers Setup Guide

## Overview
Bstream now supports multiple OAuth providers for login:
- ✅ Google (with YouTube import support)
- ✅ Microsoft
- ✅ Facebook
- ✅ Instagram

## Setup Instructions

### 1. Google OAuth (Required for YouTube Import)

**Already configured** - See `YOUTUBE_IMPORT_SETUP.md` for details.

**Environment Variables:**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Scopes:**
- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/youtube.readonly` (for YouTube import)

---

### 2. Microsoft OAuth

**Step 1: Register App in Azure Portal**
1. Go to: https://portal.azure.com/
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: Bstream
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: 
     - Type: Web
     - URL: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
5. Click **Register**

**Step 2: Get Credentials**
1. Copy **Application (client) ID** → This is your `MICROSOFT_CLIENT_ID`
2. Go to **Certificates & secrets**
3. Click **New client secret**
4. Copy the secret value → This is your `MICROSOFT_CLIENT_SECRET`
5. (Optional) Copy **Directory (tenant) ID** → This is your `MICROSOFT_TENANT_ID`

**Step 3: Add Environment Variables**
```env
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=common  # or your tenant ID
```

---

### 3. Facebook OAuth

**Step 1: Create Facebook App**
1. Go to: https://developers.facebook.com/
2. Click **My Apps** > **Create App**
3. Choose **Consumer** app type
4. Fill in app details:
   - **App Name**: Bstream
   - **App Contact Email**: your-email@example.com
5. Click **Create App**

**Step 2: Configure OAuth**
1. Go to **Settings** > **Basic**
2. Add **App Domains**: `localhost` (for development)
3. Click **Add Platform** > **Website**
4. Add **Site URL**: `http://localhost:3000`
5. Go to **Products** > **Facebook Login** > **Settings**
6. Add **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/facebook
   ```

**Step 3: Get Credentials**
1. Go to **Settings** > **Basic**
2. Copy **App ID** → This is your `FACEBOOK_CLIENT_ID`
3. Copy **App Secret** → This is your `FACEBOOK_CLIENT_SECRET`

**Step 4: Add Environment Variables**
```env
FACEBOOK_CLIENT_ID=your-app-id
FACEBOOK_CLIENT_SECRET=your-app-secret
```

**Note**: Facebook requires app review for production use.

---

### 4. Instagram OAuth

**Step 1: Create Facebook App (Instagram uses Facebook)**
1. Go to: https://developers.facebook.com/
2. Create a new app or use existing Facebook app
3. Go to **Products** > **Instagram Basic Display**
4. Click **Set Up**

**Step 2: Configure Instagram**
1. Go to **Instagram Basic Display** > **Basic Display**
2. Add **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/instagram
   ```
3. Add **Deauthorize Callback URL**:
   ```
   http://localhost:3000/api/auth/deauthorize/instagram
   ```

**Step 3: Get Credentials**
1. Go to **Settings** > **Basic**
2. Copy **App ID** → This is your `INSTAGRAM_CLIENT_ID`
3. Copy **App Secret** → This is your `INSTAGRAM_CLIENT_SECRET`

**Step 4: Add Environment Variables**
```env
INSTAGRAM_CLIENT_ID=your-app-id
INSTAGRAM_CLIENT_SECRET=your-app-secret
```

**Note**: Instagram Basic Display requires app review for production.

---

## Complete .env.local Example

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth (Required for YouTube Import)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Instagram OAuth
INSTAGRAM_CLIENT_ID=your-instagram-app-id
INSTAGRAM_CLIENT_SECRET=your-instagram-app-secret
```

## Production Setup

For production (Vercel), add all environment variables in:
1. Vercel Dashboard > Project Settings > Environment Variables
2. Update redirect URIs in each provider's console to use your production domain:
   ```
   https://your-domain.vercel.app/api/auth/callback/[provider]
   ```

## Testing

1. Restart dev server after adding environment variables
2. Go to `/login`
3. You should see buttons for all configured providers
4. Click any provider to test OAuth flow

## YouTube Import

**Important**: YouTube import requires Google OAuth with YouTube scope. This is automatically configured when you set up Google OAuth.

The YouTube import button will:
1. Check if user is logged in with Google
2. If not, prompt to sign in with Google
3. After Google sign-in, fetch YouTube videos
4. Allow importing videos to Bstream

## Troubleshooting

### Provider not showing
- Check if environment variables are set
- Restart dev server after adding variables
- Check browser console for errors

### OAuth error
- Verify redirect URI matches exactly in provider console
- Check client ID and secret are correct
- Ensure app is not in restricted mode (Facebook/Instagram)

### YouTube import not working
- Ensure Google OAuth is configured
- Check YouTube Data API v3 is enabled
- Verify YouTube scope is included in Google OAuth


# Quick YouTube Import Setup

## 🚀 Quick Start (5 minutes)

### 1. Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create new project: "Bstream YouTube Import"
3. Enable **YouTube Data API v3**:
   - APIs & Services > Library
   - Search "YouTube Data API v3"
   - Click "Enable"

### 2. Create OAuth Credentials
1. APIs & Services > Credentials
2. Create Credentials > OAuth client ID
3. Application type: **Web application**
4. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.vercel.app/api/auth/callback/google
   ```
5. Copy **Client ID** and **Client Secret**

### 3. Add to Environment Variables

**Local (.env file):**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Vercel:**
- Project Settings > Environment Variables
- Add both variables

### 4. Test It!
1. Go to `/studio`
2. Click "Import from YouTube" button
3. Sign in with Google
4. Select and import videos!

## ✅ Done!

Your YouTube import feature is now ready to use!


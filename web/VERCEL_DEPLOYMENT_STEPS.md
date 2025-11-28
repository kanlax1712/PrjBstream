# 🚀 Quick Vercel Deployment Guide

## Step 1: Prepare Code for GitHub

```bash
cd /Users/laxmikanth/Documents/Bstream/web

# Check current status
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Enhanced video player with volume, fullscreen, and scrollable settings

- Added mute/unmute volume button
- Fixed fullscreen for regular and YouTube videos  
- Made settings panel scrollable (all quality options visible)
- Fixed YouTube iframe CSP and postMessage errors
- Improved mobile touch controls"

# Push to GitHub
git push origin main
```

## Step 2: Configure Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project → **Settings** → **Environment Variables**
3. Add these variables:

### Required Variables

```bash
DATABASE_URL=postgresql://user:password@host:port/database
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate-a-random-secret-here
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

### OAuth Variables (for YouTube import)

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Optional OAuth Variables

```bash
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
```

**Important**: Set these for **Production**, **Preview**, and **Development** environments.

## Step 3: Deploy to Vercel

### Option A: Auto-Deploy (Recommended)
- Push to `main` branch → Vercel auto-deploys
- Check deployment in Vercel Dashboard

### Option B: Manual Deploy
1. Go to Vercel Dashboard
2. Click **Deployments** → **Redeploy**
3. Or use Vercel CLI:
   ```bash
   vercel --prod
   ```

## Step 4: Run Database Migrations

After first deployment:

```bash
# Option 1: Via Vercel Dashboard
# Go to Functions → Run Function → Execute migration

# Option 2: Via Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy
```

## Step 5: Verify Deployment

✅ Test these features:
- [ ] Video playback works
- [ ] Volume button (mute/unmute)
- [ ] Volume slider
- [ ] Fullscreen button
- [ ] Settings panel opens
- [ ] Settings panel scrolls (see all quality options)
- [ ] YouTube video import works
- [ ] YouTube videos play correctly

## 🔧 Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Verify all environment variables are set
- Ensure `DATABASE_URL` is correct

### Runtime Errors
- Check function logs in Vercel Dashboard
- Verify environment variables are accessible
- Check database connection

### Video Issues
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check CSP settings in middleware.ts
- Test YouTube iframe permissions

## 📋 Files Changed for Deployment

- ✅ `src/components/video/enhanced-video-player.tsx` - Enhanced controls
- ✅ `src/middleware.ts` - Added YouTube iframe CSP
- ✅ `src/app/globals.css` - Scrollbar styling
- ✅ `vercel.json` - Already configured
- ✅ `next.config.ts` - Already configured

## 🎯 Quick Commands

```bash
# Build locally to test
npm run build

# Check for errors
npm run lint

# Test locally
npm run dev

# Deploy to Vercel
vercel --prod
```

---

**Ready to deploy! 🚀**


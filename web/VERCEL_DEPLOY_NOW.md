# 🚀 Deploy to Vercel - Step by Step Guide

## Repository Ready ✅
- **GitHub**: https://github.com/kanlax1712/PrjBstream
- **Status**: Code successfully pushed
- **Branch**: main

## Step 1: Import Project in Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in with your GitHub account

2. **Import Project**
   - Click **"Add New..."** button (top right)
   - Select **"Project"**
   - Find and select: **`kanlax1712/PrjBstream`**
   - Click **"Import"**

3. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `web` ⚠️ **IMPORTANT: Set this to `web`**
   - **Build Command**: Leave default or set to `cd web && npm run build`
   - **Output Directory**: `.next` (default)
   - **Install Command**: `cd web && npm install`

## Step 2: Configure Environment Variables

**Before deploying**, add these environment variables:

### Go to: Settings → Environment Variables

#### Required Variables (Production, Preview, Development)

```bash
# Database (Vercel Postgres)
DATABASE_URL=postgresql://user:password@host:port/database

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate-random-secret-here

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

#### OAuth Variables (for YouTube import)

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Optional OAuth Variables

```bash
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
```

**Important**: 
- Set each variable for **Production**, **Preview**, and **Development**
- Click **"Save"** after adding each variable

### How to Get Values:

1. **DATABASE_URL**: 
   - Create Vercel Postgres database in Vercel Dashboard
   - Copy the connection string

2. **NEXTAUTH_SECRET**: 
   ```bash
   openssl rand -base64 32
   ```

3. **BLOB_READ_WRITE_TOKEN**:
   - Create Vercel Blob Store in Vercel Dashboard
   - Copy the read/write token

4. **GOOGLE_CLIENT_ID/SECRET**:
   - Google Cloud Console → APIs & Services → Credentials
   - Create OAuth 2.0 Client ID

## Step 3: Deploy

1. **Click "Deploy"** button
2. **Wait for build** (usually 2-5 minutes)
3. **Check build logs** for any errors

## Step 4: Run Database Migrations

After first successful deployment:

### Option A: Via Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
cd web
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

### Option B: Via Vercel Dashboard

1. Go to your project → **Settings** → **Functions**
2. Create a new function or use the API route
3. Or use Vercel's built-in database migration tool

## Step 5: Verify Deployment

✅ Test these features:
- [ ] Home page loads
- [ ] User registration/login works
- [ ] Video upload works
- [ ] Video playback works
- [ ] Volume button (mute/unmute)
- [ ] Fullscreen button
- [ ] Settings panel scrolls
- [ ] YouTube video import works

## 🔧 Troubleshooting

### Build Fails

**Error**: "Cannot find module"
- **Fix**: Ensure Root Directory is set to `web`

**Error**: "Prisma Client not generated"
- **Fix**: Build command should include `prisma generate`

**Error**: "DATABASE_URL not found"
- **Fix**: Add DATABASE_URL to environment variables

### Runtime Errors

**Error**: "Database connection failed"
- **Fix**: Verify DATABASE_URL format and credentials

**Error**: "NEXTAUTH_SECRET missing"
- **Fix**: Add NEXTAUTH_SECRET to environment variables

**Error**: "Blob storage error"
- **Fix**: Verify BLOB_READ_WRITE_TOKEN is set

### Video Playback Issues

**Error**: "CSP violation"
- **Fix**: Already fixed in middleware.ts (frame-src for YouTube)

**Error**: "YouTube iframe blocked"
- **Fix**: Already fixed in middleware.ts

## 📋 Quick Checklist

Before deploying:
- [ ] Repository pushed to GitHub ✅
- [ ] Root Directory set to `web`
- [ ] DATABASE_URL configured
- [ ] NEXTAUTH_URL set to your Vercel domain
- [ ] NEXTAUTH_SECRET generated
- [ ] BLOB_READ_WRITE_TOKEN configured
- [ ] OAuth credentials configured (if using)

After deploying:
- [ ] Build successful
- [ ] Database migrations run
- [ ] All features tested
- [ ] Production URL working

## 🎯 Project Configuration

The project is already configured for Vercel:

✅ `vercel.json` - Function timeouts and CORS headers
✅ `next.config.ts` - Image optimization and large file support
✅ `package.json` - Build scripts with Prisma generate
✅ `prisma/schema.prisma` - PostgreSQL ready

## 📞 Need Help?

- Check build logs in Vercel Dashboard
- Review `DEPLOYMENT_PACKAGE.md` for detailed guide
- Check `VERCEL_DEPLOYMENT_STEPS.md` for quick reference

---

**Ready to deploy! 🚀**

Visit: https://vercel.com/dashboard
Repository: https://github.com/kanlax1712/PrjBstream


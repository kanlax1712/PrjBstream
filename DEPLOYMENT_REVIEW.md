# Bstream - Netlify Deployment Review & Setup

## Project Review Summary

### ✅ Code Review Status

**Project Structure**: ✅ Good
- Next.js 16.0.3 with App Router
- TypeScript configured
- Prisma ORM setup
- Proper component organization

**Build Configuration**: ✅ Ready
- `next.config.ts` properly configured
- Image optimization enabled
- Server actions body size limit set (2GB)
- Remote image patterns configured

**Database Schema**: ⚠️ Needs Update
- Currently set to SQLite (development)
- **Action Required**: Update to PostgreSQL for production

**Environment Variables**: ⚠️ Need Setup
- DATABASE_URL (required)
- NEXTAUTH_URL (required)
- NEXTAUTH_SECRET (required)
- NODE_ENV (required)

**File Storage**: ⚠️ Needs Production Setup
- Currently using local filesystem
- **Action Required**: Move to cloud storage (S3/R2) for production

---

## Deployment Checklist

### Pre-Deployment

- [x] Code pushed to GitHub
- [x] Netlify site created (ID: 11233780-6dd7-4bf2-b24b-afd4392339c6)
- [ ] Environment variables configured
- [ ] Database created and configured
- [ ] Prisma schema updated for PostgreSQL
- [ ] Build settings configured in Netlify

### Build Configuration

**Base directory**: `web`
**Build command**: `npm install && npx prisma generate && npm run build`
**Publish directory**: `web/.next`
**Node version**: `20`

### Required Environment Variables

1. **DATABASE_URL**
   - Format: `postgresql://user:password@host:5432/dbname`
   - Get from: Supabase, Neon, or Netlify Postgres

2. **NEXTAUTH_URL**
   - Value: `https://abstream.netlify.app` (or your custom domain)

3. **NEXTAUTH_SECRET**
   - Value: `eye6rx7dN8gUpwsqYx+p/kWli0puo1r+A7q7RuNdTmI=`
   - Or generate: `openssl rand -base64 32`

4. **NODE_ENV**
   - Value: `production`

---

## Step-by-Step Deployment Setup

### Step 1: Update Prisma Schema for PostgreSQL

**File**: `web/prisma/schema.prisma`

**Change**:
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

**Then commit and push**:
```bash
cd /Users/laxmikanth/Documents/Bstream
git add web/prisma/schema.prisma
git commit -m "Update Prisma to PostgreSQL for production"
git push
```

### Step 2: Set Up Database

**Option A: Supabase (Recommended - Free)**

1. Go to https://supabase.com
2. Create account → New project
3. Name: `bstream`
4. Wait 2-3 minutes
5. Go to **Settings** → **Database**
6. Copy **Connection string** (URI format)
7. Replace `[YOUR-PASSWORD]` with your password

**Option B: Neon (Free Tier)**

1. Go to https://neon.tech
2. Sign up → Create project
3. Copy connection string

### Step 3: Configure Netlify Environment Variables

**Go to**: https://app.netlify.com/sites/abstream/configuration/env

**Add 4 variables**:

1. **DATABASE_URL**
   - Key: `DATABASE_URL`
   - Value: Your PostgreSQL connection string
   - Scope: All scopes

2. **NEXTAUTH_URL**
   - Key: `NEXTAUTH_URL`
   - Value: `https://abstream.netlify.app`
   - Scope: All scopes

3. **NEXTAUTH_SECRET**
   - Key: `NEXTAUTH_SECRET`
   - Value: `eye6rx7dN8gUpwsqYx+p/kWli0puo1r+A7q7RuNdTmI=`
   - Scope: All scopes

4. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`
   - Scope: All scopes

### Step 4: Configure Build Settings

**Go to**: https://app.netlify.com/sites/abstream/configuration/deploys

**Settings**:
- **Base directory**: `web`
- **Build command**: `npm install && npx prisma generate && npm run build`
- **Publish directory**: `web/.next`
- **Node version**: `20`

### Step 5: Run Database Migrations

After first successful build, you need to run migrations:

**Option A: Via SQL**
1. Connect to your PostgreSQL database
2. Run SQL from: `web/prisma/migrations/*/migration.sql`

**Option B: Via Netlify Function** (Future)
- Create a migration function
- Call it after deployment

### Step 6: Deploy

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Monitor build logs
4. Wait for completion

---

## Code Issues Found & Fixed

### ✅ Fixed Issues

1. **Prisma Config**: Added fallback for DATABASE_URL during build
2. **Git Ignore**: Properly configured
3. **Build Command**: Correctly set up

### ⚠️ Issues to Address

1. **Database Provider**: Still SQLite - needs PostgreSQL update
2. **File Storage**: Local filesystem - needs cloud storage
3. **Environment Variables**: Not yet set in Netlify

---

## Production Recommendations

### Immediate (Required)

1. ✅ Update Prisma schema to PostgreSQL
2. ✅ Set environment variables in Netlify
3. ✅ Configure build settings
4. ✅ Set up PostgreSQL database

### Soon (Recommended)

1. **File Storage**: Move to S3/Cloudflare R2
2. **CDN**: Configure for video delivery
3. **Monitoring**: Set up error tracking
4. **Backups**: Configure database backups

### Future (Optional)

1. **Custom Domain**: Configure DNS
2. **SSL**: Automatic with Netlify
3. **Analytics**: Enable Netlify Analytics
4. **Rate Limiting**: Implement API rate limits

---

## Testing After Deployment

1. **Home Page**: Should load
2. **Registration**: Create test account
3. **Login**: Test authentication
4. **Video Upload**: Test file upload (if storage configured)
5. **Search**: Test search functionality
6. **Comments**: Test commenting
7. **Subscriptions**: Test subscription flow

---

## Troubleshooting

### Build Fails

**Check**:
- Environment variables are set
- Build command is correct
- Node version is 20
- Database connection string is valid

### Database Errors

**Solutions**:
- Verify DATABASE_URL format
- Check database allows external connections
- Ensure migrations are run
- Verify Prisma schema is PostgreSQL

### File Upload Issues

**Solutions**:
- Configure cloud storage
- Update upload handlers
- Check file size limits
- Verify CORS settings

---

## Quick Start Commands

```bash
# Update schema to PostgreSQL
cd /Users/laxmikanth/Documents/Bstream/web
# Edit prisma/schema.prisma (change to postgresql)
git add prisma/schema.prisma
git commit -m "Update to PostgreSQL"
git push

# Then set environment variables in Netlify dashboard
# And trigger deploy
```

---

**Status**: Code is ready, needs environment setup and database configuration.


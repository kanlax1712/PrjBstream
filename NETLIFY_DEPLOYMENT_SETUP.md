# Complete Netlify Deployment Setup Guide

## Project ID: 11233780-6dd7-4bf2-b24b-afd4392339c6
## Site URL: https://abstream.netlify.app

---

## ✅ Code Review Complete

### Issues Found & Fixed

1. ✅ **Fixed**: `next.config.ts` - Removed unsupported `serverActions` config
2. ✅ **Fixed**: `prisma.config.ts` - Added fallback for DATABASE_URL
3. ⚠️ **Action Required**: Update Prisma schema to PostgreSQL
4. ⚠️ **Action Required**: Set environment variables in Netlify

---

## Step 1: Update Prisma Schema for PostgreSQL

**File**: `web/prisma/schema.prisma`

**Current** (Line 9):
```prisma
provider = "sqlite"
```

**Change to**:
```prisma
provider = "postgresql"
```

**Then commit**:
```bash
cd /Users/laxmikanth/Documents/Bstream
git add web/prisma/schema.prisma
git commit -m "Update Prisma to PostgreSQL for production"
git push
```

---

## Step 2: Set Up PostgreSQL Database

### Option A: Supabase (Recommended - Free)

1. Go to https://supabase.com
2. Sign up/Login
3. Click **"New project"**
4. Fill in:
   - **Name**: `bstream`
   - **Database password**: (save this!)
   - **Region**: Choose closest to you
5. Wait 2-3 minutes for setup
6. Go to **Settings** → **Database**
7. Scroll to **"Connection string"**
8. Copy the **URI** format
9. Replace `[YOUR-PASSWORD]` with your actual password
10. **Save this connection string** - you'll need it for Step 3

**Example format**:
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

---

## Step 3: Configure Netlify Environment Variables

**Direct Link**: https://app.netlify.com/sites/abstream/configuration/env

### Add These 4 Variables:

#### Variable 1: DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Your PostgreSQL connection string from Step 2
- **Scope**: All scopes
- Click **"Save variable"**

#### Variable 2: NEXTAUTH_URL
- **Key**: `NEXTAUTH_URL`
- **Value**: `https://abstream.netlify.app`
- **Scope**: All scopes
- Click **"Save variable"**

#### Variable 3: NEXTAUTH_SECRET
- **Key**: `NEXTAUTH_SECRET`
- **Value**: `eye6rx7dN8gUpwsqYx+p/kWli0puo1r+A7q7RuNdTmI=`
- **Scope**: All scopes
- Click **"Save variable"**

#### Variable 4: NODE_ENV
- **Key**: `NODE_ENV`
- **Value**: `production`
- **Scope**: All scopes
- Click **"Save variable"**

---

## Step 4: Configure Build Settings

**Direct Link**: https://app.netlify.com/sites/abstream/configuration/deploys

**Scroll to "Build settings"** and click **"Edit settings"**:

- **Base directory**: `web`
- **Build command**: `npm install && npx prisma generate && npm run build`
- **Publish directory**: `web/.next`
- **Node version**: `20` (or leave default)

Click **"Save"**

---

## Step 5: Run Database Migrations

After the first successful build, you need to run database migrations:

### Option A: Via Supabase SQL Editor

1. Go to your Supabase project
2. Click **"SQL Editor"**
3. Create a new query
4. Copy SQL from: `web/prisma/migrations/20251121103358_init/migration.sql`
5. Run the query
6. Then run: `web/prisma/migrations/20251121143121_add_user_fields/migration.sql`

### Option B: Via Prisma Studio (Local)

```bash
cd /Users/laxmikanth/Documents/Bstream/web
# Set DATABASE_URL to your production database
export DATABASE_URL="your-postgresql-connection-string"
npx prisma migrate deploy
```

---

## Step 6: Deploy

1. Go to **Deploys** tab: https://app.netlify.com/sites/abstream/deploys
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Monitor the build logs
4. Wait for completion (usually 2-5 minutes)

---

## Step 7: Verify Deployment

After successful deployment:

1. **Visit**: https://abstream.netlify.app
2. **Test Registration**: Create a test account
3. **Test Login**: Sign in with test account
4. **Test Features**: 
   - Search
   - Video upload (if storage configured)
   - Comments
   - Subscriptions

---

## Troubleshooting

### Build Fails with "DATABASE_URL missing"

**Solution**: Ensure all 4 environment variables are set in Netlify

### Build Fails with Prisma Errors

**Solution**: 
- Verify DATABASE_URL is correct PostgreSQL connection string
- Check Prisma schema is updated to `postgresql`
- Ensure `npx prisma generate` runs in build command

### Database Connection Errors

**Solution**:
- Verify DATABASE_URL format is correct
- Check database allows external connections
- Ensure database is running
- Test connection string locally

### Site Loads but Features Don't Work

**Solution**:
- Check database migrations are run
- Verify environment variables are set correctly
- Check browser console for errors
- Review Netlify function logs

---

## Post-Deployment Checklist

- [ ] Site loads successfully
- [ ] Registration works
- [ ] Login works
- [ ] Database connection works
- [ ] Search works
- [ ] Comments work
- [ ] Subscriptions work
- [ ] Video upload works (if storage configured)

---

## Next Steps (Optional)

1. **Custom Domain**: Configure in Netlify
2. **File Storage**: Set up S3/Cloudflare R2 for video uploads
3. **CDN**: Configure for better performance
4. **Monitoring**: Set up error tracking
5. **Analytics**: Enable Netlify Analytics

---

## Quick Reference

**Site Dashboard**: https://app.netlify.com/sites/abstream
**Environment Variables**: https://app.netlify.com/sites/abstream/configuration/env
**Build Settings**: https://app.netlify.com/sites/abstream/configuration/deploys
**Deploys**: https://app.netlify.com/sites/abstream/deploys

---

**Ready to deploy!** Follow the steps above in order.


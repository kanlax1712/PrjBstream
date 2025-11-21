# Netlify Environment Variables Setup

## ⚠️ Build Error Fix

Your build is failing because `DATABASE_URL` is missing. Here's how to fix it:

## Quick Fix: Add Environment Variables

### Step 1: Go to Netlify Environment Variables

**Direct Link**: https://app.netlify.com/sites/bright-dasik-821173/configuration/env

Or:
1. Go to https://app.netlify.com/sites/bright-dasik-821173
2. Click **"Site settings"**
3. Click **"Environment variables"**

### Step 2: Add Required Variables

Click **"Add a variable"** for each:

#### 1. DATABASE_URL

**If you have a database:**
- Key: `DATABASE_URL`
- Value: Your PostgreSQL connection string
  - Example: `postgresql://user:password@host:5432/dbname`

**If you DON'T have a database yet (temporary):**
- Key: `DATABASE_URL`
- Value: `file:./dev.db` (this will allow build to succeed)
- ⚠️ You'll need a real database later for the app to work

#### 2. NEXTAUTH_URL
- Key: `NEXTAUTH_URL`
- Value: `https://bright-dasik-821173.netlify.app`

#### 3. NEXTAUTH_SECRET
- Key: `NEXTAUTH_SECRET`
- Value: `eye6rx7dN8gUpwsqYx+p/kWli0puo1r+A7q7RuNdTmI=`
- (Or generate your own with: `openssl rand -base64 32`)

#### 4. NODE_ENV
- Key: `NODE_ENV`
- Value: `production`

### Step 3: Redeploy

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Build should now succeed! ✅

## Get a Free Database (Recommended)

### Option 1: Supabase (Easiest - Free)

1. Go to https://supabase.com
2. Sign up/Login
3. Click **"New project"**
4. Fill in:
   - Name: `bstream`
   - Database password: (save this!)
   - Region: Choose closest
5. Wait 2-3 minutes for setup
6. Go to **Settings** → **Database**
7. Scroll to **"Connection string"**
8. Copy the **URI** format
9. Replace `[YOUR-PASSWORD]` with your actual password
10. Update `DATABASE_URL` in Netlify with this value

### Option 2: Neon (Free Tier)

1. Go to https://neon.tech
2. Sign up
3. Create new project
4. Copy connection string
5. Add to Netlify as `DATABASE_URL`

### Option 3: Netlify Postgres Add-on

1. In Netlify Dashboard → **Add-ons**
2. Search for **"Postgres"**
3. Click **"Install Postgres"**
4. Copy connection string
5. Add to Environment Variables

## After Database is Set Up

1. **Update Prisma Schema** (if using PostgreSQL):
   ```bash
   cd /Users/laxmikanth/Documents/Bstream/web
   # Edit prisma/schema.prisma
   # Change line 9 from: provider = "sqlite"
   # To: provider = "postgresql"
   ```

2. **Commit and Push**:
   ```bash
   git add web/prisma/schema.prisma
   git commit -m "Update to PostgreSQL"
   git push
   ```

3. **Run Migrations**:
   - After first successful build, connect to your database
   - Run SQL from `web/prisma/migrations/*/migration.sql`

## Current Build Command

Your build command is:
```
cd web && npm install && npx prisma generate && npm run build
```

This is correct! Just need the environment variables.

## Summary

**Minimum to fix build:**
1. Add `DATABASE_URL` (can be `file:./dev.db` temporarily)
2. Add `NEXTAUTH_URL`
3. Add `NEXTAUTH_SECRET`
4. Add `NODE_ENV`
5. Redeploy

**For full functionality:**
- Set up a real PostgreSQL database
- Update Prisma schema to PostgreSQL
- Run migrations

---

**Need help?** Check build logs in Netlify dashboard for specific errors.


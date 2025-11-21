# Fix Netlify Build Error

## Problem
Build fails with: `PrismaConfigEnvError: Missing required environment variable: DATABASE_URL`

## Solution: Add Environment Variables in Netlify

### Step 1: Go to Netlify Environment Variables

1. Open your Netlify site: https://app.netlify.com/sites/bright-dasik-821173
2. Go to **Site settings** → **Environment variables**
3. Or direct link: https://app.netlify.com/sites/bright-dasik-821173/configuration/env

### Step 2: Add DATABASE_URL

**Option A: If you have a database already**

1. Click **"Add a variable"**
2. Key: `DATABASE_URL`
3. Value: Your PostgreSQL connection string
   - Format: `postgresql://user:password@host:5432/dbname`
4. Click **"Save"**

**Option B: If you don't have a database yet (Temporary fix)**

For build to succeed, you can use a dummy URL temporarily:

1. Click **"Add a variable"**
2. Key: `DATABASE_URL`
3. Value: `postgresql://user:password@localhost:5432/dummy`
4. Click **"Save"**

⚠️ **Note**: This is only for build. You'll need a real database for the app to work.

### Step 3: Add Other Required Variables

Also add these:

**NEXTAUTH_URL**
- Key: `NEXTAUTH_URL`
- Value: `https://bright-dasik-821173.netlify.app`

**NEXTAUTH_SECRET**
- Key: `NEXTAUTH_SECRET`
- Value: Generate with: `openssl rand -base64 32`
- Or use any random 32+ character string

**NODE_ENV**
- Key: `NODE_ENV`
- Value: `production`

### Step 4: Redeploy

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Build should now succeed

## Quick Setup: Get a Free Database

### Supabase (Recommended - Free)

1. Go to https://supabase.com
2. Sign up/Login
3. Click **"New project"**
4. Fill in:
   - Name: `bstream`
   - Database password: (save this!)
   - Region: Choose closest
5. Wait 2-3 minutes
6. Go to **Settings** → **Database**
7. Copy **Connection string** (URI format)
8. Replace `[YOUR-PASSWORD]` with your password
9. Add to Netlify as `DATABASE_URL`

### Neon (Free Tier)

1. Go to https://neon.tech
2. Sign up
3. Create project
4. Copy connection string
5. Add to Netlify

## After Database is Set Up

1. Update `web/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. Commit and push:
   ```bash
   cd /Users/laxmikanth/Documents/Bstream
   # Edit schema.prisma to use postgresql
   git add web/prisma/schema.prisma
   git commit -m "Update to PostgreSQL for production"
   git push
   ```

3. Run migrations (after first successful build):
   - Connect to your database
   - Run SQL from `web/prisma/migrations/*/migration.sql`

## Build Command (Current)

Your current build command is correct:
```
cd web && npm install && npx prisma generate && npm run build
```

Just need to add the environment variables!

## Verification

After adding environment variables and redeploying:
- ✅ Build should complete successfully
- ✅ Site should deploy
- ⚠️ App may not work fully until database is set up and migrations run


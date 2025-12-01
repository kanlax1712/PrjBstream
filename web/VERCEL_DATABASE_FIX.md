# Fix Vercel Database Connection Error

## ❌ Current Error
```
Failed to connect to database: Error [PrismaClientInitializationError]: 
Can't reach database server at `db.prisma.io:5432`
```

## 🔍 Problem
Vercel is trying to use `db.prisma.io:5432` which is a Prisma Accelerate URL. This means:
- Either `DATABASE_URL` is not set in Vercel
- Or it's set to an incorrect/old value
- Or `PRISMA_DATABASE_URL` is set but pointing to the wrong database

## ✅ Solution: Set Up Database in Vercel

### Option 1: Use Vercel Postgres (Recommended - Easiest)

1. **Go to Vercel Dashboard**
   - Navigate to your project: https://vercel.com/dashboard
   - Click on your project

2. **Create Vercel Postgres Database**
   - Go to **Storage** tab
   - Click **"Create Database"**
   - Select **"Postgres"**
   - Choose a name (e.g., `bstream-db`)
   - Select a region (choose closest to you)
   - Click **"Create"**

3. **Get Connection String**
   - After creation, go to **Storage** → Your database
   - Click on **".env.local"** tab
   - You'll see `POSTGRES_URL` or `DATABASE_URL`
   - **Copy this value**

4. **Add to Environment Variables**
   - Go to **Settings** → **Environment Variables**
   - Add new variable:
     - **Name**: `DATABASE_URL`
     - **Value**: Paste the connection string you copied
     - **Environment**: Production, Preview, Development (select all)
   - Click **"Save"**

### Option 2: Use Supabase (Free Alternative)

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up/Login (free)

2. **Create New Project**
   - Click **"New project"**
   - Name: `bstream`
   - Database password: (create and save this!)
   - Region: Choose closest
   - Wait 2-3 minutes for setup

3. **Get Connection String**
   - Go to **Settings** → **Database**
   - Scroll to **"Connection string"**
   - Select **"URI"** tab
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your actual password

   **Format**: 
   ```
   postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

4. **Add to Vercel**
   - Go to Vercel → Your project → **Settings** → **Environment Variables**
   - Add:
     - **Name**: `DATABASE_URL`
     - **Value**: Your Supabase connection string
     - **Environment**: All environments
   - Click **"Save"**

### Option 3: Use Neon (Free Tier)

1. **Go to**: https://neon.tech
2. **Sign up** → Create project
3. **Copy** connection string from dashboard
4. **Add to Vercel** as `DATABASE_URL`

## 🔧 After Setting DATABASE_URL

### Step 1: Run Database Migrations

After setting `DATABASE_URL`, you need to run migrations to create tables:

**Option A: Via Vercel CLI (Recommended)**
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Pull environment variables
vercel env pull .env.local

# Run migrations
cd web
npx prisma migrate deploy
```

**Option B: Via Supabase/Neon SQL Editor**
1. Go to your database dashboard
2. Open SQL Editor
3. Run the migration SQL files from `web/prisma/migrations/`

### Step 2: Verify Environment Variables

Make sure these are set in Vercel:

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | ✅ Yes | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | ✅ Yes | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | ✅ Yes | (generate with `openssl rand -base64 32`) |
| `NODE_ENV` | ✅ Yes | `production` |

### Step 3: Redeploy

1. Go to Vercel Dashboard → Your project
2. Click **"Deployments"**
3. Click **"Redeploy"** on the latest deployment
4. Or push a new commit to trigger auto-deploy

## 🚨 Important Notes

1. **Remove PRISMA_DATABASE_URL** (if exists)
   - If you have `PRISMA_DATABASE_URL` set to `db.prisma.io`, remove it
   - Only use `DATABASE_URL` with a direct PostgreSQL connection

2. **Connection String Format**
   - Must start with `postgresql://` or `postgres://`
   - Must include username, password, host, port, and database name
   - Example: `postgresql://user:password@host:5432/database?sslmode=require`

3. **SSL Mode**
   - For cloud databases (Supabase, Neon, Vercel Postgres), add `?sslmode=require`
   - Example: `postgresql://user:pass@host:5432/db?sslmode=require`

## ✅ Verification

After setting up, your build should:
1. ✅ Connect to database successfully
2. ✅ Run Prisma migrations
3. ✅ Build Next.js app
4. ✅ Deploy successfully

## 📝 Quick Checklist

- [ ] Created PostgreSQL database (Vercel Postgres/Supabase/Neon)
- [ ] Copied connection string
- [ ] Added `DATABASE_URL` to Vercel environment variables
- [ ] Removed old `PRISMA_DATABASE_URL` if it exists
- [ ] Ran database migrations
- [ ] Redeployed application
- [ ] Verified deployment is successful

---

**Need Help?** If you're still getting errors, check:
1. Connection string format is correct
2. Database is accessible (not paused/stopped)
3. Environment variables are saved in Vercel
4. You've redeployed after adding variables


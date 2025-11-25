# Deploy to Vercel Now - Step by Step

## Method 1: Vercel Dashboard (Easiest - 5 minutes)

### Step 1: Push to GitHub
```bash
cd /Users/laxmikanth/Documents/Bstream
git push origin main
```

### Step 2: Deploy via Dashboard
1. **Go to**: https://vercel.com/new
2. **Click**: "Import Git Repository"
3. **Select**: Your Bstream repository
4. **Configure Project**:
   - Framework: **Next.js** (auto-detected)
   - Root Directory: **web**
   - Build Command: `prisma generate && next build`
   - Install Command: `npm install`
   - Output Directory: `.next` (default)

5. **Add Environment Variables** (Click "Environment Variables"):
   - `DATABASE_URL` - (We'll get this from Vercel Postgres)
   - `NEXTAUTH_URL` - Leave empty for now (will auto-fill)
   - `NEXTAUTH_SECRET` - Run: `openssl rand -base64 32`
   - `BLOB_READ_WRITE_TOKEN` - (We'll get this from Vercel Blob)

6. **Click**: "Deploy"

### Step 3: Set Up Vercel Postgres (After First Deploy)
1. In Vercel project dashboard → **Storage** tab
2. Click **Create Database** → **Postgres**
3. Copy the connection string
4. Go to **Settings** → **Environment Variables**
5. Update `DATABASE_URL` with the Postgres connection string
6. **Redeploy** the project

### Step 4: Set Up Vercel Blob
1. In Vercel project dashboard → **Storage** tab
2. Click **Create Database** → **Blob**
3. Copy the `BLOB_READ_WRITE_TOKEN`
4. Go to **Settings** → **Environment Variables**
5. Add `BLOB_READ_WRITE_TOKEN`
6. **Redeploy** the project

### Step 5: Update Prisma Schema & Run Migrations
1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Commit and push:
   ```bash
   git add prisma/schema.prisma
   git commit -m "Update schema for PostgreSQL"
   git push
   ```
3. After Vercel redeploys, run migrations:
   ```bash
   # Get environment variables
   vercel env pull .env.local
   
   # Run migrations
   npx prisma migrate deploy
   ```

## Method 2: Vercel CLI

```bash
cd web
vercel login  # Opens browser - you're already logged in!
vercel link  # Link to existing project or create new
vercel --prod  # Deploy to production
```

## Quick Commands

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# After deployment, run migrations
vercel env pull .env.local
npx prisma migrate deploy
```

## Your Vercel Account
- Email: kanlax1712@gmail.com
- Dashboard: https://vercel.com/laxs-projects-f11bae18


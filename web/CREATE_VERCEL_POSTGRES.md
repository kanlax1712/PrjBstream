# Create Vercel Postgres Database - Step by Step

## ✅ Yes, You Need to Create Vercel Postgres!

SQLite doesn't work on Vercel, so you **must** use PostgreSQL.

## Step-by-Step Guide

### Step 1: Go to Your Vercel Project

1. Go to: https://vercel.com/dashboard
2. Click on your **PrjBstream** project (or the project name you deployed)

### Step 2: Create Postgres Database

1. In your project dashboard, click the **Storage** tab (in the top menu)
2. Click **Create Database** button
3. Select **Postgres** from the options
4. **Name it**: `bstream-db` (or any name you like)
5. **Region**: Choose closest to you (e.g., `us-east-1`)
6. Click **Create**

### Step 3: Copy Connection String

After creating, you'll see:
- Database name
- **Connection String** (this is your DATABASE_URL)

**Copy the entire connection string** - it looks like:
```
postgres://default:xxxxx@ep-xxxxx.us-east-1.postgres.vercel-storage.com:5432/verceldb
```

### Step 4: Add to Environment Variables

1. Go to **Settings** tab (in your project)
2. Click **Environment Variables** (left sidebar)
3. Click **Add New**
4. Enter:
   - **Name**: `DATABASE_URL`
   - **Value**: [Paste the connection string you copied]
   - **Environments**: Select all (Production, Preview, Development)
5. Click **Save**

### Step 5: Create Vercel Blob (For File Uploads)

1. Still in **Storage** tab
2. Click **Create Database** again
3. Select **Blob**
4. **Name it**: `bstream-blob`
5. Click **Create**
6. Copy the **BLOB_READ_WRITE_TOKEN**
7. Add to Environment Variables:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: [Paste the token]
   - **Environments**: Select all

### Step 6: Update Prisma Schema

After creating the database, update your Prisma schema:

1. Edit `web/prisma/schema.prisma`
2. Change:
   ```prisma
   datasource db {
     provider = "sqlite"    // OLD
     url      = "file:./dev.db"
   }
   ```
   
   To:
   ```prisma
   datasource db {
     provider = "postgresql"  // NEW
     url      = env("DATABASE_URL")
   }
   ```

3. Commit and push:
   ```bash
   cd /Users/laxmikanth/Documents/Bstream
   git add web/prisma/schema.prisma
   git commit -m "Update Prisma schema for PostgreSQL"
   git push origin main
   ```

### Step 7: Run Migrations

After Vercel redeploys (auto-deploys on git push):

```bash
cd web
vercel env pull .env.local
npx prisma migrate deploy
```

## Quick Checklist

- [ ] Create Vercel Postgres database
- [ ] Copy DATABASE_URL
- [ ] Add DATABASE_URL to environment variables
- [ ] Create Vercel Blob
- [ ] Copy BLOB_READ_WRITE_TOKEN
- [ ] Add BLOB_READ_WRITE_TOKEN to environment variables
- [ ] Update Prisma schema to PostgreSQL
- [ ] Commit and push schema changes
- [ ] Run migrations after redeploy

## Important Notes

1. **Vercel Postgres is free** for small projects (Hobby plan)
2. **Database is created instantly** - no waiting
3. **Connection string includes SSL** - ready to use
4. **Auto-scales** with your project
5. **Backed up automatically** by Vercel

## After Setup

Once database is created and environment variables are set:
- Vercel will automatically redeploy
- Your app will connect to PostgreSQL
- All data will be stored in the cloud database

---

**Ready? Start with Step 1!** 🚀


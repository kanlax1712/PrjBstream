# 🚀 Deploy to Vercel - START HERE

## Your Project is Ready!

All code is prepared. Follow these steps:

## Step 1: Push to GitHub (If Not Already Pushed)

```bash
cd /Users/laxmikanth/Documents/Bstream
git push origin main
```

If you get authentication errors, you can deploy directly from Vercel dashboard without pushing.

## Step 2: Deploy via Vercel Dashboard

### Option A: Import from GitHub (Recommended)

1. **Go to**: https://vercel.com/new
2. **Click**: "Import Git Repository"
3. **Select**: `kanlax1712/bstream` (your repository)
4. **Configure**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `web` ⚠️ IMPORTANT!
   - **Build Command**: `prisma generate && next build`
   - **Install Command**: `npm install`
5. **Click**: "Deploy" (we'll add env vars after)

### Option B: Deploy from Local Directory

1. **Go to**: https://vercel.com/new
2. **Click**: "Import" → "Browse" or drag the `web` folder
3. **Configure** same as above

## Step 3: After First Deploy (Even if it fails)

### A. Create Vercel Postgres

1. In your Vercel project dashboard
2. Go to **Storage** tab
3. Click **Create Database** → **Postgres**
4. Name it (e.g., "bstream-db")
5. Copy the **Connection String**

### B. Create Vercel Blob

1. In **Storage** tab
2. Click **Create Database** → **Blob**
3. Name it (e.g., "bstream-blob")
4. Copy the **BLOB_READ_WRITE_TOKEN**

### C. Add Environment Variables

Go to **Settings** → **Environment Variables** and add:

```
DATABASE_URL = [Postgres connection string from step A]
NEXTAUTH_SECRET = C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=
BLOB_READ_WRITE_TOKEN = [Token from step B]
NEXTAUTH_URL = [Your Vercel URL - auto-filled]
```

## Step 4: Update Prisma Schema for PostgreSQL

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
   git push origin main
   ```

   Vercel will auto-redeploy on push!

## Step 5: Run Database Migrations

After redeploy, run migrations:

```bash
cd web
vercel env pull .env.local
npx prisma migrate deploy
```

## Step 6: Test Your App!

Visit your Vercel URL (e.g., `https://bstream.vercel.app`)

## Troubleshooting

- **Build fails?** Check that Root Directory is set to `web`
- **Database errors?** Make sure DATABASE_URL is set correctly
- **Upload fails?** Check BLOB_READ_WRITE_TOKEN is set
- **Need help?** Check VERCEL_DEPLOYMENT.md for detailed guide

## Your Info

- **Vercel Account**: kanlax1712@gmail.com
- **GitHub Repo**: https://github.com/kanlax1712/bstream
- **NEXTAUTH_SECRET**: C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=

---

**Ready? Start with Step 1!** 🚀


# Vercel Environment Variables Setup

## Required Environment Variables

Add these in your Vercel project settings (Settings → Environment Variables):

### 1. DATABASE_URL
**Value**: Get from Vercel Postgres (after creating database)
**How to get**:
1. Go to Vercel Dashboard → Your Project → Storage
2. Create Postgres database
3. Copy the connection string
4. Format: `postgresql://user:password@host:5432/database?sslmode=require`

### 2. NEXTAUTH_URL
**Value**: Your Vercel app URL (auto-filled after first deploy)
**Example**: `https://your-app-name.vercel.app`
**Note**: Vercel will auto-fill this, but you can set it manually

### 3. NEXTAUTH_SECRET
**Value**: `C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=`
**How generated**: `openssl rand -base64 32`
**Important**: Keep this secret! Don't share it.

### 4. BLOB_READ_WRITE_TOKEN
**Value**: Get from Vercel Blob (after creating blob store)
**How to get**:
1. Go to Vercel Dashboard → Your Project → Storage
2. Create Blob database
3. Copy the `BLOB_READ_WRITE_TOKEN`

## Setup Order

1. **First Deploy** (without DATABASE_URL and BLOB token)
   - This will fail, but that's okay
   - We need the project created first

2. **Create Vercel Postgres**
   - Get DATABASE_URL
   - Add to environment variables

3. **Create Vercel Blob**
   - Get BLOB_READ_WRITE_TOKEN
   - Add to environment variables

4. **Update Prisma Schema**
   - Change to PostgreSQL
   - Commit and push

5. **Redeploy**
   - Vercel will auto-redeploy on git push
   - Or manually trigger redeploy

6. **Run Migrations**
   ```bash
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

## Quick Copy-Paste

```
NEXTAUTH_SECRET=C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=
```


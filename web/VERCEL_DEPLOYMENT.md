# Vercel Deployment Guide

This guide will help you deploy Bstream to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed (`npm i -g vercel`)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Critical Changes for Vercel

### 1. Database Migration (SQLite → PostgreSQL)

**SQLite doesn't work on Vercel** because Vercel has a read-only filesystem. You need to use PostgreSQL.

#### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to Storage → Create Database → Postgres
3. Copy the connection string
4. Update your Prisma schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

5. Run migrations:
```bash
npx prisma migrate deploy
```

#### Option B: External PostgreSQL (Supabase, Neon, etc.)

1. Create a PostgreSQL database on Supabase, Neon, or similar
2. Get the connection string
3. Update Prisma schema as above
4. Add connection string to Vercel environment variables

### 2. File Storage (Local → Vercel Blob)

**Local file storage doesn't work on Vercel.** Use Vercel Blob Storage.

#### Setup Vercel Blob

1. Install Vercel Blob:
```bash
npm install @vercel/blob
```

2. Create a Blob store in Vercel dashboard
3. Get your `BLOB_READ_WRITE_TOKEN`
4. Add to environment variables

#### Update Upload Code

The upload API route needs to be updated to use Vercel Blob instead of local filesystem. See `lib/storage.ts` for the implementation.

### 3. Environment Variables

Add these to your Vercel project settings:

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key
BLOB_READ_WRITE_TOKEN=your-blob-token
```

### 4. Build Configuration

The `package.json` has been updated with:
- `postinstall`: Runs `prisma generate` automatically
- `build`: Includes Prisma generation

The `vercel.json` configures:
- Build command with Prisma
- Function timeouts (300s for uploads)
- CORS headers

## Deployment Steps

### Step 1: Prepare Your Code

1. Commit all changes:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
```

2. Push to your repository:
```bash
git push origin main
```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure:
   - Framework Preset: Next.js
   - Root Directory: `web` (if your project is in a subdirectory)
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`
4. Add environment variables
5. Deploy

#### Option B: Via CLI

```bash
cd web
vercel login
vercel
```

Follow the prompts and add environment variables when asked.

### Step 3: Run Database Migrations

After first deployment, run migrations:

```bash
# Set DATABASE_URL in your terminal
export DATABASE_URL="your-postgres-url"

# Run migrations
npx prisma migrate deploy
```

Or use Vercel's CLI:
```bash
vercel env pull
npx prisma migrate deploy
```

### Step 4: Seed Database (Optional)

```bash
npm run db:seed
```

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables set
- [ ] Vercel Blob Storage configured
- [ ] Test video upload
- [ ] Test video playback
- [ ] Test authentication
- [ ] Check logs for errors

## Troubleshooting

### Build Fails

- Check that `prisma generate` runs in build
- Verify DATABASE_URL is set
- Check Prisma schema is correct

### Uploads Fail

- Verify BLOB_READ_WRITE_TOKEN is set
- Check file size limits (Vercel has limits)
- Review function timeout settings

### Database Connection Issues

- Verify DATABASE_URL format
- Check SSL mode (should be `?sslmode=require`)
- Ensure database allows connections from Vercel IPs

### Video Playback Issues

- Check CORS headers
- Verify video URLs are accessible
- Check blob storage permissions

## File Size Limits

- Vercel Function: 50MB request body limit
- Vercel Blob: 4.5GB per file
- Consider using direct uploads for large files

## Next Steps

1. Set up custom domain
2. Configure CDN for video delivery
3. Set up monitoring and alerts
4. Configure backup strategy


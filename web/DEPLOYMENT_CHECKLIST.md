# Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. Database Setup
- [ ] Create Vercel Postgres database (or use external PostgreSQL)
- [ ] Copy PostgreSQL connection string
- [ ] Update `prisma/schema.prisma`:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
- [ ] Run migrations: `npx prisma migrate deploy`

### 2. Vercel Blob Storage
- [ ] Create Blob store in Vercel dashboard
- [ ] Copy `BLOB_READ_WRITE_TOKEN`
- [ ] Verify `@vercel/blob` is installed: `npm install @vercel/blob`

### 3. Environment Variables
Add these in Vercel project settings:
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_URL` - Your Vercel app URL (e.g., `https://your-app.vercel.app`)
- [ ] `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- [ ] `BLOB_READ_WRITE_TOKEN` - From Vercel Blob store

### 4. Code Changes
- [x] `vercel.json` created
- [x] `next.config.ts` updated
- [x] `package.json` scripts updated
- [x] Storage utility created (`lib/storage.ts`)
- [x] Upload API updated to use storage utility
- [x] Delete video updated to use storage utility

## Deployment Steps

### Step 1: Commit and Push
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Deploy to Vercel

#### Option A: Via Dashboard
1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure:
   - Framework: Next.js
   - Root Directory: `web` (if project is in subdirectory)
   - Build Command: `prisma generate && next build`
   - Install Command: `npm install`
4. Add all environment variables
5. Click Deploy

#### Option B: Via CLI
```bash
cd web
vercel login
vercel
# Follow prompts and add environment variables
```

### Step 3: Run Database Migrations
After first deployment:
```bash
# Set DATABASE_URL
export DATABASE_URL="your-postgres-url"

# Run migrations
npx prisma migrate deploy
```

Or use Vercel CLI:
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### Step 4: Seed Database (Optional)
```bash
npm run db:seed
```

## Post-Deployment Verification

- [ ] Home page loads
- [ ] User can register/login
- [ ] Video upload works
- [ ] Video playback works
- [ ] Thumbnails display correctly
- [ ] Ads show correctly
- [ ] No console errors
- [ ] Check Vercel function logs for errors

## Troubleshooting

### Build Fails
- Check Prisma generation in build logs
- Verify DATABASE_URL is set
- Check for TypeScript errors

### Uploads Fail
- Verify BLOB_READ_WRITE_TOKEN is set
- Check function timeout (should be 300s)
- Review Vercel function logs

### Database Connection Issues
- Verify DATABASE_URL format
- Check SSL mode (`?sslmode=require`)
- Ensure database allows Vercel IPs

### Video Playback Issues
- Check CORS headers in vercel.json
- Verify blob URLs are accessible
- Check video streaming API route

## Quick Deploy Command

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables in Vercel dashboard

# 3. Deploy
vercel --prod

# 4. Run migrations
vercel env pull .env.local
npx prisma migrate deploy
```

## Notes

- File uploads automatically use Vercel Blob in production
- Local filesystem is used in development
- Database migrations must be run after deployment
- Consider setting up a staging environment for testing


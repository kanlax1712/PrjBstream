# Quick Vercel Deployment Guide

## Option 1: Deploy via Vercel Dashboard (Easiest)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your repository (or connect GitHub/GitLab/Bitbucket)
4. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: **web** (if your project is in a subdirectory)
   - Build Command: `prisma generate && next build`
   - Install Command: `npm install`
5. Add Environment Variables:
   - `DATABASE_URL` - (We'll set up Vercel Postgres next)
   - `NEXTAUTH_URL` - Your Vercel URL (will be provided)
   - `NEXTAUTH_SECRET` - Generate: `openssl rand -base64 32`
   - `BLOB_READ_WRITE_TOKEN` - (We'll create Blob store next)
6. Click Deploy

## Option 2: Deploy via CLI

```bash
cd web
vercel login
vercel
```

## Important: Before First Deployment

### 1. Set Up Vercel Postgres
1. In Vercel dashboard, go to your project
2. Go to Storage → Create Database → Postgres
3. Copy the connection string
4. Add as `DATABASE_URL` environment variable

### 2. Update Prisma Schema
Before deploying, update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Set Up Vercel Blob
1. In Vercel dashboard, go to Storage → Create Database → Blob
2. Copy the `BLOB_READ_WRITE_TOKEN`
3. Add as environment variable

### 4. After First Deployment
Run migrations:
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

## Current Status
✅ All code is ready for deployment
✅ Storage utility configured
✅ Build scripts updated
⏳ Need to: Set up database and deploy


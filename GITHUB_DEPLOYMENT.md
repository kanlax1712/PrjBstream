# GitHub & Netlify Deployment Guide

## Step 1: Initialize Git Repository

```bash
cd /Users/laxmikanth/Documents/Bstream

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Bstream video streaming platform"
```

## Step 2: Create GitHub Repository

### Option A: Using GitHub Website

1. Go to https://github.com/new
2. Repository name: `bstream` (or your preferred name)
3. Description: "Video streaming platform built with Next.js"
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### Option B: Using GitHub CLI

```bash
# Install GitHub CLI if not installed
brew install gh

# Login to GitHub
gh auth login

# Create repository
gh repo create bstream --public --source=. --remote=origin --push
```

## Step 3: Connect Local Repository to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/bstream.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 4: Deploy to Netlify

### Option A: Connect via Netlify Dashboard

1. **Go to Netlify**: https://app.netlify.com
2. **Sign up/Login** with your GitHub account
3. **Click "Add new site"** → **"Import an existing project"**
4. **Choose "GitHub"** and authorize Netlify
5. **Select your repository**: `bstream`
6. **Configure build settings**:
   - **Base directory**: `web`
   - **Build command**: `npm install && npx prisma generate && npm run build`
   - **Publish directory**: `web/.next`
   - **Node version**: `20`

7. **Set Environment Variables**:
   Click "Environment variables" and add:
   ```
   DATABASE_URL=your_postgresql_connection_string
   NEXTAUTH_URL=https://your-site-name.netlify.app
   NEXTAUTH_SECRET=your-secret-key-min-32-chars
   NODE_ENV=production
   ```

8. **Click "Deploy site"**

### Option B: Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
cd web
netlify init

# Follow prompts:
# - Create & configure a new site
# - Team: Select your team
# - Site name: bstream (or your choice)
# - Build command: npm run build
# - Directory to deploy: .next

# Deploy
netlify deploy --prod
```

## Step 5: Configure Database for Production

### Option 1: Use Netlify Postgres (Recommended)

1. In Netlify Dashboard → **Add-ons** → **Postgres**
2. Click **"Install Postgres"**
3. Copy the connection string
4. Add to Environment Variables as `DATABASE_URL`

### Option 2: Use External Database

**Recommended Services**:
- **Supabase** (Free tier available): https://supabase.com
- **Neon** (Free tier): https://neon.tech
- **Railway** (Free tier): https://railway.app
- **PlanetScale** (Free tier): https://planetscale.com

**Steps**:
1. Create PostgreSQL database
2. Get connection string
3. Add to Netlify Environment Variables

### Option 3: Use Supabase (Easiest)

1. Go to https://supabase.com
2. Create new project
3. Go to **Settings** → **Database**
4. Copy **Connection string** (URI format)
5. Add to Netlify as `DATABASE_URL`

## Step 6: Update Prisma for PostgreSQL

```bash
cd web

# Update prisma/schema.prisma
# Change datasource to:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# Create migration
npx prisma migrate dev --name migrate_to_postgres

# Generate Prisma Client
npx prisma generate
```

## Step 7: Run Database Migrations

### On Netlify (Build Hook)

Add to build command:
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

### Or Use Netlify Functions

Create `netlify/functions/migrate.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler = async () => {
  try {
    // Run migrations
    // This would typically be done via build hook or manually
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Migrations complete' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Migration failed' }),
    };
  }
};
```

## Step 8: Configure File Storage

### Option 1: Netlify Large Media (for images)

1. Enable Netlify Large Media
2. Configure in `netlify.toml`

### Option 2: Cloud Storage (Recommended for videos)

**AWS S3**:
1. Create S3 bucket
2. Get access keys
3. Add to Netlify Environment Variables:
   ```
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   ```

**Cloudflare R2**:
1. Create R2 bucket
2. Get API tokens
3. Add to environment variables

## Step 9: Update Environment Variables

In Netlify Dashboard → Site settings → Environment variables:

**Required**:
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NEXTAUTH_URL=https://your-site.netlify.app
NEXTAUTH_SECRET=generate-strong-secret-here
NODE_ENV=production
```

**Optional** (for file storage):
```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...
```

## Step 10: Custom Domain (Optional)

1. In Netlify Dashboard → **Domain settings**
2. Click **"Add custom domain"**
3. Enter your domain
4. Follow DNS configuration instructions
5. Update `NEXTAUTH_URL` to your custom domain

## Troubleshooting

### Build Fails

**Check**:
- Environment variables are set
- Database connection string is correct
- Node version is 20
- Build logs in Netlify dashboard

### Database Connection Error

**Solutions**:
- Verify `DATABASE_URL` is correct
- Check database allows connections from Netlify IPs
- Ensure database is accessible (not localhost)

### Prisma Client Errors

**Solution**:
- Ensure `npx prisma generate` runs in build
- Check Prisma schema is correct
- Verify database migrations are applied

### File Upload Issues

**Solution**:
- Use cloud storage (S3, R2) instead of local filesystem
- Update upload handlers to use cloud storage
- Configure CORS if needed

## Quick Deploy Checklist

- [ ] Git repository created and pushed to GitHub
- [ ] Netlify account created
- [ ] Site connected to GitHub repository
- [ ] Build settings configured (base: `web`, build: `npm run build`)
- [ ] Environment variables set
- [ ] PostgreSQL database created
- [ ] Prisma schema updated for PostgreSQL
- [ ] Database migrations run
- [ ] File storage configured (cloud storage)
- [ ] Site deployed successfully
- [ ] Test registration/login
- [ ] Test video upload
- [ ] Custom domain configured (optional)

## Post-Deployment

1. **Test all features**:
   - User registration
   - Login
   - Video upload
   - Search
   - Comments
   - Subscriptions

2. **Monitor**:
   - Netlify dashboard for build status
   - Function logs for errors
   - Database connection

3. **Optimize**:
   - Enable Netlify Analytics
   - Configure caching
   - Set up CDN for videos

## Support

- **Netlify Docs**: https://docs.netlify.com
- **Next.js on Netlify**: https://docs.netlify.com/integrations/frameworks/nextjs
- **Prisma with Netlify**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-netlify

---

**Ready to deploy!** Follow the steps above to get your Bstream platform live on Netlify.


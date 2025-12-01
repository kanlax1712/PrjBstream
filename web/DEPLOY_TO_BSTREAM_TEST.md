# Deploy to bstream_test Project in Vercel

## 🎯 Goal
Deploy all latest changes to the `bstream_test` project in Vercel

## ✅ Prerequisites
- ✅ All code pushed to GitHub: `https://github.com/kanlax1712/PrjBstream`
- ✅ Latest commit: `ebd19a8` (Trigger fresh Vercel deployment)
- ✅ All changes committed and pushed

## 🚀 Deployment Steps

### Step 1: Access Vercel Dashboard

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Find your project: **bstream_test**
3. Click on it to open

### Step 2: Verify Project Settings

Go to **Settings** → **General** and verify:

- **Project Name**: `bstream_test`
- **Framework Preset**: Next.js (should auto-detect)
- **Root Directory**: `web` ⚠️ **IMPORTANT**
- **Build Command**: `npm run build` (or leave default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### Step 3: Verify Git Connection

Go to **Settings** → **Git** and verify:

- **Repository**: `kanlax1712/PrjBstream`
- **Production Branch**: `main`
- **Root Directory**: `web` ⚠️ **IMPORTANT**

If not connected:
1. Click **Connect Git Repository**
2. Select `kanlax1712/PrjBstream`
3. Select branch: `main`
4. Set **Root Directory**: `web`
5. Click **Deploy**

### Step 4: Set Environment Variables

Go to **Settings** → **Environment Variables**

Add these for **ALL environments** (Production, Preview, Development):

```bash
# Database - Prisma Accelerate
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19xUXh2UVl6QkVBTmdBcHVCWUJBNmwiLCJhcGlfa2V5IjoiMDFLQVhKQldOUzRaTTVYQldQMFMxTjRONEQiLCJ0ZW5hbnRfaWQiOiJmZGViZDM0MjZkYjUyYjM1OWIwNTc2MjA1MzcwMzE0NWIxMzgyZmYwMWU1Zjg0ZTgzYzlmNzUyZGU4YjRmYmRhIiwiaW50ZXJuYWxfc2VjcmV0IjoiNmEwNjA3MWYtYzhlNi00ZTg5LTg4ZTUtMWQ0ZWU1N2Y2YTI3In0._bxfe0YzE94TJO80cOWdMESXQSMZBr4xbjobi0LlI40

# Authentication
NEXTAUTH_SECRET=C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=
NEXTAUTH_URL=https://bstream-test.vercel.app

# Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_7kLo45hhew31UmqJ_hG4OB9VshZQunXU9Cuvq54veEcUjEj

# Optional: Prisma Accelerate (same as DATABASE_URL)
PRISMA_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19xUXh2UVl6QkVBTmdBcHVCWUJBNmwiLCJhcGlfa2V5IjoiMDFLQVhKQldOUzRaTTVYQldQMFMxTjRONEQiLCJ0ZW5hbnRfaWQiOiJmZGViZDM0MjZkYjUyYjM1OWIwNTc2MjA1MzcwMzE0NWIxMzgyZmYwMWU1Zjg0ZTgzYzlmNzUyZGU4YjRmYmRhIiwiaW50ZXJuYWxfc2VjcmV0IjoiNmEwNjA3MWYtYzhlNi00ZTg5LTg4ZTUtMWQ0ZWU1N2Y2YTI3In0._bxfe0YzE94TJO80cOWdMESXQSMZBr4xbjobi0LlI40
```

**Important**: 
- Update `NEXTAUTH_URL` to your actual `bstream_test` domain after first deployment
- Make sure to select **all environments** (Production ✅ Preview ✅ Development ✅)

### Step 5: Deploy

**Option A: Manual Redeploy (Recommended for Fresh Deploy)**

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **three dots** (⋯) menu
4. Click **Redeploy**
5. **Uncheck** "Use existing Build Cache" (for fresh build)
6. Click **Redeploy**

**Option B: Trigger from Latest Commit**

If Vercel is connected to GitHub:
1. The latest commit (`ebd19a8`) should trigger auto-deployment
2. Check **Deployments** tab for new deployment
3. If not triggered, use Option A

**Option C: Create New Deployment**

1. Go to **Deployments** tab
2. Click **Create Deployment**
3. Select branch: `main`
4. Click **Deploy**

### Step 6: Monitor Deployment

Watch the build process:

1. **Build Phase**:
   - ✅ Installing dependencies
   - ✅ Running `prisma generate`
   - ✅ Running `next build`
   - ✅ Build completes

2. **Deploy Phase**:
   - ✅ Deployment ready
   - ✅ Domain active

3. **Check Logs**:
   - No database connection errors
   - No build errors
   - All steps complete successfully

### Step 7: Post-Deployment

After deployment completes:

1. **Update NEXTAUTH_URL**:
   - Go to **Settings** → **Environment Variables**
   - Update `NEXTAUTH_URL` to your actual domain
   - Example: `https://bstream-test-xxxxx.vercel.app`
   - Redeploy

2. **Test Application**:
   - Visit your Vercel domain
   - Test login
   - Test video upload
   - Test GoLive feature
   - Test all major features

3. **Check Runtime Logs**:
   - Go to **Deployments** → Click on deployment → **Logs**
   - Verify no runtime errors

## 🔧 Troubleshooting

### Build Fails

**Error**: "Cannot find module" or "Prisma Client not generated"
- **Solution**: Verify `postinstall` script runs: `prisma generate`
- Check build logs for Prisma generation step

**Error**: "Database connection failed"
- **Solution**: Verify `DATABASE_URL` is set correctly
- Check Prisma Accelerate is active

### Deployment Succeeds but App Doesn't Work

**Error**: "500 Internal Server Error"
- **Solution**: Check runtime logs
- Verify all environment variables are set
- Check database connection

**Error**: "Authentication not working"
- **Solution**: Verify `NEXTAUTH_URL` matches your domain
- Check `NEXTAUTH_SECRET` is set

### Root Directory Issues

**Error**: "Cannot find package.json" or "Build failed"
- **Solution**: Set **Root Directory** to `web` in project settings
- This is critical!

## ✅ Verification Checklist

After deployment:

- [ ] Build completes successfully
- [ ] No errors in build logs
- [ ] Application loads on Vercel domain
- [ ] Login works
- [ ] Database connection works
- [ ] Video upload works
- [ ] GoLive feature works
- [ ] All features functional

## 📝 Quick Reference

**Project**: `bstream_test`  
**Repository**: `kanlax1712/PrjBstream`  
**Branch**: `main`  
**Root Directory**: `web` ⚠️ **CRITICAL**  
**Latest Commit**: `ebd19a8`

---

**Ready to deploy!** Follow the steps above to deploy all changes to `bstream_test` project. 🚀


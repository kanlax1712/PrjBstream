# Vercel Project Settings Configuration

## ⚠️ Important: Root Directory Configuration

The `rootDirectory` property is **NOT** valid in `vercel.json`. It must be configured in the Vercel Dashboard.

## ✅ Required Settings in Vercel Dashboard

### Step 1: Configure Root Directory

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **General**
3. Scroll to **Root Directory**
4. Set it to: `web`
5. Click **Save**

### Step 2: Configure Build Settings

1. Go to **Settings** → **Build & Development Settings**
2. Set **Framework Preset**: `Next.js`
3. Set **Root Directory**: `web`
4. Set **Build Command**: 
   ```
   prisma generate && (prisma db push --skip-generate || true) && next build
   ```
5. Set **Output Directory**: `.next` (or leave default)
6. Set **Install Command**: `npm install`
7. Click **Save**

### Step 3: Configure Regions (Optional)

1. Go to **Settings** → **General**
2. Scroll to **Regions**
3. Select: `Washington, D.C., USA (iad1)` or your preferred region
4. Click **Save**

## 📝 What's in vercel.json

The `vercel.json` file now only contains:
- ✅ `functions` - API route configurations (maxDuration, memory)
- ✅ `headers` - CORS headers for API routes
- ✅ `$schema` - Schema validation for autocomplete

**Removed** (must be set in Dashboard):
- ❌ `rootDirectory` - Set in Dashboard → Settings → General
- ❌ `buildCommand` - Set in Dashboard → Settings → Build
- ❌ `devCommand` - Not needed for production
- ❌ `installCommand` - Set in Dashboard → Settings → Build
- ❌ `framework` - Set in Dashboard → Settings → Build
- ❌ `regions` - Set in Dashboard → Settings → General

## ✅ Verification

After configuring in the Dashboard:
1. ✅ Root Directory is set to `web`
2. ✅ Build Command includes Prisma generate
3. ✅ Framework is set to Next.js
4. ✅ All environment variables are set
5. ✅ Redeploy the application

---

**Note**: The `vercel.json` file is now valid and will pass schema validation. All project-level settings should be configured in the Vercel Dashboard.


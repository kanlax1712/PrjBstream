# ⚠️ CRITICAL: Add Environment Variables to Vercel

## The Build is Failing Because DATABASE_URL is Missing!

The error shows:
```
Error: Environment variable not found: DATABASE_URL
```

## ✅ SOLUTION: Add Environment Variables in Vercel Dashboard

### Step 1: Go to Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Click on your **bstream** project (or your project name)

### Step 2: Add Environment Variables
1. Click **Settings** tab
2. Click **Environment Variables** (left sidebar)
3. Add these 4 variables:

#### Variable 1: DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: 
  ```
  postgres://fdebd3426db52b359b05762053703145b1382ff01e5f84e83c9f752de8b4fbda:sk_qQxvQYzBEANgApuBYBA6l@db.prisma.io:5432/postgres?sslmode=require
  ```
- **Environments**: ✅ Production, ✅ Preview, ✅ Development (SELECT ALL!)

#### Variable 2: NEXTAUTH_SECRET
- **Name**: `NEXTAUTH_SECRET`
- **Value**: `C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=`
- **Environments**: ✅ All

#### Variable 3: NEXTAUTH_URL
- **Name**: `NEXTAUTH_URL`
- **Value**: `https://bstream.vercel.app`
- **Environments**: ✅ All

#### Variable 4: BLOB_READ_WRITE_TOKEN
- **Name**: `BLOB_READ_WRITE_TOKEN`
- **Value**: `vercel_blob_rw_7kLo45hhew31UmqJ_hG4OB9VshZQunXU9Cuvq54veEcUjEj`
- **Environments**: ✅ All

### Step 3: Redeploy
After adding all variables:
1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**

Or push a new commit to trigger auto-redeploy.

---

## ⚠️ IMPORTANT: Select All Environments!

When adding each variable, make sure to check:
- ✅ Production
- ✅ Preview  
- ✅ Development

This ensures the variables are available during build time!

---

## Quick Copy-Paste

```
DATABASE_URL=postgres://fdebd3426db52b359b05762053703145b1382ff01e5f84e83c9f752de8b4fbda:sk_qQxvQYzBEANgApuBYBA6l@db.prisma.io:5432/postgres?sslmode=require
NEXTAUTH_SECRET=C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=
NEXTAUTH_URL=https://bstream.vercel.app
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_7kLo45hhew31UmqJ_hG4OB9VshZQunXU9Cuvq54veEcUjEj
```

---

**After adding these variables, the build will succeed!** ✅


# 🔐 Vercel Environment Variables - Complete Guide

## Required Environment Variables

Add these in your Vercel project: **Settings → Environment Variables**

---

## 1. DATABASE_URL ⚠️ REQUIRED

**Purpose**: PostgreSQL database connection string for your app

**How to Get**:
1. Go to Vercel Dashboard → Your Project
2. Click **Storage** tab
3. Click **Create Database** → **Postgres**
4. Name it: `bstream-db` (or any name)
5. Copy the **Connection String** (it looks like this):
   ```
   postgres://default:xxxxx@ep-xxxxx.us-east-1.postgres.vercel-storage.com:5432/verceldb
   ```

**Format**: 
```
postgresql://user:password@host:5432/database?sslmode=require
```

**Add to Vercel**:
- **Name**: `DATABASE_URL`
- **Value**: [Paste the connection string from Vercel Postgres]
- **Environment**: Production, Preview, Development (select all)

---

## 2. NEXTAUTH_SECRET ⚠️ REQUIRED

**Purpose**: Secret key for NextAuth.js session encryption

**Value** (Use this one - already generated):
```
C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=
```

**Or Generate New** (if you want):
```bash
openssl rand -base64 32
```

**Add to Vercel**:
- **Name**: `NEXTAUTH_SECRET`
- **Value**: `C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=`
- **Environment**: Production, Preview, Development (select all)

---

## 3. NEXTAUTH_URL ⚠️ REQUIRED

**Purpose**: Your app's public URL for NextAuth callbacks

**Value**: Your Vercel deployment URL
- **Format**: `https://your-app-name.vercel.app`
- **Example**: `https://prjbstream.vercel.app`

**Note**: 
- Vercel may auto-fill this after first deploy
- You can set it manually: `https://[your-project-name].vercel.app`

**Add to Vercel**:
- **Name**: `NEXTAUTH_URL`
- **Value**: `https://your-project-name.vercel.app` (replace with your actual URL)
- **Environment**: Production, Preview, Development (select all)

---

## 4. BLOB_READ_WRITE_TOKEN ⚠️ REQUIRED

**Purpose**: Token for Vercel Blob Storage (file uploads)

**How to Get**:
1. Go to Vercel Dashboard → Your Project
2. Click **Storage** tab
3. Click **Create Database** → **Blob**
4. Name it: `bstream-blob` (or any name)
5. Copy the **BLOB_READ_WRITE_TOKEN**

**Format**: 
```
vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Add to Vercel**:
- **Name**: `BLOB_READ_WRITE_TOKEN`
- **Value**: [Paste the token from Vercel Blob]
- **Environment**: Production, Preview, Development (select all)

---

## 📋 Quick Setup Checklist

### Step 1: First Deploy (Without Database)
- [ ] Deploy to Vercel (will fail, that's okay)
- [ ] Note your Vercel URL (e.g., `https://prjbstream.vercel.app`)

### Step 2: Create Vercel Postgres
- [ ] Go to Storage → Create Postgres
- [ ] Copy DATABASE_URL
- [ ] Add to Environment Variables

### Step 3: Create Vercel Blob
- [ ] Go to Storage → Create Blob
- [ ] Copy BLOB_READ_WRITE_TOKEN
- [ ] Add to Environment Variables

### Step 4: Add All Environment Variables
- [ ] `DATABASE_URL` = [from Postgres]
- [ ] `NEXTAUTH_SECRET` = `C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=`
- [ ] `NEXTAUTH_URL` = `https://your-project.vercel.app`
- [ ] `BLOB_READ_WRITE_TOKEN` = [from Blob]

### Step 5: Update Prisma Schema
- [ ] Change `provider = "sqlite"` to `provider = "postgresql"`
- [ ] Commit and push to GitHub
- [ ] Vercel will auto-redeploy

### Step 6: Run Migrations
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

---

## 🎯 Copy-Paste Ready Values

Use these exact values (except DATABASE_URL and BLOB token - get from Vercel):

```
DATABASE_URL=postgresql://[get-from-vercel-postgres]
NEXTAUTH_SECRET=C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=
NEXTAUTH_URL=https://your-project-name.vercel.app
BLOB_READ_WRITE_TOKEN=[get-from-vercel-blob]
```

---

## 📝 Step-by-Step: Adding to Vercel

1. **Go to**: https://vercel.com/dashboard
2. **Select**: Your project (PrjBstream)
3. **Click**: Settings tab
4. **Click**: Environment Variables (left sidebar)
5. **For each variable**:
   - Click "Add New"
   - Enter Name (e.g., `DATABASE_URL`)
   - Enter Value
   - Select environments (Production, Preview, Development)
   - Click "Save"
6. **Redeploy**: Go to Deployments → Click "..." → Redeploy

---

## ⚠️ Important Notes

1. **DATABASE_URL** and **BLOB_READ_WRITE_TOKEN** must be created in Vercel Storage first
2. **NEXTAUTH_URL** should match your actual Vercel domain
3. All variables should be added to **all environments** (Production, Preview, Development)
4. After adding variables, **redeploy** your project
5. **Never commit** these values to GitHub (they're secrets!)

---

## 🔍 Verify Variables Are Set

After adding, verify in Vercel:
- Settings → Environment Variables
- You should see all 4 variables listed
- Each should have a green checkmark

---

## 🆘 Troubleshooting

**Build fails with "DATABASE_URL not found"**:
- Make sure you added DATABASE_URL to environment variables
- Check it's set for the correct environment

**Upload fails**:
- Verify BLOB_READ_WRITE_TOKEN is set
- Check token is correct (no extra spaces)

**Authentication fails**:
- Check NEXTAUTH_URL matches your Vercel domain
- Verify NEXTAUTH_SECRET is set correctly

---

**Ready to add these? Follow the checklist above!** ✅


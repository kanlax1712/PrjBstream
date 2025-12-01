# Update Vercel DATABASE_URL to Fix Connection Issues

## 🔴 Current Problem

Your Vercel `DATABASE_URL` is set to:
```
postgres://...@db.prisma.io:5432/postgres
```

This direct endpoint is **not working** and causing connection errors.

## ✅ Solution

Update `DATABASE_URL` in Vercel to use your `PRISMA_DATABASE_URL` value (Prisma Accelerate with `prisma+postgres://` protocol).

## 📝 Step-by-Step Instructions

### Step 1: Get Your Prisma Accelerate URL

Your `PRISMA_DATABASE_URL` value is:
```
prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19xUXh2UVl6QkVBTmdBcHVCWUJBNmwiLCJhcGlfa2V5IjoiMDFLQVhKQldOUzRaTTVYQldQMFMxTjRONEQiLCJ0ZW5hbnRfaWQiOiJmZGViZDM0MjZkYjUyYjM1OWIwNTc2MjA1MzcwMzE0NWIxMzgyZmYwMWU1Zjg0ZTgzYzlmNzUyZGU4YjRmYmRhIiwiaW50ZXJuYWxfc2VjcmV0IjoiNmEwNjA3MWYtYzhlNi00ZTg5LTg4ZTUtMWQ0ZWU1N2Y2YTI3In0._bxfe0YzE94TJO80cOWdMESXQSMZBr4xbjobi0LlI40
```

### Step 2: Update DATABASE_URL in Vercel

1. **Go to Vercel Dashboard**:
   - Visit: https://vercel.com/dashboard
   - Click on your project: `bstreamtest` (or your project name)

2. **Navigate to Environment Variables**:
   - Click **Settings** (top menu)
   - Click **Environment Variables** (left sidebar)

3. **Find and Edit DATABASE_URL**:
   - Look for `DATABASE_URL` in the list
   - Click the **pencil icon** (edit) next to it
   - **Replace** the current value with your `PRISMA_DATABASE_URL`:
     ```
     prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19xUXh2UVl6QkVBTmdBcHVCWUJBNmwiLCJhcGlfa2V5IjoiMDFLQVhKQldOUzRaTTVYQldQMFMxTjRONEQiLCJ0ZW5hbnRfaWQiOiJmZGViZDM0MjZkYjUyYjM1OWIwNTc2MjA1MzcwMzE0NWIxMzgyZmYwMWU1Zjg0ZTgzYzlmNzUyZGU4YjRmYmRhIiwiaW50ZXJuYWxfc2VjcmV0IjoiNmEwNjA3MWYtYzhlNi00ZTg5LTg4ZTUtMWQ0ZWU1N2Y2YTI3In0._bxfe0YzE94TJO80cOWdMESXQSMZBr4xbjobi0LlI40
     ```
   - **Important**: Make sure it's set for **all environments**:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Click **Save**

### Step 3: Verify Environment Variables

After updating, your Vercel environment variables should be:

| Variable | Value | Status |
|----------|-------|--------|
| `DATABASE_URL` | `prisma+postgres://accelerate.prisma-data.net/?api_key=...` | ✅ Updated |
| `PRISMA_DATABASE_URL` | `prisma+postgres://accelerate.prisma-data.net/?api_key=...` | ✅ Same value |
| `POSTGRES_URL` | (can be removed or kept) | ⚠️ Optional |
| `NEXTAUTH_SECRET` | `C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=` | ✅ OK |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_...` | ✅ OK |

### Step 4: Redeploy

1. **Go to Deployments**:
   - Click **Deployments** tab
   - Find the latest deployment
   - Click the **three dots** (⋯) menu
   - Click **Redeploy**
   - Or push a new commit to trigger auto-deploy

2. **Monitor the Build**:
   - Watch the build logs
   - Check for any errors
   - Should see: "✅ Successfully connected to database"

### Step 5: Verify It's Working

After redeployment, check:

1. **Vercel Logs**:
   - Go to **Logs** tab
   - Look for database connection errors
   - Should see successful queries

2. **Test Your App**:
   - Visit your Vercel URL
   - Try logging in
   - Try viewing videos
   - Check `/studio` page
   - All should work without database errors

## 🔍 Quick Verification Checklist

- [ ] `DATABASE_URL` updated in Vercel
- [ ] Value uses `prisma+postgres://` protocol
- [ ] Set for all environments (Production, Preview, Development)
- [ ] Application redeployed
- [ ] No database connection errors in logs
- [ ] App is working correctly

## 🚨 If It Still Doesn't Work

### Option 1: Remove POSTGRES_URL

If `POSTGRES_URL` is set to the old `db.prisma.io` value, remove it or update it:

1. Go to Environment Variables
2. Find `POSTGRES_URL`
3. Either:
   - **Delete it** (recommended), OR
   - **Update it** to the same Prisma Accelerate URL

### Option 2: Check Prisma Accelerate Status

1. Go to [Prisma Accelerate Dashboard](https://accelerate.prisma.io/)
2. Check if your project is active
3. Verify the API key is valid
4. Check connection metrics

### Option 3: Use Direct PostgreSQL

If Prisma Accelerate continues to have issues:

1. **Get a Supabase/Neon/Vercel Postgres connection string**
2. **Update `DATABASE_URL`** in Vercel with the direct PostgreSQL URL
3. **Format**: `postgresql://user:password@host:5432/database?sslmode=require`

## 📊 Expected Results After Fix

- ✅ No more "Can't reach database server" errors
- ✅ No more connection pool timeout errors
- ✅ All routes return 200 (success)
- ✅ Login works
- ✅ Video pages load
- ✅ Database queries succeed

---

**Need Help?** After updating, run `npm run db:verify` locally to confirm the URL format is correct!


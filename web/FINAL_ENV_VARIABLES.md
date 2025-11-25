# Final Environment Variables Setup

## ✅ Vercel Auto-Created Variables

Vercel automatically created these (you don't need to add them manually):
- `bstream_storage_PRISMA_DATABASE_URL`
- `bstream_storage_POSTGRES_URL`
- `bstream_storage_DATABASE_URL` (if it exists)

## ⚠️ Required: Add These Variables Manually

Prisma expects `DATABASE_URL` (not `bstream_storage_DATABASE_URL`), so add this:

### 1. DATABASE_URL ⚠️ REQUIRED

**Name**: `DATABASE_URL`
**Value**: 
```
postgres://fdebd3426db52b359b05762053703145b1382ff01e5f84e83c9f752de8b4fbda:sk_qQxvQYzBEANgApuBYBA6l@db.prisma.io:5432/postgres?sslmode=require
```
**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 2. NEXTAUTH_SECRET ⚠️ REQUIRED

**Name**: `NEXTAUTH_SECRET`
**Value**: 
```
C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=
```
**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 3. NEXTAUTH_URL ⚠️ REQUIRED

**Name**: `NEXTAUTH_URL`
**Value**: 
```
https://your-project-name.vercel.app
```
**Note**: Replace `your-project-name` with your actual Vercel project name
**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

### 4. BLOB_READ_WRITE_TOKEN ⚠️ REQUIRED

**Name**: `BLOB_READ_WRITE_TOKEN`
**Value**: 
```
vercel_blob_rw_7kLo45hhew31UmqJ_hG4OB9VshZQunXU9Cuvq54veEcUjEj
```
**Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 📋 Quick Copy-Paste for Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these 4 variables:

```
DATABASE_URL=postgres://fdebd3426db52b359b05762053703145b1382ff01e5f84e83c9f752de8b4fbda:sk_qQxvQYzBEANgApuBYBA6l@db.prisma.io:5432/postgres?sslmode=require

NEXTAUTH_SECRET=C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=

NEXTAUTH_URL=https://your-project-name.vercel.app

BLOB_READ_WRITE_TOKEN=vercel_blob_rw_7kLo45hhew31UmqJ_hG4OB9VshZQunXU9Cuvq54veEcUjEj
```

**Important**: Replace `your-project-name` in NEXTAUTH_URL with your actual Vercel project name!

---

## ✅ After Adding Variables

1. **Redeploy**: Go to Deployments → Click "..." → Redeploy
2. **Or**: Push Prisma schema changes to trigger auto-redeploy
3. **Run Migrations**: After redeploy completes

---

## 🚀 Next Steps

1. ✅ Add all 4 environment variables above
2. ✅ Update Prisma schema (already done - just need to push)
3. ✅ Commit and push schema changes
4. ✅ Run migrations after redeploy

---

**Ready? Add these variables to Vercel now!** 🎯


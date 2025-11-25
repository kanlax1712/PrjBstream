# Database Setup - Next Steps

## ✅ Database Created Successfully!

You have **Prisma Postgres** set up with these connection strings:

### Use This One: DATABASE_URL

```
postgres://fdebd3426db52b359b05762053703145b1382ff01e5f84e83c9f752de8b4fbda:sk_qQxvQYzBEANgApuBYBA6l@db.prisma.io:5432/postgres?sslmode=require
```

### Optional: PRISMA_DATABASE_URL (For Better Performance)

This is for **Prisma Accelerate** (connection pooling):
```
prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note**: You can use this later for better performance, but `DATABASE_URL` works fine for now.

---

## Step 1: Add to Vercel Environment Variables

1. Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Click **"Add New"**
3. Add these variables:

### Variable 1: DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: 
  ```
  postgres://fdebd3426db52b359b05762053703145b1382ff01e5f84e83c9f752de8b4fbda:sk_qQxvQYzBEANgApuBYBA6l@db.prisma.io:5432/postgres?sslmode=require
  ```
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### Variable 2: NEXTAUTH_SECRET
- **Name**: `NEXTAUTH_SECRET`
- **Value**: `C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=`
- **Environments**: ✅ All

### Variable 3: NEXTAUTH_URL
- **Name**: `NEXTAUTH_URL`
- **Value**: `https://your-project-name.vercel.app` (replace with your actual Vercel URL)
- **Environments**: ✅ All

### Variable 4: BLOB_READ_WRITE_TOKEN
- **Name**: `BLOB_READ_WRITE_TOKEN`
- **Value**: [Get from Vercel Blob - create it in Storage tab]
- **Environments**: ✅ All

---

## Step 2: Create Vercel Blob (For File Uploads)

1. Still in **Storage** tab
2. Click **"Create Database"** again
3. Select **"Blob"**
4. Name it: `bstream-blob`
5. Copy the **BLOB_READ_WRITE_TOKEN**
6. Add to Environment Variables (as shown above)

---

## Step 3: Update Prisma Schema

Now update your Prisma schema to use PostgreSQL:

1. Edit: `web/prisma/schema.prisma`
2. Change from SQLite to PostgreSQL:

**Before:**
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**After:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Save the file

---

## Step 4: Commit and Push Schema Changes

```bash
cd /Users/laxmikanth/Documents/Bstream
git add web/prisma/schema.prisma
git commit -m "Update Prisma schema for PostgreSQL"
git push origin main
```

Vercel will automatically redeploy when you push!

---

## Step 5: Run Database Migrations

After Vercel redeploys, run migrations:

```bash
cd web
vercel env pull .env.local
npx prisma migrate deploy
```

---

## Checklist

- [x] Prisma Postgres database created
- [ ] DATABASE_URL added to Vercel environment variables
- [ ] NEXTAUTH_SECRET added
- [ ] NEXTAUTH_URL added
- [ ] Vercel Blob created
- [ ] BLOB_READ_WRITE_TOKEN added
- [ ] Prisma schema updated to PostgreSQL
- [ ] Schema changes committed and pushed
- [ ] Migrations run after redeploy

---

## What's Next?

1. Add all environment variables to Vercel
2. Create Vercel Blob
3. Update Prisma schema
4. Push to GitHub
5. Run migrations
6. Test your app!

---

**Ready to continue? Let me know when you've added the environment variables!** 🚀


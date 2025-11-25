# Fix: Database Tables Don't Exist Error

## ❌ Error
```
The table `public.Video` does not exist in the current database.
```

## ✅ Solution: Run Database Migrations

The database is empty - you need to run Prisma migrations to create all tables.

## Method 1: Run Migrations via Vercel CLI (Recommended)

### Step 1: Install Vercel CLI (if not installed)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Link to Your Project
```bash
cd web
vercel link
```
- Select your project when prompted

### Step 4: Pull Environment Variables
```bash
vercel env pull .env.local
```
This downloads your environment variables locally.

### Step 5: Run Migrations
```bash
npx prisma migrate deploy
```

This will create all tables in your PostgreSQL database.

---

## Method 2: Run Migrations via Vercel Dashboard

### Option A: Use Vercel CLI in Dashboard Terminal
1. Go to Vercel Dashboard → Your Project
2. Go to **Settings** → **Functions**
3. Use the terminal/SSH feature if available

### Option B: Create a Migration Script

Create a script that runs on deployment:

1. Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "migrate:deploy": "prisma migrate deploy"
  }
}
```

2. Update `vercel.json` to run migrations:
```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build"
}
```

---

## Method 3: Run Migrations Manually (Quick Fix)

### Using Prisma Studio or Direct SQL

1. **Get Database Connection**:
   - Use your `DATABASE_URL` from Vercel

2. **Run Migrations Locally**:
```bash
cd web
export DATABASE_URL="postgres://fdebd3426db52b359b05762053703145b1382ff01e5f84e83c9f752de8b4fbda:sk_qQxvQYzBEANgApuBYBA6l@db.prisma.io:5432/postgres?sslmode=require"
npx prisma migrate deploy
```

---

## Quick Fix Command

Run this locally (replace with your DATABASE_URL):

```bash
cd /Users/laxmikanth/Documents/Bstream/web

# Set DATABASE_URL
export DATABASE_URL="postgres://fdebd3426db52b359b05762053703145b1382ff01e5f84e83c9f752de8b4fbda:sk_qQxvQYzBEANgApuBYBA6l@db.prisma.io:5432/postgres?sslmode=require"

# Run migrations
npx prisma migrate deploy
```

---

## Verify Tables Were Created

After running migrations, verify:

```bash
npx prisma studio
```

Or check in Vercel Postgres dashboard.

---

## After Migrations Complete

1. ✅ All tables will be created
2. ✅ Your app will work
3. ✅ You can seed data if needed: `npm run db:seed`

---

**Run the migrations now and the error will be fixed!** 🚀


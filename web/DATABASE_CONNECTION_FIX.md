# Database Connection Fix for Vercel

## 🔴 Problem

The logs show database connection errors:
```
Failed to connect to database: Error [PrismaClientInitializationError]: 
Can't reach database server at `db.prisma.io:5432`
```

## 🔍 Root Cause

Prisma Client reads from `DATABASE_URL` environment variable, but:
- `DATABASE_URL` is set to: `postgres://...@db.prisma.io:5432/postgres` (direct Prisma Accelerate endpoint)
- `PRISMA_DATABASE_URL` is set to: `prisma+postgres://accelerate.prisma-data.net/?api_key=...` (Prisma Accelerate with API key)

The `db.prisma.io:5432` endpoint is not reachable or not working properly.

## ✅ Solution

### Option 1: Use PRISMA_DATABASE_URL as DATABASE_URL (Recommended)

In Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. **Update** it to use the same value as `PRISMA_DATABASE_URL`:
   ```
   prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19xUXh2UVl6QkVBTmdBcHVCWUJBNmwiLCJhcGlfa2V5IjoiMDFLQVhKQldOUzRaTTVYQldQMFMxTjRONEQiLCJ0ZW5hbnRfaWQiOiJmZGViZDM0MjZkYjUyYjM1OWIwNTc2MjA1MzcwMzE0NWIxMzgyZmYwMWU1Zjg0ZTgzYzlmNzUyZGU4YjRmYmRhIiwiaW50ZXJuYWxfc2VjcmV0IjoiNmEwNjA3MWYtYzhlNi00ZTg5LTg4ZTUtMWQ0ZWU1N2Y2YTI3In0._bxfe0YzE94TJO80cOWdMESXQSMZBr4xbjobi0LlI40
   ```
4. Click **Save**
5. **Redeploy** your application

### Option 2: Use Direct PostgreSQL Connection

If Prisma Accelerate is not working, switch to a direct PostgreSQL connection:

1. **Get a PostgreSQL database**:
   - Vercel Postgres (Storage tab → Create Database)
   - Supabase (free)
   - Neon (free tier)

2. **Update DATABASE_URL** in Vercel with the direct connection string:
   ```
   postgresql://user:password@host:5432/database?sslmode=require
   ```

3. **Remove PRISMA_DATABASE_URL** (or leave it, it won't be used)

4. **Redeploy**

## 📝 Current Environment Variables

Based on your Vercel setup:
- ✅ `PRISMA_DATABASE_URL` - Set (Prisma Accelerate with API key)
- ⚠️ `DATABASE_URL` - Set to `db.prisma.io:5432` (not working)
- ✅ `POSTGRES_URL` - Set (same as DATABASE_URL)
- ✅ `NEXTAUTH_SECRET` - Set
- ✅ `BLOB_READ_WRITE_TOKEN` - Set

## 🚀 After Fixing

1. **Redeploy** your Vercel application
2. **Check logs** - Database connection errors should be gone
3. **Test**:
   - Video pages should load
   - Login should work
   - All database operations should succeed

## ✅ Verification

After updating `DATABASE_URL`, you should see:
- ✅ No more "Can't reach database server" errors
- ✅ No more connection pool timeout errors
- ✅ All routes returning 200 (success)
- ✅ Database queries working properly

---

**Note**: The code has been updated to handle database connections gracefully. Once `DATABASE_URL` is set correctly in Vercel, everything should work.


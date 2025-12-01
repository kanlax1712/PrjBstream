# Vercel Environment Variables Verification

## ✅ Current Environment Variables in Vercel

Based on your Vercel configuration, here are the environment variables that should be set:

### 1. DATABASE_URL ✅
```
postgres://fdebd3426db52b359b05762053703145b1382ff01e5f84e83c9f752de8b4fbda:sk_qQxvQYzBEANgApuBYBA6l@db.prisma.io:5432/postgres?sslmode=require
```
- **Used by**: Prisma Client, Prisma Migrations
- **Purpose**: Direct PostgreSQL connection (Prisma Accelerate endpoint)
- **Status**: ✅ Set in Vercel

### 2. POSTGRES_URL ✅
```
postgres://fdebd3426db52b359b05762053703145b1382ff01e5f84e83c9f752de8b4fbda:sk_qQxvQYzBEANgApuBYBA6l@db.prisma.io:5432/postgres?sslmode=require
```
- **Used by**: Prisma config (fallback)
- **Purpose**: Alternative database URL
- **Status**: ✅ Set in Vercel

### 3. PRISMA_DATABASE_URL ✅
```
prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19xUXh2UVl6QkVBTmdBcHVCWUJBNmwiLCJhcGlfa2V5IjoiMDFLQVhKQldOUzRaTTVYQldQMFMxTjRONEQiLCJ0ZW5hbnRfaWQiOiJmZGViZDM0MjZkYjUyYjM1OWIwNTc2MjA1MzcwMzE0NWIxMzgyZmYwMWU1Zjg0ZTgzYzlmNzUyZGU4YjRmYmRhIiwiaW50ZXJuYWxfc2VjcmV0IjoiNmEwNjA3MWYtYzhlNi00ZTg5LTg4ZTUtMWQ0ZWU1N2Y2YTI3In0._bxfe0YzE94TJO80cOWdMESXQSMZBr4xbjobi0LlI40
```
- **Used by**: Prisma config (priority)
- **Purpose**: Prisma Accelerate connection with API key
- **Status**: ✅ Set in Vercel

### 4. NEXTAUTH_SECRET ✅
```
C9oO8e4WVflBNXrm7ljRnXSbeoG/s5FqU0wETw7Z7oU=
```
- **Used by**: NextAuth.js for JWT encryption
- **Purpose**: Session encryption key
- **Status**: ✅ Set in Vercel

### 5. BLOB_READ_WRITE_TOKEN ✅
```
vercel_blob_rw_7kLo45hhew31UmqJ_hG4OB9VshZQunXU9Cuvq54veEcUjEj
```
- **Used by**: Vercel Blob Storage (`web/src/lib/storage.ts`)
- **Purpose**: File uploads (videos, thumbnails)
- **Status**: ✅ Set in Vercel

## 📁 Files Using These Variables

### Database Connection
- **`web/prisma.config.ts`**: Uses `PRISMA_DATABASE_URL` → `DATABASE_URL` → `POSTGRES_URL`
- **`web/src/lib/prisma.ts`**: Prisma Client automatically reads `DATABASE_URL`
- **`web/prisma/schema.prisma`**: Uses `DATABASE_URL` from environment

### Authentication
- **`web/src/lib/auth.ts`**: Uses `NEXTAUTH_SECRET` (line 33)

### Storage
- **`web/src/lib/storage.ts`**: Uses `BLOB_READ_WRITE_TOKEN` (line 10, 69)

## 🔧 Configuration Priority

The code uses this priority order for database connection:

1. **PRISMA_DATABASE_URL** (highest priority) - Prisma Accelerate with API key
2. **DATABASE_URL** - Direct PostgreSQL connection
3. **POSTGRES_URL** - Fallback PostgreSQL connection
4. **Local fallback** - Only in development (`file:./dev.db`)

## ⚠️ Troubleshooting Database Connection Error

If you're getting:
```
Can't reach database server at `db.prisma.io:5432`
```

### Possible Causes:

1. **Prisma Accelerate Service Issue**
   - The `db.prisma.io:5432` endpoint might be down
   - Check Prisma Accelerate status

2. **Network/Firewall Issue**
   - Vercel might not be able to reach `db.prisma.io`
   - Try using `PRISMA_DATABASE_URL` instead (it uses a different endpoint)

3. **Connection String Format**
   - Ensure the connection string is correct
   - Should include `?sslmode=require` for SSL

### Solutions:

**Option 1: Use PRISMA_DATABASE_URL (Recommended)**
- The `PRISMA_DATABASE_URL` uses `prisma+postgres://` protocol
- This is Prisma Accelerate's recommended connection method
- It should work even if `db.prisma.io:5432` is unreachable

**Option 2: Switch to Direct PostgreSQL**
- If Prisma Accelerate is not working, use a direct PostgreSQL connection
- Get connection string from:
  - Vercel Postgres (Storage tab)
  - Supabase
  - Neon
  - Any PostgreSQL provider
- Update `DATABASE_URL` in Vercel with the new connection string

## ✅ Verification Checklist

- [x] `DATABASE_URL` is set in Vercel
- [x] `POSTGRES_URL` is set in Vercel
- [x] `PRISMA_DATABASE_URL` is set in Vercel
- [x] `NEXTAUTH_SECRET` is set in Vercel
- [x] `BLOB_READ_WRITE_TOKEN` is set in Vercel
- [x] All variables are set for Production, Preview, and Development environments
- [ ] Database connection is working (test after deployment)
- [ ] File uploads are working (test video upload)

## 🚀 Next Steps

1. **Redeploy** your Vercel application
2. **Check build logs** to see if database connection succeeds
3. **Test the application** to verify all features work
4. **Monitor** for any connection errors

---

**Note**: All environment variables are now properly configured in the source code to use these Vercel environment variables. The code will automatically pick them up during build and runtime.


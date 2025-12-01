# How to Verify Prisma Accelerate Database Connection

## 🔍 Quick Verification Methods

### Method 1: Using the Verification Script (Recommended)

1. **Set environment variable locally**:
   ```bash
   cd web
   export PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
   # OR
   export DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
   ```

2. **Run the verification script**:
   ```bash
   npm run db:verify
   ```

   This will:
   - ✅ Check if environment variables are set
   - ✅ Test database connection
   - ✅ Run sample queries
   - ✅ Verify database schema
   - ✅ Test write operations

### Method 2: Using Prisma Studio

1. **Set the environment variable**:
   ```bash
   export DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
   ```

2. **Run Prisma Studio**:
   ```bash
   cd web
   npx prisma studio
   ```

3. **Check if it opens** - If Prisma Studio opens successfully, the connection is working!

### Method 3: Using Prisma CLI

1. **Set the environment variable**:
   ```bash
   export DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
   ```

2. **Test connection**:
   ```bash
   cd web
   npx prisma db pull
   ```

   If this succeeds, your connection is valid!

### Method 4: Simple Node.js Test Script

Create a file `test-connection.mjs`:

```javascript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  await prisma.$connect();
  console.log("✅ Connected successfully!");
  
  const count = await prisma.user.count();
  console.log(`✅ Found ${count} users`);
  
  await prisma.$disconnect();
} catch (error) {
  console.error("❌ Connection failed:", error.message);
  process.exit(1);
}
```

Run it:
```bash
DATABASE_URL="prisma+postgres://..." node test-connection.mjs
```

## 🔐 Verifying the API Key

The Prisma Accelerate URL contains a JWT token. You can verify if it's valid:

### Check Token Expiry (Optional)

The JWT token in the URL can be decoded to check:
- If it's expired
- If the API key is valid
- Tenant ID

**Note**: Don't share your full API key publicly!

### Verify in Prisma Dashboard

1. Go to [Prisma Accelerate Dashboard](https://accelerate.prisma.io/)
2. Check your project status
3. Verify the API key is active
4. Check connection metrics

## 🚨 Common Issues and Solutions

### Issue 1: "Can't reach database server"

**Error**: `P1001 - Can't reach database server at db.prisma.io:5432`

**Solution**:
- Use `prisma+postgres://` protocol instead of `postgres://`
- Ensure you're using the Prisma Accelerate URL, not the direct endpoint

### Issue 2: "Connection pool timeout"

**Error**: `P2024 - Timed out fetching a new connection`

**Solution**:
- Prisma Accelerate handles connection pooling automatically
- Make sure you're using `PRISMA_DATABASE_URL` with the `prisma+postgres://` protocol

### Issue 3: "Invalid API key"

**Error**: Authentication failed

**Solution**:
- Verify the API key in Prisma Accelerate dashboard
- Regenerate the API key if needed
- Update the URL with the new API key

## ✅ Success Indicators

When the connection is working, you should see:
- ✅ No connection errors in logs
- ✅ Prisma Studio opens successfully
- ✅ Database queries return results
- ✅ No timeout errors
- ✅ Fast response times (< 100ms for simple queries)

## 📝 Testing in Vercel

### Option 1: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Logs
2. Look for database connection errors
3. If you see successful queries, connection is working

### Option 2: Create a Test API Route

Create `web/src/app/api/test-db/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ 
      success: true, 
      message: "Database connected!",
      userCount 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      code: error.code 
    }, { status: 500 });
  }
}
```

Then visit: `https://your-app.vercel.app/api/test-db`

If it returns `{ success: true }`, your connection is working!

## 🔧 Quick Fix Checklist

- [ ] `PRISMA_DATABASE_URL` is set in Vercel
- [ ] URL uses `prisma+postgres://` protocol
- [ ] API key is valid (check in Prisma dashboard)
- [ ] No typos in the connection string
- [ ] Environment variable is set for all environments (Production, Preview, Development)
- [ ] Application has been redeployed after setting the variable

---

**Need Help?** Run `npm run db:verify` to get detailed diagnostics!


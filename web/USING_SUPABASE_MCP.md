# Using Supabase MCP for Database Operations

## 🎯 Why Use Supabase MCP?

Instead of using Prisma migrations locally, you can now use **Supabase MCP** to:
- ✅ Apply migrations directly to Supabase
- ✅ Check database structure in real-time
- ✅ Monitor security and performance
- ✅ Execute SQL queries directly
- ✅ Manage edge functions
- ✅ View logs and diagnostics

## 📋 Common Operations

### 1. Apply Database Migrations

**Before (Prisma CLI)**:
```bash
cd web
npx prisma migrate dev --name migration_name
```

**Now (Supabase MCP)**:
```typescript
// Use mcp_supabase_apply_migration tool
// I'll handle this automatically when you ask for schema changes
```

### 2. Check Table Structure

**Before**: Had to query database manually

**Now**: 
```typescript
mcp_supabase_list_tables({ schemas: ['public'] })
// Returns all tables with columns, types, constraints
```

### 3. Execute SQL Queries

**Before**: Had to use database client

**Now**:
```typescript
mcp_supabase_execute_sql({ 
  query: "SELECT * FROM \"LiveStream\" WHERE status = 'LIVE'" 
})
```

### 4. Check Security Issues

**Before**: Manual review

**Now**:
```typescript
mcp_supabase_get_advisors({ type: "security" })
// Returns all security issues automatically
```

### 5. View Logs

**Before**: Had to check Vercel logs

**Now**:
```typescript
mcp_supabase_get_logs({ service: "api" })
mcp_supabase_get_logs({ service: "postgres" })
```

## 🔧 Current Project Setup

### Database Connection
- **Type**: Supabase PostgreSQL
- **Project**: `srkbxeabrytkmahhbojd`
- **URL**: `https://srkbxeabrytkmahhbojd.supabase.co`
- **ORM**: Prisma (reads from `DATABASE_URL`)

### RLS Status
- ✅ All tables have RLS enabled
- ✅ Policies configured for API-based auth
- ✅ No security warnings

### Available Services
1. **PostgreSQL Database** ✅ (in use)
2. **Storage** (available for videos/thumbnails)
3. **Edge Functions** (available for serverless)
4. **Realtime** (available for live features)
5. **Auth** (available, but using NextAuth currently)

## 🚀 Workflow Going Forward

### When You Need Database Changes:

1. **Tell me what you need** (e.g., "add a field to Video table")
2. **I'll use MCP to**:
   - Check current structure
   - Create migration SQL
   - Apply it directly to Supabase
   - Verify it worked
   - Check for security issues

### When You Need to Query Data:

1. **Ask me to check something** (e.g., "how many live streams are active?")
2. **I'll use MCP to**:
   - Execute the query
   - Return results
   - Check performance if needed

### When You Need Monitoring:

1. **Ask me to check** (e.g., "are there any errors?")
2. **I'll use MCP to**:
   - Check logs
   - Check security advisors
   - Check performance advisors

## 📝 Example: Adding a New Feature

**Scenario**: Add "likes" to videos

1. **I'll check current Video table structure**
2. **Create migration to add `likes` column**
3. **Apply via MCP**
4. **Verify it worked**
5. **Check for security issues**
6. **Update Prisma schema**
7. **Generate Prisma client**

All done through MCP! No local database setup needed.

## 🔐 Security Best Practices

- ✅ RLS enabled on all tables
- ✅ Policies configured
- ✅ Regular security checks via advisors
- ✅ API routes handle authentication
- ✅ Defense in depth

## 📊 Monitoring

Use MCP to monitor:
- Database performance
- Security vulnerabilities
- API errors
- Query performance
- Connection issues

## 🎉 Benefits

1. **No Local Setup**: Don't need local PostgreSQL
2. **Real-time**: See changes immediately
3. **Safe**: MCP validates before applying
4. **Integrated**: Works with Supabase dashboard
5. **Fast**: Direct database access

---

**Next time you need database changes, just ask! I'll use MCP to handle everything.**


# Supabase MCP Setup Guide

## ✅ What's Configured

### 1. Database Connection
- **Project URL**: `https://srkbxeabrytkmahhbojd.supabase.co`
- **Anon Key**: Configured (for client-side access if needed)
- **Connection**: Using Prisma with Supabase PostgreSQL

### 2. Row Level Security (RLS)
- ✅ RLS enabled on all tables
- ✅ Policies configured for API-based authentication
- ✅ Defense in depth security

### 3. Available Supabase Features

#### Database Extensions Available:
- `pg_graphql` - GraphQL API (enabled)
- `pgcrypto` - Cryptographic functions (enabled)
- `uuid-ossp` - UUID generation (enabled)
- `pg_stat_statements` - Query performance monitoring (enabled)
- `supabase_vault` - Secrets management (enabled)
- `vector` - Vector embeddings (available)
- `pg_net` - Async HTTP (available)
- `pgmq` - Message queue (available)
- `pg_cron` - Job scheduler (available)

#### Services Available:
- ✅ **PostgreSQL Database** - Primary database
- ✅ **Storage** - File storage (can be used for videos/thumbnails)
- ✅ **Edge Functions** - Serverless functions
- ✅ **Realtime** - Real-time subscriptions
- ✅ **Auth** - Authentication (currently using NextAuth, but can migrate)

## 🔧 Current Setup

### Database Connection
The project uses:
- **Prisma** for ORM
- **Supabase PostgreSQL** as the database
- **NextAuth** for authentication
- **API Routes** for business logic

### RLS Policies
All tables have RLS enabled with policies that allow operations via API routes (which handle authentication).

## 🚀 Using Supabase MCP

### Available MCP Commands:

1. **Database Operations**:
   ```typescript
   // List tables
   mcp_supabase_list_tables()
   
   // Execute SQL
   mcp_supabase_execute_sql({ query: "SELECT * FROM ..." })
   
   // Apply migrations
   mcp_supabase_apply_migration({ name: "...", query: "..." })
   
   // List migrations
   mcp_supabase_list_migrations()
   ```

2. **Monitoring**:
   ```typescript
   // Get logs
   mcp_supabase_get_logs({ service: "api" | "postgres" | ... })
   
   // Get advisors (security/performance)
   mcp_supabase_get_advisors({ type: "security" | "performance" })
   ```

3. **Edge Functions**:
   ```typescript
   // List functions
   mcp_supabase_list_edge_functions()
   
   // Deploy function
   mcp_supabase_deploy_edge_function({ name: "...", files: [...] })
   ```

4. **Branches** (Development):
   ```typescript
   // Create branch
   mcp_supabase_create_branch({ name: "develop" })
   
   // Merge branch
   mcp_supabase_merge_branch({ branch_id: "..." })
   ```

## 📝 Next Steps

### 1. Use Supabase Storage for Videos
Instead of Vercel Blob, consider using Supabase Storage:
- Better integration with database
- Built-in CDN
- RLS policies for access control

### 2. Use Supabase Edge Functions
For serverless functions:
- Video processing
- Thumbnail generation
- Webhook handlers

### 3. Use Supabase Realtime
For live features:
- Real-time chat
- Live stream updates
- Real-time notifications

### 4. Consider Migrating to Supabase Auth
If you want to use Supabase's built-in auth:
- Better RLS integration
- Built-in user management
- Social auth providers

## 🔐 Security Notes

- RLS is enabled on all tables
- API routes handle authentication via NextAuth
- Policies allow operations that API routes control
- Consider adding more granular policies for production

## 📊 Monitoring

Use MCP to monitor:
- Database performance
- Security issues
- API logs
- Edge function logs

## 🔗 Resources

- **Project Dashboard**: https://supabase.com/dashboard/project/srkbxeabrytkmahhbojd
- **API Docs**: https://srkbxeabrytkmahhbojd.supabase.co
- **MCP Docs**: https://mcp.supabase.com


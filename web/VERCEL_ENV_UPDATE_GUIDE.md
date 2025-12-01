# Quick Guide: Update DATABASE_URL in Vercel

## 🎯 Goal
Update `DATABASE_URL` in Vercel to use Prisma Accelerate URL (fixes connection errors)

## ⚡ Quick Steps

### 1. Copy This Value
```
prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19xUXh2UVl6QkVBTmdBcHVCWUJBNmwiLCJhcGlfa2V5IjoiMDFLQVhKQldOUzRaTTVYQldQMFMxTjRONEQiLCJ0ZW5hbnRfaWQiOiJmZGViZDM0MjZkYjUyYjM1OWIwNTc2MjA1MzcwMzE0NWIxMzgyZmYwMWU1Zjg0ZTgzYzlmNzUyZGU4YjRmYmRhIiwiaW50ZXJuYWxfc2VjcmV0IjoiNmEwNjA3MWYtYzhlNi00ZTg5LTg4ZTUtMWQ0ZWU1N2Y2YTI3In0._bxfe0YzE94TJO80cOWdMESXQSMZBr4xbjobi0LlI40
```

### 2. Update in Vercel
1. Go to: https://vercel.com/dashboard
2. Click your project → **Settings** → **Environment Variables**
3. Find `DATABASE_URL` → Click **Edit** (pencil icon)
4. **Paste** the value above
5. **Check all environments**: Production ✅ Preview ✅ Development ✅
6. Click **Save**

### 3. Redeploy
- Go to **Deployments** → Click **Redeploy** on latest deployment
- Or push a commit to trigger auto-deploy

### 4. Verify
- Check **Logs** - should see no database errors
- Test your app - everything should work!

## ✅ Done!

Your database connection should now work in Vercel! 🎉


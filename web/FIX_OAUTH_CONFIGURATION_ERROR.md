# Fix: OAuth "Configuration" Error (500)

## 🔴 Error
```
error?error=Configuration:1
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

## 🔍 What This Means

The "Configuration" error in NextAuth typically means:
1. **Database connection issue** during OAuth callback
2. **Missing NextAuth tables** (Account, Session, VerificationToken)
3. **Redirect URI mismatch** in Google Cloud Console
4. **Adapter initialization failure**

## ✅ Solutions

### Solution 1: Verify Database Tables (Most Common)

The PrismaAdapter needs these tables to exist:

```bash
cd web
npx prisma db push
```

This will create:
- `Account` table (for OAuth accounts)
- `Session` table (for sessions)
- `VerificationToken` table (for email verification)

### Solution 2: Check Redirect URI

**In Google Cloud Console:**
1. Go to: https://console.cloud.google.com/
2. APIs & Services > Credentials
3. Click your OAuth 2.0 Client ID
4. Verify **Authorized redirect URIs** includes:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. Make sure there are **no typos** or extra spaces

### Solution 3: Check Database Connection

Test if Prisma can connect:

```bash
cd web
npx prisma db push --skip-generate
```

If this fails, check your `DATABASE_URL` in `.env.local`.

### Solution 4: Check Server Logs

Look at your terminal where `npm run dev` is running. You should see error details like:

```
PrismaClientKnownRequestError: ...
or
Error: Failed to connect to database
```

## 🎯 Quick Checklist

- [ ] Database tables exist (`npx prisma db push`)
- [ ] `DATABASE_URL` is correct in `.env.local`
- [ ] Redirect URI matches exactly in Google Cloud Console
- [ ] Google OAuth credentials are set in `.env.local`
- [ ] You're added as a test user in Google Cloud Console
- [ ] Server logs show no database connection errors

## 📝 Test Steps

1. **Verify tables exist:**
   ```bash
   cd web
   npx prisma studio
   ```
   Check if `Account`, `Session`, `VerificationToken` tables exist.

2. **Test OAuth flow:**
   - Go to: http://localhost:3000/login
   - Click "Continue with Google"
   - Should redirect to Google, not show 500 error

3. **Check error in browser:**
   - Open DevTools (F12)
   - Go to Network tab
   - Try OAuth sign-in
   - Look for the failing request
   - Check Response tab for error details

## 🔧 If Still Failing

1. **Restart dev server:**
   ```bash
   # Stop (Ctrl+C)
   cd web
   npm run dev
   ```

2. **Clear browser cookies:**
   - Clear all cookies for `localhost:3000`
   - Try in incognito/private window

3. **Check NextAuth logs:**
   - Look for `[auth][error]` in server terminal
   - This will show the exact error

## 💡 Common Causes

1. **Database not accessible** - Check `DATABASE_URL`
2. **Tables missing** - Run `npx prisma db push`
3. **Redirect URI typo** - Must match exactly
4. **Adapter failing** - Check Prisma connection


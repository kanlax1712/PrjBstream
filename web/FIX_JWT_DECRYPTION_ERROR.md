# Fix: JWT Decryption Error

## 🔴 Error
```
[auth][error] JWTSessionError
[auth][cause] JWEDecryptionFailed: decryption operation failed
```

## 🔍 What This Means

This error occurs when NextAuth tries to decrypt a JWT session cookie but fails. Common causes:

1. **Stale cookies** - Cookies from a previous session with a different `NEXTAUTH_SECRET`
2. **Changed secret** - `NEXTAUTH_SECRET` was changed in `.env.local`
3. **Corrupted cookies** - Browser cookies got corrupted
4. **Development changes** - Restarting dev server with different config

## ✅ Solution

### Quick Fix: Clear Browser Cookies

**Option 1: Browser DevTools (Recommended)**
1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Cookies** → `http://localhost:3000`
4. Delete all cookies that start with `next-auth` or `authjs`
5. Refresh the page

**Option 2: Clear All Site Data**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear site data**
4. Refresh the page

**Option 3: Use Incognito/Private Window**
- Open a new incognito/private window
- Navigate to `http://localhost:3000`
- This starts with a clean cookie state

### Permanent Fix: Check NEXTAUTH_SECRET

Make sure `NEXTAUTH_SECRET` is consistent:

1. **Check `.env.local`:**
   ```bash
   cd web
   cat .env.local | grep NEXTAUTH_SECRET
   ```

2. **If it's missing or changed:**
   ```env
   NEXTAUTH_SECRET=your-secret-here-min-32-chars
   ```

3. **Generate a new secret (if needed):**
   ```bash
   openssl rand -base64 32
   ```

4. **Restart dev server:**
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```

## 🛠️ What Was Fixed

1. **Improved error handling** - JWT decryption errors are now handled silently
2. **Better error detection** - Catches all JWT-related errors
3. **Logger configuration** - Suppresses JWT error logs (they're expected for stale cookies)
4. **Graceful fallback** - Returns `null` session instead of crashing

## 📝 Technical Details

The error happens because:
- NextAuth encrypts session cookies with `NEXTAUTH_SECRET`
- If the secret changes, old cookies can't be decrypted
- This is **expected behavior** - the app handles it gracefully now

## ✅ Verification

After clearing cookies:
1. Go to: http://localhost:3000
2. Should load without JWT errors
3. You'll need to log in again (session was cleared)
4. No more error messages in console

## 🔄 If Error Persists

1. **Check server logs** - Look for other errors
2. **Verify `.env.local`** - Make sure `NEXTAUTH_SECRET` is set
3. **Restart dev server** - Sometimes helps clear cached state
4. **Clear `.next` cache:**
   ```bash
   cd web
   rm -rf .next
   npm run dev
   ```

## 💡 Prevention

- Keep `NEXTAUTH_SECRET` consistent across restarts
- Don't change it unless you want to invalidate all sessions
- Use environment variables (not hardcoded values)


# Fix: Publish Directory Auto-Fill Issue

## The Problem

Netlify dashboard automatically fills the publish directory when you set the base directory, and you can't remove it.

## ✅ Solution

The `netlify.toml` file **overrides** the dashboard settings. I've updated it to set the correct publish directory.

### What I Changed

Updated `web/netlify.toml` to explicitly set:
```toml
publish = ".next"
```

This will override whatever the dashboard sets.

---

## Netlify Dashboard Settings

**Go to**: https://app.netlify.com/sites/abstream/configuration/deploys

### Settings (it's OK if dashboard auto-fills):

1. **Base directory**: `web` ✅
2. **Build command**: `npm install && npx prisma generate && npm run build` ✅
3. **Publish directory**: `web/.next` or `.next` (dashboard may auto-fill this) ✅
   - **This is OK!** The `netlify.toml` will override it with the correct value
4. **Node version**: `20` ✅

### Important Note

- If dashboard shows `web/.next` → That's fine, `netlify.toml` will override
- If dashboard shows `.next` → That's also fine
- The `netlify.toml` file takes precedence over dashboard settings

---

## How It Works

1. **Dashboard settings** are used as defaults
2. **`netlify.toml`** overrides dashboard settings
3. **Next.js plugin** handles the actual routing and server-side rendering

The `netlify.toml` file I created will ensure the correct publish directory is used, regardless of what the dashboard shows.

---

## Next Steps

1. ✅ **Code updated**: `netlify.toml` now has `publish = ".next"`
2. ✅ **Pushed to GitHub**: Will trigger auto-deploy
3. ⏳ **Wait for deployment**: Check https://app.netlify.com/sites/abstream/deploys

---

## Verification

After deployment completes:

1. **Check build logs**: Should show "Next.js plugin detected"
2. **Visit site**: https://abstream.netlify.app/
3. **Should work**: Home page should load (not 404)

---

## If Still Not Working

### Check Build Logs

Look for these in the deployment logs:
- ✅ "Next.js plugin detected"
- ✅ "Build completed successfully"
- ✅ "Deploy site ready"

### Common Issues:

1. **Build fails**: Check for errors in logs
2. **Plugin not installed**: Should auto-install from `netlify.toml`
3. **Environment variables**: Verify all 4 are set

---

## Summary

✅ **Solution**: Set `publish = ".next"` in `netlify.toml` (done)
✅ **Dashboard**: Can leave auto-filled value (it will be overridden)
✅ **Next**: Wait for deployment to complete

**The `netlify.toml` file will override the dashboard settings!** 🚀


# Automatic Netlify Environment Variables Setup

## Option 1: Using Netlify CLI (Recommended)

### Step 1: Complete Netlify Login

Since you already have an account (kanlax1712@gmail.com), you need to complete the CLI login:

```bash
cd /Users/laxmikanth/Documents/Bstream
netlify login
```

**Important**: 
- This will open a browser window
- Click "Authorize" in the browser
- The terminal will show "Logged in successfully"

### Step 2: Run Setup Script

Once logged in, run:

```bash
./setup_netlify_env.sh
```

This will automatically set all 4 environment variables.

---

## Option 2: Using Netlify API (No Browser Login)

### Step 1: Get Personal Access Token

1. Go to: https://app.netlify.com/user/applications
2. Click **"New access token"**
3. Name it: `Bstream Setup`
4. Click **"Generate token"**
5. **Copy the token** (you'll only see it once!)

### Step 2: Run API Script

```bash
cd /Users/laxmikanth/Documents/Bstream
./setup_netlify_api.sh
```

Enter your token when prompted. It will set all variables automatically.

---

## Option 3: Manual Setup (If scripts don't work)

If you prefer to do it manually:

1. **Go to**: https://app.netlify.com/sites/bright-dasik-821173/configuration/env

2. **Add these 4 variables**:

   **Variable 1:**
   - Key: `DATABASE_URL`
   - Value: `file:./dev.db`
   - Scope: All scopes

   **Variable 2:**
   - Key: `NEXTAUTH_URL`
   - Value: `https://bright-dasik-821173.netlify.app`
   - Scope: All scopes

   **Variable 3:**
   - Key: `NEXTAUTH_SECRET`
   - Value: `eye6rx7dN8gUpwsqYx+p/kWli0puo1r+A7q7RuNdTmI=`
   - Scope: All scopes

   **Variable 4:**
   - Key: `NODE_ENV`
   - Value: `production`
   - Scope: All scopes

3. **Trigger Deploy**:
   - Go to Deploys tab
   - Click "Trigger deploy" → "Deploy site"

---

## Quick Command Summary

**If already logged in to Netlify CLI:**
```bash
cd /Users/laxmikanth/Documents/Bstream
./setup_netlify_env.sh
```

**If NOT logged in (use API method):**
```bash
cd /Users/laxmikanth/Documents/Bstream
./setup_netlify_api.sh
# Enter your Personal Access Token when prompted
```

---

## After Setup

Once variables are set:

1. **Trigger a new deploy** in Netlify dashboard
2. **Wait for build** to complete
3. **Check build logs** if there are any errors
4. **Visit your site**: https://bright-dasik-821173.netlify.app

---

## Troubleshooting

**If CLI login fails:**
- Use Option 2 (API method) instead
- Or do manual setup (Option 3)

**If API method fails:**
- Verify your token is correct
- Check token has proper permissions
- Use manual setup instead

**If build still fails:**
- Check environment variables are actually set
- Verify values are correct
- Check build logs for specific errors

---

**Choose the method that works best for you!**


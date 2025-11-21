# Quick Manual Environment Variables Setup

Since the API method needs the correct site ID, here's the fastest manual way:

## ⚡ Quick Steps (2 minutes)

### Step 1: Open Environment Variables Page

**Direct Link**: https://app.netlify.com/sites/bright-dasik-821173/configuration/env

Or navigate:
1. Go to https://app.netlify.com
2. Click on your site: **bright-dasik-821173**
3. Click **"Site settings"** (top menu)
4. Click **"Environment variables"** (left sidebar)

### Step 2: Add 4 Variables

Click **"Add a variable"** button 4 times and add:

**Variable 1:**
- **Key**: `DATABASE_URL`
- **Value**: `file:./dev.db`
- **Scope**: All scopes
- Click **"Save variable"**

**Variable 2:**
- **Key**: `NEXTAUTH_URL`
- **Value**: `https://bright-dasik-821173.netlify.app`
- **Scope**: All scopes
- Click **"Save variable"**

**Variable 3:**
- **Key**: `NEXTAUTH_SECRET`
- **Value**: `eye6rx7dN8gUpwsqYx+p/kWli0puo1r+A7q7RuNdTmI=`
- **Scope**: All scopes
- Click **"Save variable"**

**Variable 4:**
- **Key**: `NODE_ENV`
- **Value**: `production`
- **Scope**: All scopes
- Click **"Save variable"**

### Step 3: Trigger Deploy

1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for build to complete

## ✅ Done!

Your build should now succeed!

## Verification

After adding variables, you should see all 4 in the list:
- ✅ DATABASE_URL
- ✅ NEXTAUTH_URL
- ✅ NEXTAUTH_SECRET
- ✅ NODE_ENV

---

**This takes about 2 minutes and is the most reliable method!**


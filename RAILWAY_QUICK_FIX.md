# 🚨 Railway Build Error - Quick Fix

## The Error
```
/bin/bash: line 1: npm: command not found
```

This means Railway is using Docker but Node.js isn't installed in the Docker image.

## ✅ IMMEDIATE FIX (2 minutes)

### In Railway Dashboard:

1. **Go to your backend service**
2. **Settings tab**
3. **Find "Root Directory"**
4. **Set it to:** `backend`
5. **Save**

This tells Railway:
- Where your `package.json` is
- To use Nixpacks (auto-detects Node.js)
- Not to use Docker

### Then Redeploy:

1. Go to **Deployments** tab
2. Click **"Redeploy"** or push a new commit
3. Watch the logs - should see "Detected Node.js"

---

## Alternative: Manual Build Settings

If Root Directory doesn't work, set these manually:

**In Railway → Settings:**

- **Build Command:** `npm install && npm run prisma:generate && npm run build`
- **Start Command:** `npm run prisma:migrate:deploy && npm start`
- **Root Directory:** `backend`

---

## Why This Happens

Railway auto-detects the build system. If it can't find `package.json` at the root, it might try Docker. Setting Root Directory to `backend` fixes this.

---

**After fixing, your build should work!** ✅


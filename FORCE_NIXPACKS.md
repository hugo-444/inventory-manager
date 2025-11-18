# 🚨 URGENT: Force Nixpacks in Railway

## The Problem
Railway is using **Railpack** which doesn't support Node.js. We need **Nixpacks**.

## ✅ IMMEDIATE FIX (In Railway Dashboard)

### Option 1: Change Builder in Settings (Recommended)

1. **Go to Railway Dashboard**
2. **Click your backend service**
3. **Settings tab**
4. **Look for "Builder" or "Build System"**
5. **Change from "Railpack" to "NIXPACKS"**
6. **Set Root Directory to:** `backend`
7. **Save and Redeploy**

### Option 2: Use Dockerfile (If Nixpacks option not available)

1. **In Railway Settings:**
   - Set **"Dockerfile Path"** to: `backend/Dockerfile`
   - Or Railway should auto-detect it
2. **Set Root Directory to:** `backend`
3. **Save and Redeploy**

### Option 3: Add railway.json at Root (Last Resort)

If Railway still uses Railpack, create this at project root:

**Create:** `railway.json` (at root, not in backend/)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  }
}
```

---

## What I've Created

✅ `backend/nixpacks.toml` - Nixpacks configuration  
✅ `backend/Dockerfile` - Docker fallback  
✅ `backend/.dockerignore` - Docker ignore file  
✅ Updated `package.json` with proper scripts

---

## Quick Steps

1. **Railway Dashboard → Backend Service → Settings**
2. **Find "Builder" dropdown → Select "NIXPACKS"**
3. **Root Directory → Set to `backend`**
4. **Save**
5. **Redeploy**

---

**Railpack doesn't support Node.js. You MUST use Nixpacks or Docker!**


# 🚀 Deploy to Railway NOW - 10 Minutes to Live!

## Why Railway?
- ✅ **HTTPS automatically** (camera REQUIRES this!)
- ✅ **PostgreSQL database included**
- ✅ **Free tier** ($5 credit/month)
- ✅ **Auto-deploys from GitHub**
- ✅ **No credit card needed for beta**

---

## Quick Start (10 Minutes)

### Step 1: Push to GitHub (2 min)

```bash
# Make sure everything is committed
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### Step 2: Deploy Backend (5 min)

1. **Go to [railway.app](https://railway.app)** and sign up (use GitHub)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `inventory-manager` repo
5. Railway auto-detects Node.js

**Configure:**
- **Root Directory:** `backend` (in Settings)
- **Add PostgreSQL:** Click "+ New" → "Database" → "PostgreSQL"
- **Environment Variables:**
  - `NODE_ENV=production`
  - `PORT=3000`
  - `DATABASE_URL` (auto-set by PostgreSQL service)

**Build Settings:**
- Build Command: `npm install && npm run prisma:generate`
- Start Command: `npm run prisma:migrate deploy && npm start`

6. **Copy your backend URL** (e.g., `https://your-app.railway.app`)

### Step 3: Deploy Frontend (3 min)

1. In Railway, click **"+ New"** → **"Static Site"**
2. Connect same GitHub repo
3. **Configure:**
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`
   - **Environment Variable:**
     ```
     VITE_API_URL=https://your-backend-url.railway.app/api
     ```
     (Replace with your actual backend URL from Step 2)

4. Deploy!

### Step 4: Test Camera! 📷

1. Open your frontend URL (HTTPS!)
2. Go to Scanner page
3. Click "Start Camera Scanner"
4. Grant camera permission
5. **Camera should work!** (HTTPS is required)

---

## Troubleshooting

### Camera Still Not Working?

**Check:**
1. ✅ Are you on HTTPS? (Railway provides this)
2. ✅ Did you grant camera permissions?
3. ✅ Are you on a real device? (not simulator)
4. ✅ Check browser console for errors

**Common Issues:**
- **"Camera requires HTTPS"** → Railway provides HTTPS automatically
- **"No cameras found"** → Test on real device, not browser simulator
- **Permission denied** → Grant camera access in browser settings

### Database Issues?

**Run migrations manually:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migrations
railway run npm run prisma:migrate deploy
```

Or check Railway logs - migrations run automatically on deploy.

### API Connection?

**Verify:**
1. Backend health: `https://your-backend.railway.app/health`
2. Frontend env var: `VITE_API_URL` set correctly
3. CORS: Backend allows all origins (configured)

---

## What You Get

- **Frontend URL:** `https://your-frontend.railway.app` ✅ HTTPS
- **Backend URL:** `https://your-backend.railway.app` ✅ HTTPS
- **Database:** PostgreSQL (managed) ✅
- **Camera:** Works! ✅ (HTTPS required)

---

## Cost

- **Free Tier:** $5 credit/month
- **PostgreSQL:** ~$5/month (covered by free credit)
- **Web Services:** Free for low traffic
- **Total:** **FREE for beta testing!**

---

## Next Steps After Deployment

1. ✅ Test camera scanning
2. ✅ Test product creation
3. ✅ Test location management
4. ✅ Test on mobile device
5. ✅ Share URL for testing!

---

**Time to Live:** ~10 minutes  
**HTTPS:** ✅ Automatic  
**Camera:** ✅ Will work with HTTPS!


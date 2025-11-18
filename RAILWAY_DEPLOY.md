# Railway Deployment Guide - Fastest Live Testing Setup

## Why Railway?
- ✅ **HTTPS included** (required for camera)
- ✅ **PostgreSQL database included**
- ✅ **Free tier available**
- ✅ **Auto-deploys from GitHub**
- ✅ **5-minute setup**

## Step 1: Prepare Repository

Make sure your code is pushed to GitHub:
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

## Step 2: Deploy Backend

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `inventory-manager` repository
5. Railway will detect it's a Node.js project

### Configure Backend Service:

1. **Set Root Directory:**
   - Go to Settings → Root Directory
   - Set to: `backend`

2. **Add PostgreSQL Database:**
   - Click **"+ New"** → **"Database"** → **"PostgreSQL"**
   - Railway will automatically set `DATABASE_URL` environment variable

3. **Set Environment Variables:**
   - Go to Variables tab
   - Add:
     ```
     NODE_ENV=production
     PORT=3000
     ```
   - `DATABASE_URL` is automatically set by PostgreSQL service

4. **Set Build & Start Commands:**
   - Build Command: `npm install && npm run prisma:generate`
   - Start Command: `npm run prisma:migrate deploy && npm start`

5. **Deploy:**
   - Railway will automatically deploy
   - Copy the generated URL (e.g., `https://your-app.railway.app`)

## Step 3: Run Database Migrations

After first deployment, run migrations:
1. Go to your backend service
2. Click **"Deployments"** tab
3. Click **"View Logs"** to see migration status
4. If migrations fail, use Railway's CLI or run manually

## Step 4: Deploy Frontend

1. In Railway, click **"+ New"** → **"Static Site"**
2. Connect your GitHub repo again
3. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Output Directory:** `dist`
   - **Environment Variable:**
     ```
     VITE_API_URL=https://your-backend-url.railway.app/api
     ```
     (Replace with your actual backend URL)

4. Deploy

## Step 5: Access Your App

- **Frontend URL:** `https://your-frontend.railway.app`
- **Backend URL:** `https://your-backend.railway.app`
- **API Health:** `https://your-backend.railway.app/health`

## Troubleshooting

### Camera Not Working?
- ✅ Railway provides HTTPS automatically (required for camera)
- ✅ Check browser console for errors
- ✅ Grant camera permissions when prompted
- ✅ Test on actual device (not simulator)

### Database Issues?
- Run migrations: Railway will run `prisma:migrate deploy` on start
- Check logs in Railway dashboard
- Verify `DATABASE_URL` is set correctly

### API Connection Issues?
- Verify `VITE_API_URL` in frontend environment variables
- Check CORS settings (should allow all origins in beta)
- Test backend health endpoint

## Quick Commands

```bash
# Install Railway CLI (optional)
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Run migrations manually
railway run npm run prisma:migrate deploy
```

## Cost

- **Free Tier:** $5 credit/month
- **PostgreSQL:** ~$5/month (included in free credit)
- **Web Services:** Free for low traffic
- **Total:** Free for beta testing!

---

**Time to Deploy:** ~10 minutes  
**HTTPS:** ✅ Automatic  
**Camera Support:** ✅ Works with HTTPS


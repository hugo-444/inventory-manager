# 🚀 Deployment Guide

Complete guide for deploying the Inventory Manager app to production.

## Quick Start: Railway (Recommended)

**Why Railway?**
- ✅ HTTPS automatically (required for camera)
- ✅ PostgreSQL database included
- ✅ Free tier ($5 credit/month)
- ✅ Auto-deploys from GitHub
- ✅ 10-minute setup

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### Step 2: Deploy Backend

1. Go to [railway.app](https://railway.app) and sign up (use GitHub)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Choose your `inventory-manager` repo
4. **Configure Backend Service:**
   - **Root Directory:** `backend` (in Settings)
   - **Add PostgreSQL:** Click "+ New" → "Database" → "PostgreSQL"
   - **Environment Variables:**
     - `NODE_ENV=production`
     - `PORT=3000`
     - `DATABASE_URL` (auto-set by PostgreSQL service)
   - **Build Command:** `npm install && npm run prisma:generate && npm run build`
   - **Start Command:** `npm run prisma:migrate:deploy && npm start`
5. Copy your backend URL (e.g., `https://your-app.railway.app`)

### Step 3: Deploy Frontend

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
4. Deploy!

### Step 4: Troubleshooting

**If build fails:**
- Set Root Directory to `backend` (for backend) or `frontend` (for frontend)
- Ensure Builder is set to "NIXPACKS" (not Railpack)
- Check logs in Railway dashboard

**Camera not working?**
- Railway provides HTTPS automatically (required for camera)
- Grant camera permissions when prompted
- Test on real device (not simulator)

**Database issues?**
- Migrations run automatically on deploy (`prisma:migrate:deploy`)
- Check logs if migrations fail
- Verify `DATABASE_URL` is set correctly

---

## Alternative: ngrok (Quick Testing)

**Best for:** Quick testing on different networks, beta demos

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Terminal 1 - Start backend
cd backend
npm run dev

# Terminal 2 - Start frontend
cd frontend
npm run dev

# Terminal 3 - Expose backend
ngrok http 3000
# Copy the HTTPS URL

# Terminal 4 - Expose frontend
ngrok http 5173
# Copy the HTTPS URL
```

**Update frontend API URL:**
Create `frontend/.env`:
```
VITE_API_URL=https://your-backend-ngrok-url.ngrok.io/api
```

**Limitations:**
- Free tier has session limits
- URLs change on restart (unless paid)
- Not for production traffic

---

## Pre-Deployment Checklist

### Backend
- [ ] Update `backend/src/config.ts` to use `process.env.PORT || 3000`
- [ ] Ensure CORS allows your frontend domain
- [ ] Run migrations: `npm run prisma:migrate deploy`
- [ ] Seed database: `npm run prisma:seed` (optional)

### Frontend
- [ ] Set `VITE_API_URL` environment variable
- [ ] Build for production: `npm run build`
- [ ] Test build locally: `npm run preview`

### Security
- [ ] Verify `.env` files are in `.gitignore`
- [ ] Never commit secrets to GitHub
- [ ] Set environment variables in Railway dashboard (not in code)

---

## Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
PORT=3000
NODE_ENV=production
```

### Frontend (.env)
```bash
VITE_API_URL=https://your-backend-url.com/api
```

---

## Local Development

```bash
# Backend
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## Mobile Testing

After deployment:
1. Open deployed URL on phone
2. Grant camera permissions
3. Test barcode scanning
4. Test all features

**Note:** Camera requires HTTPS (Railway/ngrok provide this automatically)

---

## Troubleshooting

### Camera not working
- Must use HTTPS (not HTTP)
- Check browser permissions
- Test on actual device (not simulator)

### API connection failed
- Verify `VITE_API_URL` is correct
- Check CORS settings in backend
- Verify backend is running

### Database connection failed
- Check `DATABASE_URL` format
- Verify database is accessible
- Run migrations: `npm run prisma:migrate:deploy`

---

**Recommended for Beta:** Railway (permanent, HTTPS, database included)  
**Recommended for Quick Testing:** ngrok (5 minutes, temporary URLs)

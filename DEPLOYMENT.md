# Deployment Guide - Beta Version

## Quick Beta Deployment (Recommended for Tomorrow)

### Option 1: ngrok (Fastest - 5 minutes)

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
# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)

# Terminal 4 - Expose frontend
ngrok http 5173
# Copy the HTTPS URL (e.g., https://xyz789.ngrok.io)
```

**Update frontend API URL:**
Create `frontend/.env`:
```
VITE_API_URL=https://your-backend-ngrok-url.ngrok.io/api
```

Then restart frontend: `npm run dev`

**Access from anywhere:**
- Frontend: `https://your-frontend-ngrok-url.ngrok.io`
- Works on any network, any device
- HTTPS enabled (required for camera access)

---

### Option 2: Railway (Production-Ready - 30 minutes)

**Best for:** Permanent beta deployment, multiple users

1. **Sign up at [railway.app](https://railway.app)**

2. **Create PostgreSQL Database:**
   - New → Database → PostgreSQL
   - Copy the `DATABASE_URL`

3. **Deploy Backend:**
   - New → GitHub Repo → Select your repo
   - Add PostgreSQL service
   - Set environment variables:
     ```
     DATABASE_URL=<from PostgreSQL service>
     PORT=3000
     NODE_ENV=production
     ```
   - Set root directory: `backend`
   - Set start command: `npm start`
   - Deploy

4. **Deploy Frontend:**
   - New → Static Site
   - Connect GitHub repo
   - Set root directory: `frontend`
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend-url.railway.app/api
     ```
   - Deploy

**Access:** Railway provides HTTPS URLs automatically

---

### Option 3: Render (Free Tier - 20 minutes)

**Best for:** Free hosting with good performance

1. **Sign up at [render.com](https://render.com)**

2. **Create PostgreSQL Database:**
   - New → PostgreSQL
   - Copy connection string

3. **Deploy Backend:**
   - New → Web Service
   - Connect GitHub repo
   - Settings:
     - Build Command: `cd backend && npm install`
     - Start Command: `cd backend && npm start`
     - Environment: Node
   - Add environment variables:
     ```
     DATABASE_URL=<postgres connection string>
     PORT=3000
     NODE_ENV=production
     ```

4. **Deploy Frontend:**
   - New → Static Site
   - Connect GitHub repo
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend.onrender.com/api
     ```

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

### Database
- [ ] Run migrations on production database
- [ ] Verify connection string is correct
- [ ] Test database connection

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

## Quick Start Commands

### Local Development
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

### Production Build
```bash
# Backend
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate deploy
npm run build
npm start

# Frontend
cd frontend
npm install
npm run build
# Serve dist/ folder
```

---

## Mobile Testing

After deployment, test on mobile:
1. Open deployed URL on phone
2. Grant camera permissions
3. Test barcode scanning
4. Test all features

**Note:** Camera requires HTTPS (ngrok, Railway, Render all provide this)

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
- Run migrations: `npm run prisma:migrate deploy`

---

## Recommended for Beta: ngrok

**Why ngrok for beta:**
- ✅ Fastest setup (5 minutes)
- ✅ HTTPS included
- ✅ Works on any network
- ✅ No credit card needed
- ✅ Easy to share URLs
- ✅ Perfect for testing

**Limitations:**
- Free tier has session limits
- URLs change on restart (unless paid)
- Not for production traffic

**Upgrade path:** Move to Railway/Render when ready for production.


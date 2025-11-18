# Railway Deployment Guide

This project is configured to deploy on Railway using **Nixpacks** (Railway's Node.js builder).

## Quick Deploy Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `inventory-manager` repository
4. Railway will auto-detect it's a Node.js project

#### Configure Backend Service:

**In Railway Dashboard → Your Service → Settings:**

1. **Root Directory:** Set to `backend`
2. **Build Command:** (Auto-detected, but verify)
   ```
   npm ci && npm run prisma:generate && npm run build
   ```
3. **Start Command:** (Auto-detected from `railway.json`)
   ```
   npm run prisma:migrate:deploy && npm start
   ```

#### Add PostgreSQL Database:

1. In Railway project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway automatically sets `DATABASE_URL` environment variable
3. Copy the database URL if needed

#### Environment Variables:

Railway automatically sets:
- `DATABASE_URL` (from PostgreSQL service)
- `PORT` (auto-set by Railway)

You can add manually if needed:
- `NODE_ENV=production`

### 3. Deploy Frontend (Optional - Static Site)

1. In Railway, click **"+ New"** → **"Static Site"**
2. Connect your GitHub repo
3. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Output Directory:** `dist`
   - **Environment Variable:**
     ```
     VITE_API_URL=https://your-backend-url.railway.app/api
     ```
     (Replace with your actual backend URL)

## Configuration Files

### Root `railway.json`
- Tells Railway to use Nixpacks builder
- Sets start command with migrations

### `backend/nixpacks.toml`
- Nixpacks configuration for Node.js 20
- Build and install commands
- Start command with Prisma migrations

### `backend/Dockerfile`
- Fallback Docker configuration
- Used if Nixpacks doesn't work
- Includes Prisma setup and health checks

### `.railwayignore`
- Excludes frontend and dev files from backend deployment
- Reduces build size and time

## Important Notes

1. **Root Directory Must Be Set:** In Railway dashboard, set Root Directory to `backend` for the backend service
2. **Nixpacks vs Railpack:** Railway uses **Nixpacks** for Node.js (not Railpack). Railpack only supports PHP, Go, Java, Rust.
3. **Database Migrations:** Run automatically on deploy via `prisma:migrate:deploy`
4. **HTTPS:** Railway provides HTTPS automatically (required for camera access)

## Troubleshooting

### Build Fails: "npm: command not found"
- **Fix:** Set Root Directory to `backend` in Railway settings
- Railway needs to know where `package.json` is located

### Build Fails: "Railpack could not determine how to build"
- **Fix:** Railway is using Railpack instead of Nixpacks
- The `railway.json` file should force Nixpacks
- Manually set Builder to "NIXPACKS" in Railway dashboard

### Database Connection Errors
- **Fix:** Verify `DATABASE_URL` is set correctly
- Check PostgreSQL service is running
- Ensure migrations ran: Check logs for `prisma migrate deploy`

### API Not Accessible
- **Fix:** Check CORS settings (should allow all origins in beta)
- Verify backend is running: Check Railway logs
- Test health endpoint: `https://your-backend.railway.app/health`

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
railway run npm run prisma:migrate:deploy
```

## Cost

- **Free Tier:** $5 credit/month
- **PostgreSQL:** ~$5/month (covered by free credit)
- **Web Services:** Free for low traffic
- **Total:** FREE for beta testing!

---

**Your app will be live at:** `https://your-backend.railway.app` ✅


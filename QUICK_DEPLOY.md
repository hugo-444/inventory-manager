# Quick Beta Deployment - Ready by Tomorrow! 🚀

## Fastest Option: ngrok (Recommended)

### Step 1: Install ngrok
```bash
brew install ngrok
# Or download from https://ngrok.com/download
```

### Step 2: Start Your Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 3: Expose with ngrok

**Terminal 3 - Backend:**
```bash
ngrok http 3000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

**Terminal 4 - Frontend:**
```bash
ngrok http 5173
```
Copy the HTTPS URL (e.g., `https://xyz789.ngrok-free.app`)

### Step 4: Update Frontend API URL

Create `frontend/.env`:
```bash
VITE_API_URL=https://your-backend-url.ngrok-free.app/api
```

Restart frontend:
```bash
cd frontend
npm run dev
```

### Step 5: Access from Anywhere!

- **Frontend URL:** `https://your-frontend-url.ngrok-free.app`
- **Works on:** Any device, any network
- **HTTPS:** ✅ Required for camera access

---

## Alternative: Railway (More Permanent)

### 1. Sign up at railway.app

### 2. Create PostgreSQL Database
- New → Database → PostgreSQL
- Copy `DATABASE_URL`

### 3. Deploy Backend
- New → GitHub Repo
- Add PostgreSQL service
- Environment variables:
  ```
  DATABASE_URL=<from PostgreSQL>
  PORT=3000
  ```
- Root: `backend`
- Start: `npm start`

### 4. Deploy Frontend
- New → Static Site
- Root: `frontend`
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://your-backend.railway.app/api`

---

## Pre-Flight Checklist

✅ Backend running on port 3000  
✅ Frontend running on port 5173  
✅ Database migrations applied  
✅ Camera permissions tested  
✅ All features working locally  

---

## Mobile Testing

1. Open ngrok URL on phone
2. Grant camera permission
3. Test barcode scanner
4. Test all features

**Camera requires HTTPS** - ngrok provides this automatically!

---

## Troubleshooting

**Camera not working?**
- Must use HTTPS (ngrok provides this)
- Check browser permissions
- Test on real device

**API errors?**
- Verify `VITE_API_URL` in frontend/.env
- Check backend is running
- Verify CORS allows your domain

**Database errors?**
- Run: `npm run prisma:migrate deploy`
- Check `DATABASE_URL` is correct

---

**Ready in 5 minutes with ngrok!** 🎉


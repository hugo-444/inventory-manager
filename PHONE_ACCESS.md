# Accessing the App from Your Phone

## Quick Setup

Your laptop's IP address is: **192.168.1.68**

### Steps:

1. **Make sure both servers are running:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Connect your phone to the same Wi-Fi network as your laptop**

3. **Access the app from your phone's browser:**
   ```
   http://192.168.1.68:5173
   ```

## How It Works

- **Backend**: Already configured to listen on `0.0.0.0` (all network interfaces) on port 3000
- **Frontend**: Now configured to listen on `0.0.0.0` (all network interfaces) on port 5173
- **API URL**: Automatically detects if you're accessing from a different device and uses the correct IP

## Troubleshooting

### Can't access from phone?

1. **Check firewall:**
   - macOS: System Settings → Network → Firewall
   - Make sure Node.js/Vite is allowed through firewall

2. **Verify same network:**
   - Phone and laptop must be on the same Wi-Fi network
   - Check phone's Wi-Fi settings

3. **Try different IP:**
   ```bash
   # Get your IP address
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

4. **Check if servers are running:**
   - Backend: `http://192.168.1.68:3000/health`
   - Frontend: `http://192.168.1.68:5173`

### If IP changes

If your laptop's IP address changes (common with DHCP), you'll need to:
1. Get the new IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. Access the app using the new IP

### Alternative: Use Environment Variable

You can also set a fixed API URL by creating a `.env` file in the `frontend` directory:

```bash
# frontend/.env
VITE_API_URL=http://192.168.1.68:3000/api
```

Then restart the frontend dev server.

## Security Note

⚠️ This setup is for **development only**. For production, use proper security measures like:
- HTTPS
- Authentication
- Firewall rules
- Reverse proxy (nginx)


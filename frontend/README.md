# Frontend

React frontend for Inventory Manager.

## Quick Start

```bash
npm install
npm run dev
```

App available at `http://localhost:5173`

## Features

- 📷 **Scanner Page** - Barcode/UPC scanning with camera
- 📦 **Products Page** - Browse, search, filter products
- 📍 **Locations Page** - View and manage locations
- 📊 **Activity Page** - Inventory movement history

## Backend Connection

Backend should run on `http://localhost:3000`. The frontend automatically detects the API URL.

For production, set `VITE_API_URL` environment variable.

## Tech Stack

- React 19
- React Router DOM
- Vite
- html5-qrcode (camera scanner)

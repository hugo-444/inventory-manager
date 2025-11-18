# Inventory Manager Frontend

React frontend for the Inventory Manager application.

## Features

- **Scanner Page**: Search products by name, style, or UPC. Manual UPC entry supported.
- **Products Page**: Browse all products with search functionality. Shows stock levels.
- **Locations Page**: View location hierarchy (warehouse, aisles, sales floor locations).
- **Activity Page**: View recent inventory movements and changes.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

## Backend Connection

Make sure your backend is running on `http://localhost:3000`. The frontend connects to:
- `http://localhost:3000/api/*`

To change the backend URL, edit `src/services/api.js` and update `API_BASE_URL`.

## Pages

### Scanner (`/scanner`)
- Search products by name, style, or UPC
- Visual scanner interface (ready for camera integration)
- Manual UPC entry
- Product details display

### Products (`/products`)
- List all products
- Search by name, UPC, or style
- Shows stock levels (in-stock/out-of-stock)
- Product cards with details

### Locations (`/locations`)
- Location hierarchy view
- Expandable warehouse structure
- Backroom aisles and sales floor locations
- Add location button (ready for implementation)

### Activity (`/activity`)
- Recent inventory movements
- Movement type badges (Place, Pull, Move, etc.)
- Timestamps (relative time)
- Product IDs and notes

## Navigation

Bottom navigation bar with 4 tabs:
- Scanner
- Products
- Locations
- Activity

## Tech Stack

- React 19
- React Router DOM
- Vite
- CSS (no framework - custom styles)

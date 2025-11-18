# Inventory Manager

Unified inventory management system with scanner-first UX, supporting backroom and sales floor locations, products, styles, variants, and comprehensive inventory movements.

## Features

- 📷 **Scanner-First UX** - Barcode/UPC scanning with camera support
- 📦 **Product Management** - Products, styles, variants, departments
- 📍 **Location System** - Backroom (aisles/columns/bays) and sales floor locations
- 🔄 **Inventory Movements** - Place, pull, move, audit, adjust
- 📊 **Real-time Tracking** - Stock levels, movement history, location visibility
- 🎯 **Unknown Product Handling** - Auto-creates stub products for new UPCs

## Tech Stack

**Backend:**
- Node.js + TypeScript
- Fastify (web framework)
- Prisma (ORM)
- PostgreSQL

**Frontend:**
- React 19
- Vite
- React Router
- html5-qrcode (camera scanner)

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- npm or yarn

### Setup

1. **Clone and install:**
```bash
git clone <repo-url>
cd inventory-manager
```

2. **Backend setup:**
```bash
cd backend
npm install
cp .env.example .env  # Edit with your DATABASE_URL
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed  # Optional: seed with sample data
npm run dev
```

3. **Frontend setup:**
```bash
cd frontend
npm install
npm run dev
```

4. **Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/health

## Project Structure

```
inventory-manager/
├── backend/           # Node.js/Fastify API
│   ├── prisma/        # Database schema & migrations
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic
│   │   └── utils/     # Utilities
│   └── package.json
├── frontend/          # React app
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── components/# Reusable components
│   │   └── services/  # API client
│   └── package.json
└── docs/              # Documentation
```

## Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide (Railway, ngrok)
- **[DEBUGGING.md](./DEBUGGING.md)** - Debugging guide for frontend & backend
- **[docs/actions.md](./docs/actions.md)** - Complete API action reference
- **[docs/README.md](./docs/README.md)** - Documentation index

## Development

### Backend Commands
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run prisma:studio # Open Prisma Studio (database GUI)
```

### Frontend Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## API Endpoints

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product
- `GET /api/products/upc/:upc` - Get product by UPC (auto-creates if not found)
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `GET /api/products/:id/locations` - Get all locations for product

### Locations
- `GET /api/locations/backroom` - List backroom locations
- `POST /api/locations/backroom` - Create backroom location
- `GET /api/locations/sales-floor` - List sales floor locations
- `POST /api/locations/sales-floor` - Create sales floor location
- `GET /api/locations/:code` - Get location by code
- `GET /api/locations/:code/products` - Get products at location

### Inventory
- `POST /api/inventory/place-in-back` - Place product in backroom
- `POST /api/inventory/pull-from-back` - Pull from backroom
- `POST /api/inventory/place-on-floor` - Place on sales floor
- `POST /api/inventory/move-on-floor` - Move on sales floor
- `POST /api/inventory/move` - Generic move between locations
- `POST /api/inventory/adjust` - Manual inventory adjustment
- `POST /api/inventory/audit-location` - Audit entire location
- `GET /api/inventory/movements` - List inventory movements

See [docs/actions.md](./docs/actions.md) for complete API reference.

## Security

⚠️ **Never commit secrets to GitHub!**

- `.env` files are in `.gitignore`
- Set environment variables in deployment platform (Railway, etc.)
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for security checklist

## License

ISC


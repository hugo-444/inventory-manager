# Backend API

Node.js/TypeScript backend with Fastify, Prisma, and PostgreSQL.

## Quick Start

```bash
npm install
cp .env.example .env  # Edit with your DATABASE_URL
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

API available at `http://localhost:3000`

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Seed script
├── src/
│   ├── index.ts               # Fastify app entry
│   ├── config.ts              # Configuration
│   ├── lib/prisma.ts          # Prisma client
│   ├── utils/locationParser.ts # Location code parsers
│   ├── services/              # Business logic
│   └── routes/                # API endpoints
└── package.json
```

## Commands

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run prisma:seed      # Seed database with sample data
```

## API Endpoints

See [../docs/actions.md](../docs/actions.md) for complete API reference.

**Main endpoints:**
- Products: `/api/products/*`
- Locations: `/api/locations/*`
- Inventory: `/api/inventory/*`
- Styles: `/api/styles/*`


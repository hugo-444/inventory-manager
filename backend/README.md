# Inventory Manager Backend (Prisma)

Unified inventory management backend built with:
- **Prisma** - Type-safe ORM
- **Fastify** - Fast web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your database URL
```

3. **Generate Prisma Client:**
```bash
npm run prisma:generate
```

4. **Run migrations:**
```bash
npm run prisma:migrate
```

5. **Start development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`
API documentation at `http://localhost:3000/docs`

## Project Structure

```
backend-prisma/
├── prisma/
│   ├── schema.prisma          # Prisma schema
│   └── seed.ts                # Database seed script
├── src/
│   ├── index.ts               # Fastify app entry
│   ├── config.ts              # Configuration
│   ├── lib/
│   │   └── prisma.ts          # Prisma client
│   ├── utils/
│   │   └── locationParser.ts  # Location code parsers
│   ├── services/
│   │   ├── productService.ts
│   │   ├── styleService.ts
│   │   ├── locationService.ts
│   │   └── inventoryService.ts
│   └── routes/
│       ├── products.ts
│       ├── styles.ts
│       ├── locations.ts
│       └── inventory.ts
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Styles
- `GET /api/styles` - List styles
- `GET /api/styles/:id` - Get style
- `POST /api/styles` - Create style
- `PUT /api/styles/:id` - Update style
- `DELETE /api/styles/:id` - Delete style

### Locations
- `GET /api/locations/departments` - List departments
- `POST /api/locations/departments` - Create department
- `GET /api/locations/sales-floor` - List sales floor locations
- `POST /api/locations/sales-floor` - Create sales floor location
- `GET /api/locations/backroom` - List backroom locations
- `POST /api/locations/backroom` - Create backroom location

### Inventory Movements
- `GET /api/inventory/movements` - List movements
- `POST /api/inventory/place-in-back` - Place in backroom
- `POST /api/inventory/pull-from-back` - Pull from backroom
- `POST /api/inventory/audit-backroom` - Audit backroom
- `POST /api/inventory/place-on-floor` - Place on sales floor
- `POST /api/inventory/move-on-floor` - Move on sales floor
- `POST /api/inventory/remove-from-floor` - Remove from floor

## Prisma Commands

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)


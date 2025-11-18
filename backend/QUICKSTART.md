# Prisma Backend Quick Start

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your PostgreSQL database URL
```

3. **Generate Prisma Client:**
```bash
npm run prisma:generate
```

4. **Run migrations:**
```bash
npm run prisma:migrate
# Name it: init
```

5. **Start development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Example API Usage

### Create a Style
```bash
curl -X POST "http://localhost:3000/api/styles" \
  -H "Content-Type: application/json" \
  -d '{
    "styleCode": "MT02",
    "name": "MT02 Dress Set",
    "description": "Summer dress collection"
  }'
```

### Create a Product
```bash
curl -X POST "http://localhost:3000/api/products" \
  -H "Content-Type: application/json" \
  -d '{
    "upc": "123456789012",
    "styleId": "<style_id_from_above>",
    "name": "MT02 Dress - Red - Medium",
    "price": 29.99,
    "color": "Red",
    "size": "M"
  }'
```

### Create a Department
```bash
curl -X POST "http://localhost:3000/api/locations/departments" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "Fash",
    "name": "Fashion"
  }'
```

### Create a Parent Fixture
```bash
curl -X POST "http://localhost:3000/api/locations/parent-fixtures" \
  -H "Content-Type: application/json" \
  -d '{
    "departmentId": "<department_id>",
    "parentCode": "MT02",
    "type": "table",
    "description": "Main display table"
  }'
```

### Create a Section
```bash
curl -X POST "http://localhost:3000/api/locations/sections" \
  -H "Content-Type: application/json" \
  -d '{
    "parentFixtureId": "<parent_fixture_id>",
    "sectionCode": "(99)",
    "sectionType": "bunker",
    "description": "Section 99"
  }'
```

### Create a Sales Floor Location
```bash
curl -X POST "http://localhost:3000/api/locations/sales-floor" \
  -H "Content-Type: application/json" \
  -d '{
    "departmentCode": "Fash",
    "parentCode": "MT02",
    "sectionCode": "99"
  }'
```

### Create a Backroom Location
```bash
curl -X POST "http://localhost:3000/api/locations/backroom" \
  -H "Content-Type: application/json" \
  -d '{
    "locationCode": "04C12"
  }'
```

### Place Product in Backroom
```bash
curl -X POST "http://localhost:3000/api/inventory/place-in-back" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<product_id>",
    "backroomLocationCode": "04C12",
    "qty": 10,
    "notes": "Initial stock placement"
  }'
```

### Place Product on Sales Floor
```bash
curl -X POST "http://localhost:3000/api/inventory/place-on-floor" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<product_id>",
    "salesFloorLocationCode": "FashMT02(99)",
    "qty": 5,
    "notes": "Placed on sales floor"
  }'
```

### Pull Product from Backroom
```bash
curl -X POST "http://localhost:3000/api/inventory/pull-from-back" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<product_id>",
    "backroomLocationCode": "04C12",
    "qty": 3,
    "notes": "Restocking sales floor"
  }'
```

### Move Product on Sales Floor
```bash
curl -X POST "http://localhost:3000/api/inventory/move-on-floor" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<product_id>",
    "fromSalesFloorLocationCode": "FashMT02(99)",
    "toSalesFloorLocationCode": "FashMT02(2)",
    "qty": 2,
    "notes": "Reorganizing display"
  }'
```

### Audit Backroom Location
```bash
curl -X POST "http://localhost:3000/api/inventory/audit-backroom" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<product_id>",
    "backroomLocationCode": "04C12",
    "actualQty": 7,
    "notes": "Physical count audit"
  }'
```

## Location Code Formats

### Sales Floor
- Format: `{DepartmentCode}{ParentCode}({SectionCode})`
- Examples:
  - `FashMT02(99)` - Fashion department, MT02 fixture, section 99
  - `MensUT03` - Mens department, UT03 fixture, no section
  - `KidsMTW3(2)` - Kids department, MTW3 fixture, section 2

### Backroom
- Format: `{AisleNumber}{ColumnLetter}{BayNumber}`
- Examples:
  - `04C12` - Aisle 4, Column C, Bay 12
  - `1A5` - Aisle 1, Column A, Bay 5
  - `7Z20` - Aisle 7, Column Z, Bay 20

### Overflow
- Format: `O{Number}TT{Number}`
- Examples:
  - `O4TT88` - Overflow tote 4TT88
  - `O1TT01` - Overflow tote 1TT01


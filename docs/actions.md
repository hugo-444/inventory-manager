# Inventory Manager - Action Documentation

## 0. Big Picture: What This App Is

### Name / Concept
A scanner-first inventory manager that can adapt to:
- A giant big-box chain backroom
- A small boutique with two storage shelves
- Someone's OCD home storage room

### The Core Idea
"Any scanned identifier (UPC, QR, etc.) can be turned into a product record and then associated with one or more locations (backroom, sales floor, overflow, virtual). The backend is generic; the 'store layout' is data, not hard-coded."

---

## 1. Domains & Entities (Mental Model)

You have (already, conceptually):

### Product
- `id`, `upc`, `styleId`, `name`, `price`, `color`, `size`, `imageUrl`
- Links to `Style` (grouping of related products)
- Has stock in multiple locations via `ProductBackroomStock` and `ProductSalesFloorStock`

### Location (abstract)
- **BackroomLocation**: `id`, `locationCode` (e.g., `04C12`, `O4TT88`)
  - Hierarchical: `BackroomAisle` → `BackroomColumn` → `BackroomBay`
  - Overflow: `OverflowTote` with custom codes
- **SalesFloorLocation**: `id`, `locationCode` (e.g., `FashMT02(99)`)
  - Hierarchical: `Department` → `ParentFixture` → `Section`
  - Flexible metadata via relationships

### InventoryState / InventoryMovement
- `ProductBackroomStock`: product + backroom location + qty
- `ProductSalesFloorStock`: product + sales floor location + qty
- `InventoryMovement`: tracks all state changes (place, pull, move, audit)

### Department / Style
- `Department`: optional grouping (Fashion, Mens, Kids, etc.)
- `Style`: product family/group (e.g., "MT02 Dress Set")
- `ParentFixture`: physical fixtures (tables, walls, bars, spinners, etc.)

---

## 2. Standard Action Documentation Template

Every action below is described with:
- **Name**
- **Domain**
- **Intent / Why it exists**
- **Primary Trigger** (scan / click / scheduled)
- **HTTP Endpoint** (example)
- **Request** (shape)
- **Response** (shape)
- **State Changes**
- **Validation / Errors**
- **Future Evolutions**

---

## 3. Scanner & Product Lookup Actions

### 3.1 Scan Product by UPC (Existing Product)

**Name**  
Scan Product by UPC (Existing)

**Domain**  
Scanner / Product / Lookup

**Intent**  
When something is scanned, instantly show everything we know: product info + locations + stock.

**Primary Trigger**  
Scanner sends UPC → Frontend calls backend.

**HTTP Endpoint**  
`GET /api/products/upc/:upc`

**Request**
- Params: `upc: string`

**Response (200)**
```json
{
  "id": "uuid",
  "upc": "777777777777",
  "styleId": "uuid",
  "name": "Black Cargo Pants",
  "price": 49.99,
  "color": "Black",
  "size": "M",
  "style": {
    "id": "uuid",
    "styleCode": "MT02",
    "name": "Cargo Pants Set"
  },
  "backStock": [
    {
      "id": "uuid",
      "qty": 6,
      "location": {
        "id": "uuid",
        "locationCode": "04C12"
      }
    }
  ],
  "salesStock": [
    {
      "id": "uuid",
      "qty": 3,
      "location": {
        "id": "uuid",
        "locationCode": "FashMT02(99)"
      }
    }
  ]
}
```

**State Changes**  
None (read-only).

**Validation / Errors**
- `404` if product not found
- `400` if UPC invalid format

**Future Evolutions**
- Accept QR or internal IDs (scanType field)
- Track scan history (who scanned what, where, when)
- Batch scan multiple products

---

### 3.2 Scan Product by UPC (Unknown Product → Create "Stub")

**Name**  
Scan Unknown Product (Create Stub Product)

**Domain**  
Scanner / Product / Onboarding

**Intent**  
If you scan something not known to the system, we want to create a "stub" product now so it can be filled in later.

**Trigger**  
Scan UPC → no product → frontend prompts: "Create new product stub?"

**HTTP Endpoint**  
`POST /api/products` (with minimal fields)

**Request**
```json
{
  "upc": "999999999999",
  "name": "Unknown Product",
  "price": 0,
  "styleId": null
}
```

**Response (201)**
```json
{
  "id": "uuid",
  "upc": "999999999999",
  "name": "Unknown Product",
  "price": 0,
  "styleId": null,
  "status": "PENDING_DETAILS",
  "backStock": [],
  "salesStock": []
}
```

**State Changes**
- Creates product row with minimal fields
- Marks as needing completion

**Validation / Errors**
- `409` if UPC already exists
- `400` if UPC invalid

**Future Evolutions**
- Auto-enrich from external APIs (GS1/etc) later
- Flag these stub products for manager review in a "To Complete" queue
- Bulk import from vendor catalogs

---

## 4. Backroom Management Actions

### 4.1 Create Backroom Location (Flexible)

**Name**  
Create Backroom Location

**Domain**  
Backroom / Location Model

**Intent**  
Define a new place where items can live. The logic parses location codes like `04C12` (aisle 4, column C, bay 12) or `O4TT88` (overflow tote).

**Trigger**
- Backend seed script
- UI "Add Location" modal in Location Management page

**HTTP Endpoint**  
`POST /api/locations/backroom`

**Request**
```json
{
  "locationCode": "04C12"
}
```

**Response (201)**
```json
{
  "id": "uuid",
  "locationCode": "04C12",
  "aisle": {
    "id": "uuid",
    "aisleNumber": 4
  },
  "column": {
    "id": "uuid",
    "columnLetter": "C"
  },
  "bay": {
    "id": "uuid",
    "bayNumber": 12,
    "type": "tray"
  }
}
```

**State Changes**
- Creates/updates `BackroomAisle`, `BackroomColumn`, `BackroomBay` if needed
- Creates `BackroomLocation` with parsed relationships
- For overflow: creates `OverflowTote` and links it

**Validation / Errors**
- `409` if location code already exists
- `400` if location code format invalid (can't parse)
- Validates aisle (1-7), column (A-Z), bay (1-20)

**Future Evolutions**
- Templates for different store layouts (grid, room/shelf/box, free-form)
- "Duplicate location" for adding similar bays quickly
- Visual backroom map

---

### 4.2 Place Inventory in Backroom ("Place in Back")

**Name**  
Place in Backroom Location

**Domain**  
Inventory / Movement / Backroom

**Intent**  
Record that X units of a product are placed into a specific backroom location.

**Trigger**  
From product detail page → "Place in back" action → enter location code and quantity.

**HTTP Endpoint**  
`POST /api/inventory/place-in-back`

**Request**
```json
{
  "productId": "uuid",
  "backroomLocationCode": "04C12",
  "qty": 10,
  "notes": "New shipment into backroom"
}
```

**Response (200)**
```json
{
  "id": "uuid",
  "productId": "uuid",
  "type": "PLACE_IN_BACK",
  "qty": 10,
  "toBackroomLocation": {
    "id": "uuid",
    "locationCode": "04C12"
  },
  "timestamp": "2025-11-16T15:00:00Z",
  "notes": "New shipment into backroom"
}
```

**State Changes**
- Creates/updates `ProductBackroomStock` (increases qty or creates new)
- Creates `InventoryMovement` row with type `PLACE_IN_BACK`
- Creates location if it doesn't exist (via location code parser)

**Validation / Errors**
- `400` if qty <= 0
- `404` if product not found
- `400` if location code invalid format
- Optional: reject if capacity exceeded (future)

**Future Evolutions**
- Batch place multiple products into same location
- Support "suggested best location" engine
- Auto-detect location from barcode scanner

---

### 4.3 Pull Inventory from Backroom ("Pull from Back")

**Name**  
Pull from Backroom Location

**Domain**  
Inventory / Movement

**Intent**  
Record that X units are removed from backroom (probably to sales floor or unknown destination).

**HTTP Endpoint**  
`POST /api/inventory/pull-from-back`

**Request**
```json
{
  "productId": "uuid",
  "backroomLocationCode": "04C12",
  "qty": 5,
  "notes": "Replenishing sales floor"
}
```

**Response (200)**
```json
{
  "id": "uuid",
  "type": "PULL_FROM_BACK",
  "qty": 5,
  "fromBackroomLocation": {
    "id": "uuid",
    "locationCode": "04C12"
  },
  "timestamp": "2025-11-16T15:00:00Z"
}
```

**State Changes**
- Decreases `ProductBackroomStock.qty` for that location
- Creates `InventoryMovement` record with type `PULL_FROM_BACK`
- If qty reaches 0, stock record remains (for audit history)

**Validation / Errors**
- `400` if qty > available stock
- `400` if qty <= 0
- `404` if product or location not found
- `400` if negative stock would result

**Future Evolutions**
- "Pull to specific sales floor location" directly (combine with place-on-floor)
- Pull suggestions based on "To Pull" list
- Batch pull multiple products

---

### 4.4 Audit Backroom Bin ("Audit bin")

**Name**  
Audit Backroom Location

**Domain**  
Inventory / Audit / Quality

**Intent**  
Physically count what's in a location and reconcile the system's view.

**HTTP Endpoint**  
`POST /api/inventory/audit-backroom`

**Request**
```json
{
  "productId": "uuid",
  "backroomLocationCode": "04C12",
  "actualQty": 7,
  "notes": "Physical count completed"
}
```

**Response (200)**
```json
{
  "id": "uuid",
  "type": "AUDIT_BACKROOM",
  "productId": "uuid",
  "toBackroomLocation": {
    "id": "uuid",
    "locationCode": "04C12"
  },
  "qty": 7,
  "timestamp": "2025-11-16T15:00:00Z",
  "notes": "Physical count completed"
}
```

**State Changes**
- Sets `ProductBackroomStock.qty` = `actualQty` (creates if doesn't exist)
- Logs an `InventoryMovement` of type `AUDIT_BACKROOM`
- Updates `lastAuditDate` on stock record

**Validation / Errors**
- `400` if actualQty < 0
- `404` if product or location not found
- Optionally require supervisor approval for large adjustments (future)

**Future Evolutions**
- Full location audit (all products in a bin/shelf in one go)
- Audit scorecards & history
- Variance reporting (expected vs actual)

---

## 5. Sales Floor Location Management

### 5.1 Create Sales Floor Location

**Name**  
Create Sales Floor Location

**Domain**  
SalesFloor / Location

**Intent**  
Define a flexible retail presentation location using department + parent fixture + optional section (e.g., `FashMT02(99)`).

**HTTP Endpoint**  
`POST /api/locations/sales-floor`

**Request**
```json
{
  "departmentCode": "Fash",
  "parentCode": "MT02",
  "sectionCode": "99"
}
```

**Response (201)**
```json
{
  "id": "uuid",
  "locationCode": "FashMT02(99)",
  "department": {
    "id": "uuid",
    "code": "Fash",
    "name": "Fashion"
  },
  "parentFixture": {
    "id": "uuid",
    "parentCode": "MT02",
    "type": "table"
  },
  "section": {
    "id": "uuid",
    "sectionCode": "(99)",
    "sectionType": "bunker"
  }
}
```

**State Changes**
- Creates/updates `Department`, `ParentFixture`, `Section` if needed
- Creates `SalesFloorLocation` with composite `locationCode`

**Validation / Errors**
- `409` if location code already exists
- `400` if department or parent fixture not found
- `400` if section code format invalid

**Future Evolutions**
- Visual floor map representation
- Planogram integration
- Zone-based organization

---

### 5.2 Place Product on Sales Floor

**Name**  
Place Product on Sales Floor

**Domain**  
Inventory / SalesFloor

**Intent**  
Record that a product is now physically located in a sales floor location.

**HTTP Endpoint**  
`POST /api/inventory/place-on-floor`

**Request**
```json
{
  "productId": "uuid",
  "salesFloorLocationCode": "FashMT02(99)",
  "qty": 4,
  "notes": "Placed on sales floor"
}
```

**Response (200)**
```json
{
  "id": "uuid",
  "type": "PLACE_ON_FLOOR",
  "productId": "uuid",
  "qty": 4,
  "toSalesFloorLocation": {
    "id": "uuid",
    "locationCode": "FashMT02(99)"
  },
  "timestamp": "2025-11-16T15:00:00Z"
}
```

**State Changes**
- Creates/updates `ProductSalesFloorStock` (increases qty or creates new)
- Creates `InventoryMovement` row with type `PLACE_ON_FLOOR`
- Creates location if it doesn't exist

**Validation / Errors**
- `400` if qty <= 0
- `404` if product not found
- `400` if location code invalid format

**Future Evolutions**
- Batch place multiple products
- Auto-suggest based on product style/department

---

### 5.3 Move Product on Sales Floor

**Name**  
Move on Sales Floor

**Domain**  
Inventory / SalesFloor

**Intent**  
Move product from one sales floor location to another (rearrangement, restocking, etc.).

**HTTP Endpoint**  
`POST /api/inventory/move-on-floor`

**Request**
```json
{
  "productId": "uuid",
  "fromSalesFloorLocationCode": "FashMT02(99)",
  "toSalesFloorLocationCode": "FashMT02(2)",
  "qty": 2,
  "notes": "Moving to front section"
}
```

**Response (200)**
```json
{
  "id": "uuid",
  "type": "MOVE_ON_FLOOR",
  "productId": "uuid",
  "qty": 2,
  "fromSalesFloorLocation": {
    "id": "uuid",
    "locationCode": "FashMT02(99)"
  },
  "toSalesFloorLocation": {
    "id": "uuid",
    "locationCode": "FashMT02(2)"
  },
  "timestamp": "2025-11-16T15:00:00Z"
}
```

**State Changes**
- Decreases `ProductSalesFloorStock.qty` at from location
- Increases `ProductSalesFloorStock.qty` at to location
- Creates `InventoryMovement` with type `MOVE_ON_FLOOR`

**Validation / Errors**
- `400` if qty > available at from location
- `400` if from and to locations are the same
- `404` if product or locations not found

**Future Evolutions**
- Batch move multiple products
- Move entire style/family at once

---

### 5.4 Remove Product from Sales Floor

**Name**  
Remove from Sales Floor

**Domain**  
Inventory / SalesFloor

**Intent**  
Record that product is removed from sales floor (damaged, returned, stolen, etc.).

**HTTP Endpoint**  
`POST /api/inventory/remove-from-floor`

**Request**
```json
{
  "productId": "uuid",
  "salesFloorLocationCode": "FashMT02(99)",
  "qty": 1,
  "notes": "Damaged item removed"
}
```

**Response (200)**
```json
{
  "id": "uuid",
  "type": "REMOVE_FROM_FLOOR",
  "productId": "uuid",
  "qty": 1,
  "fromSalesFloorLocation": {
    "id": "uuid",
    "locationCode": "FashMT02(99)"
  },
  "timestamp": "2025-11-16T15:00:00Z"
}
```

**State Changes**
- Decreases `ProductSalesFloorStock.qty`
- Creates `InventoryMovement` with type `REMOVE_FROM_FLOOR`

**Validation / Errors**
- `400` if qty > available
- `404` if product or location not found

**Future Evolutions**
- Categorize removal reasons (damaged, stolen, returned, etc.)
- Link to return/damage processing workflow

---

## 6. Product & Style Management

### 6.1 Create / Update Style

**Name**  
Upsert Style

**Domain**  
Catalog / Style

**Intent**  
Style represents the "design" (e.g., "Men's Black Cargo Pant") independent of size, color, etc.

**HTTP Endpoint**  
`POST /api/styles` (create)  
`PUT /api/styles/:id` (update)

**Request**
```json
{
  "styleCode": "MT02",
  "name": "Cargo Pants Set",
  "description": "Classic cargo pants with multiple pockets"
}
```

**Response (200/201)**
```json
{
  "id": "uuid",
  "styleCode": "MT02",
  "name": "Cargo Pants Set",
  "description": "Classic cargo pants with multiple pockets"
}
```

**Core Fields**
- `styleCode` (unique identifier)
- `name`
- `description` (optional)

**State Changes**
- Creates or updates `Style` record

**Validation / Errors**
- `409` if styleCode already exists (on create)
- `404` if style not found (on update)

**Future Evolutions**
- Link to department/category
- Default attributes (fit, fabric, etc.)
- Style images/galleries

---

### 6.2 Create / Update Product (Variant SKU)

**Name**  
Upsert Product

**Domain**  
Catalog / Product

**Intent**  
Each product = one sellable SKU (e.g., Style X, size M, color Black).

**HTTP Endpoint**  
`POST /api/products` (create)  
`PUT /api/products/:id` (update)

**Request**
```json
{
  "upc": "777777777777",
  "styleId": "uuid",
  "name": "Black Cargo Pants - Medium",
  "price": 49.99,
  "color": "Black",
  "size": "M"
}
```

**Response (200/201)**
```json
{
  "id": "uuid",
  "upc": "777777777777",
  "styleId": "uuid",
  "name": "Black Cargo Pants - Medium",
  "price": 49.99,
  "color": "Black",
  "size": "M",
  "createdAt": "2025-11-16T15:00:00Z",
  "updatedAt": "2025-11-16T15:00:00Z"
}
```

**Core Fields**
- `upc` (unique)
- `styleId` (optional, links to Style)
- `name`
- `price`
- `color`, `size` (optional attributes)
- `imageUrl` (optional)

**State Changes**
- Creates or updates `Product` record

**Validation / Errors**
- `409` if UPC already exists (on create)
- `404` if product not found (on update)
- `400` if styleId invalid (if provided)

**Future Evolutions**
- Bulk import from vendor catalogs
- Auto-generate product names from style + attributes
- Product images/variants

---

## 7. Department / Spreadsheet / Mock Data

### 7.1 Import Department Inventory from Spreadsheet

**Name**  
Import Department Inventory

**Domain**  
Admin / Mock Data / Department

**Intent**  
Allow you to have one spreadsheet per department to seed or override inventory data, super modular.

**Trigger**  
Admin UI or dev script: `npm run import:csv`

**HTTP Endpoint**  
`POST /api/admin/import/department` (future)  
Currently: `node scripts/import-csv.js` (CLI script)

**Request**  
CSV files in `/data/csv/` directory:
- `departments.csv`
- `styles.csv`
- `products.csv`
- `backroom-locations.csv`
- `sales-floor-locations.csv`
- `stock.csv`

**Response**  
Console output with summary:
```
✅ Imported 10 departments
✅ Imported 25 styles
✅ Imported 150 products
✅ Imported 50 backroom locations
✅ Imported 30 sales floor locations
✅ Imported 200 stock records
```

**State Changes**
- Upserts all entities from CSV
- Creates relationships (products → styles, stock → locations)
- Uses `upsert` to allow re-running without duplicates

**Validation / Errors**
- Skips rows with invalid data (logs warnings)
- Validates required fields
- Handles missing relationships gracefully

**Future Evolutions**
- Versioned imports: undo/rollback
- Per-department sync modes: "overwrite vs merge"
- Web UI for CSV upload
- Real-time import progress

---

## 8. "To Pull" & Workflows

### 8.1 Generate "To Pull" List

**Name**  
Generate To-Pull List

**Domain**  
Replenishment / Automation

**Intent**  
Show a list of items that need to be pulled from backroom to floor.

**HTTP Endpoint**  
`GET /api/replenishment/to-pull` (future)

**Response** (proposed)
```json
{
  "items": [
    {
      "productId": "uuid",
      "upc": "777777777777",
      "name": "Black Cargo Pants",
      "floorLocationCode": "FashMT02(99)",
      "currentFloorQty": 2,
      "targetFloorQty": 8,
      "backroomLocationCandidates": [
        { "code": "04C12", "qty": 6 }
      ]
    }
  ]
}
```

**State Changes**  
None (read-only, calculated view)

**Future Evolutions**
- Support "Push complete" mark once workers finish
- Optimize route/path through backroom
- Auto-generate pull lists based on sales floor thresholds
- Integration with sales data for demand forecasting

---

## 9. Admin & Config Actions

### 9.1 List All Departments

**Name**  
Get Departments

**Domain**  
Admin / Configuration

**HTTP Endpoint**  
`GET /api/locations/departments`

**Response**
```json
[
  {
    "id": "uuid",
    "code": "Fash",
    "name": "Fashion"
  }
]
```

---

### 9.2 List Parent Fixtures

**Name**  
Get Parent Fixtures

**Domain**  
Admin / Configuration

**HTTP Endpoint**  
`GET /api/locations/parent-fixtures?departmentId=uuid`

**Response**
```json
[
  {
    "id": "uuid",
    "parentCode": "MT02",
    "type": "table",
    "departmentId": "uuid"
  }
]
```

---

### 9.3 List Inventory Movements

**Name**  
Get Inventory Movements

**Domain**  
Activity / Audit Trail

**HTTP Endpoint**  
`GET /api/inventory/movements?take=50&skip=0`

**Response**
```json
[
  {
    "id": "uuid",
    "type": "PLACE_IN_BACK",
    "productId": "uuid",
    "qty": 10,
    "toBackroomLocation": {
      "locationCode": "04C12"
    },
    "timestamp": "2025-11-16T15:00:00Z",
    "notes": "New shipment"
  }
]
```

---

## 10. Codebase Walkthrough Guide

### Step 1 — Understand the Domain

1. **Open `/backend/prisma/schema.prisma`**
   - Core models:
     - `Product`, `Style` (catalog)
     - `Department`, `ParentFixture`, `Section`, `SalesFloorLocation` (sales floor hierarchy)
     - `BackroomAisle`, `BackroomColumn`, `BackroomBay`, `OverflowTote`, `BackroomLocation` (backroom hierarchy)
     - `ProductBackroomStock`, `ProductSalesFloorStock` (inventory state)
     - `InventoryMovement` (audit trail)

2. **Map models to actions:**
   - Every model should map to at least one documented action above
   - `InventoryMovement` is the central log for all state changes

**Goal:** Map every model → to at least one documented action.

---

### Step 2 — Map Routes to Domains

1. **Go to `/backend/src/routes/`**
   - `products.ts` - Product CRUD + UPC lookup
   - `styles.ts` - Style management
   - `locations.ts` - Location CRUD (backroom + sales floor)
   - `inventory.ts` - All movement actions (place, pull, move, audit)

2. **For each route file:**
   - Every endpoint should reference an action in this doc
   - Example: `// Action: Scan Product by UPC (Existing)` - see 3.1

**Current Route Structure:**
```
/api/products
  GET    /api/products              # List products
  GET    /api/products/:id           # Get by ID
  GET    /api/products/upc/:upc      # Action: 3.1 Scan Product by UPC
  POST   /api/products               # Action: 3.2 Create Product (or 6.2)
  PUT    /api/products/:id           # Action: 6.2 Update Product
  DELETE /api/products/:id           # Delete product

/api/locations
  GET    /api/locations/backroom              # List backroom locations
  GET    /api/locations/sales-floor            # List sales floor locations
  GET    /api/locations/departments            # Action: 9.1 List Departments
  GET    /api/locations/parent-fixtures        # Action: 9.2 List Parent Fixtures
  POST   /api/locations/backroom               # Action: 4.1 Create Backroom Location
  POST   /api/locations/sales-floor            # Action: 5.1 Create Sales Floor Location

/api/inventory
  GET    /api/inventory/movements              # Action: 9.3 List Movements
  POST   /api/inventory/place-in-back          # Action: 4.2 Place in Backroom
  POST   /api/inventory/pull-from-back          # Action: 4.3 Pull from Backroom
  POST   /api/inventory/audit-backroom         # Action: 4.4 Audit Backroom
  POST   /api/inventory/place-on-floor         # Action: 5.2 Place on Sales Floor
  POST   /api/inventory/move-on-floor          # Action: 5.3 Move on Sales Floor
  POST   /api/inventory/remove-from-floor      # Action: 5.4 Remove from Sales Floor
```

---

### Step 3 — Verify "Scanner-centric" Flows

1. **Find `GET /api/products/upc/:upc` handler**
   - File: `/backend/src/routes/products.ts`
   - Service: `/backend/src/services/productService.ts`
   - Confirms:
     - Looks up by UPC
     - Includes locations + stock in result (via Prisma `include`)
     - Returns 404 if not found

2. **Add path for unknown UPC → stub creation:**
   - Currently: `POST /api/products` can create minimal product
   - Future: Add explicit "stub" endpoint with `status: PENDING_DETAILS`

**Frontend Integration:**
- Scanner page: `/frontend/src/pages/Scanner.jsx`
- Calls `api.getProductByUpc(upc)` → shows product modal with actions

---

### Step 4 — Check Flexibility of Location Logic

1. **Location Code Parsing:**
   - File: `/backend/src/utils/locationParser.ts` (if exists)
   - Or: Logic in `/backend/src/services/locationService.ts`
   - Verifies:
     - Backroom: `04C12` → aisle 4, column C, bay 12
     - Overflow: `O4TT88` → overflow tote
     - Sales Floor: `FashMT02(99)` → department + fixture + section

2. **Location Creation:**
   - Backroom: Creates hierarchy automatically from code
   - Sales Floor: Requires department + parent fixture (section optional)
   - Both support flexible metadata via relationships

**Key Point:** Location rules live in **service layer**, NOT hard-coded in models.

---

### Step 5 — Inventory Movement & Audits

1. **Check `InventoryMovement` model:**
   - Supports `fromBackroomLocationId`, `toBackroomLocationId`
   - Supports `fromSalesFloorLocationId`, `toSalesFloorLocationId`
   - Type enum: `PLACE_IN_BACK`, `PULL_FROM_BACK`, `AUDIT_BACKROOM`, `PLACE_ON_FLOOR`, `MOVE_ON_FLOOR`, `REMOVE_FROM_FLOOR`

2. **Verify movement endpoints:**
   - File: `/backend/src/routes/inventory.ts`
   - Service: `/backend/src/services/inventoryService.ts`
   - Each action:
     - Adjusts stock in one place (service layer)
     - Logs movement for every state change
     - Validates qty, locations, product existence

**Stock Updates:**
- `ProductBackroomStock` / `ProductSalesFloorStock` are updated via upsert
- Movement records are always created (immutable audit trail)

---

### Step 6 — Seed & Mock Data

1. **Open `/backend/prisma/seed.js`**
   - Creates example:
     - Departments (Fashion, Mens, Kids)
     - Styles (MT02, UT03, etc.)
     - Products with various attributes
     - Backroom locations (aisles 1-7, various columns/bays)
     - Sales floor locations (FashMT02(99), etc.)
     - Stock records (products in locations)

2. **CSV Import:**
   - Script: `/backend/scripts/import-csv.js`
   - Data: `/data/csv/*.csv`
   - Run: `npm run import:csv`

3. **Test:**
   - Run migrations: `npm run prisma:migrate`
   - Run seed: `npm run prisma:seed`
   - Hit endpoints with Postman/curl to confirm

---

### Step 7 — Frontend Integration

1. **API Service:**
   - File: `/frontend/src/services/api.js`
   - Maps all backend endpoints to frontend functions
   - Handles errors consistently

2. **Scanner Page:**
   - File: `/frontend/src/pages/Scanner.jsx`
   - Calls: `api.getProductByUpc(upc)` → shows product modal
   - Product modal has action buttons (place, pull, move, etc.)

3. **Products Page:**
   - File: `/frontend/src/pages/Products.jsx`
   - Lists all products with stock totals
   - Click product → modal with full details + actions

4. **Locations Page:**
   - File: `/frontend/src/pages/Locations.jsx`
   - Shows hierarchy (warehouse → aisles → locations)
   - "Add Location" button → modal for creating locations

5. **Activity Page:**
   - File: `/frontend/src/pages/Activity.jsx`
   - Lists recent `InventoryMovement` records
   - Click movement → modal with full details

**Key Design:** Frontend calls **one endpoint per action** (no complex orchestration needed).

---

### Step 8 — Add Tests for Critical Logic

**Recommended Test Structure:**

1. **Unit Tests for Services:**
   - `/backend/src/services/__tests__/inventoryService.test.ts`
   - Test: place, pull, move, audit
   - Validation: no negative stock, correct error codes

2. **Unit Tests for Location Parsing:**
   - `/backend/src/utils/__tests__/locationParser.test.ts`
   - Test: `04C12` → correct aisle/column/bay
   - Test: `O4TT88` → overflow tote
   - Test: `FashMT02(99)` → department/fixture/section

3. **Integration Tests for Routes:**
   - `/backend/src/routes/__tests__/inventory.test.ts`
   - Test: full flow (create product → place in back → pull → audit)

**Future:** Add E2E tests for scanner flow.

---

## 11. Evolution Plan

### Phase 1: Core Scanner Flow ✅ (Current)
- [x] Scan product by UPC
- [x] View product details with stock
- [x] Place/pull/move/audit actions
- [x] Location management

### Phase 2: Enhanced Product Management
- [ ] Create stub products from unknown scans
- [ ] Bulk product import
- [ ] Product enrichment from external APIs
- [ ] Product images/variants

### Phase 3: Advanced Location Features
- [ ] Visual floor map
- [ ] Location templates
- [ ] Capacity management
- [ ] Location analytics

### Phase 4: Automation & Workflows
- [ ] "To Pull" list generation
- [ ] Replenishment suggestions
- [ ] Audit scheduling
- [ ] Route optimization

### Phase 5: Reporting & Analytics
- [ ] Stock level reports
- [ ] Movement history analysis
- [ ] Variance reporting
- [ ] Department performance

---

## 12. API Response Standards

All API responses follow this structure:

**Success (200/201):**
```json
{
  "id": "uuid",
  // ... entity fields
}
```

**Error (400/404/409):**
```json
{
  "error": "Human-readable error message"
}
```

**List Responses:**
```json
[
  { "id": "uuid", ... },
  { "id": "uuid", ... }
]
```

**Pagination (future):**
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "skip": 0,
    "take": 50
  }
}
```

---

## 13. Location Code Conventions

### Backroom
- **Standard:** `04C12` = Aisle 4, Column C, Bay 12
  - Aisle: 01-07 (zero-padded)
  - Column: A-Z
  - Bay: 01-20 (zero-padded for 01-09, not padded for 10-20)
- **Overflow:** `O4TT88` = Overflow tote (custom format)

### Sales Floor
- **Standard:** `FashMT02(99)` = Department + Parent Fixture + Section
  - Department: `Fash`, `Mens`, `Kids`, etc.
  - Parent Fixture: `MT02`, `UT03`, `UC99`, etc.
  - Section: `(99)`, `(2)`, `(0)`, etc. (optional, in parentheses)

**Key:** These are **conventions**, not hard requirements. The system can support other formats via the flexible location model.

---

## 14. Action Checklist for New Features

When adding a new action:

1. ✅ Document it in this file (follow template)
2. ✅ Add route in appropriate domain file
3. ✅ Implement service method
4. ✅ Add validation
5. ✅ Create `InventoryMovement` record (if state-changing)
6. ✅ Update frontend API service
7. ✅ Add UI button/modal (if user-facing)
8. ✅ Add error handling
9. ✅ Add success notification
10. ✅ Test with real data

---

**Last Updated:** 2025-01-16  
**Version:** 1.0.0  
**Maintainer:** Development Team


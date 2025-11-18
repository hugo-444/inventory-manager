# Mock Data - CSV Import System

This folder contains CSV files for importing mock inventory data into your database.

## 📁 Folder Structure

```
mock-data/
├── departments.csv              # Department definitions
├── styles.csv                   # Product styles/families
├── products.csv                 # All products
├── parent_fixtures.csv          # Parent fixtures (MT02, UT03, etc.)
├── sections.csv                 # Sections within fixtures
├── backroom_locations.csv       # Backroom locations (04C12, etc.)
├── salesfloor_locations.csv     # Sales floor locations (FashMT02(99), etc.)
├── initial_stock.csv            # Initial stock assignments
└── departments/
    └── fashion_products.csv     # Department-specific products (optional)
```

## 🚀 Quick Start

1. **Edit the CSV files** with your mock data
2. **Run the importer:**
   ```bash
   npm run import:csv
   ```

That's it! The importer will:
- Create/update all departments, styles, fixtures, locations
- Import all products
- Assign initial stock
- Create movement logs

## 📝 CSV File Formats

### `departments.csv`
```csv
code,name
Fash,Fashion
Mens,Menswear
```

### `styles.csv`
```csv
styleCode,name,description
UT03-DENIM,Uncharted Threads Denim Jacket,A popular denim jacket
MT02-TOP,Crop Top Collection,Summer crop tops
```

### `products.csv`
```csv
upc,styleCode,name,price,color,size,imageUrl
123456789012,UT03-DENIM,Denim Jacket,34.99,Blue,M,https://picsum.photos/300
123456789013,UT03-DENIM,Denim Jacket,34.99,Black,L,https://picsum.photos/300
```

**Note:** `styleCode` must exist in `styles.csv` first!

### `parent_fixtures.csv`
```csv
departmentCode,parentCode,type,description
Fash,MT02,table,Main Fashion Table 02
Fash,UT03,table,Uncharted Threads Table 03
```

**Types:** `table`, `bunker`, `wall`, `wall_section`, `bar`, `bar_section`, `spinner`, `window`, `surrounding`, `custom`

### `sections.csv`
```csv
parentFixtureCode,sectionCode,sectionType,description
MT02,99,bunker,MT02 Bunker Section 99
UT03,0,surrounding,UT03 Base Section
```

**Types:** `bunker`, `wall`, `wall_section`, `bar`, `bar_section`, `spinner`, `window`, `surrounding`, `overflow`

### `backroom_locations.csv`
```csv
locationCode,aisle,column,bay,isOverflow
04C12,4,C,12,false
04C01,4,C,1,false
O4TT88,,,"",true
```

- Regular locations: `aisle`, `column`, `bay` required, `isOverflow=false`
- Overflow totes: Only `locationCode` required, `isOverflow=true`

### `salesfloor_locations.csv`
```csv
locationCode,department,parentFixture,sectionCode
FashMT02(99),Fash,MT02,99
FashUT03(0),Fash,UT03,0
```

**Note:** `sectionCode` is optional (omit for locations without sections)

### `initial_stock.csv`
```csv
upc,locationCode,locationType,qty
123456789012,04C12,backroom,10
123456789012,FashMT02(99),salesfloor,3
```

**Location Types:** `backroom` or `salesfloor`

## 🎯 Department-Specific Files

You can create department-specific product files in `departments/`:

- `departments/fashion_products.csv`
- `departments/mens_products.csv`
- `departments/kids_products.csv`

These will be automatically imported after the main `products.csv`.

## ✨ Features

- **Upsert Logic:** Running the importer multiple times updates existing records
- **Dependency Handling:** Imports in correct order (departments → fixtures → locations → products)
- **Error Handling:** Warns about missing dependencies but continues
- **Movement Logs:** Automatically creates inventory movement records for initial stock

## 🔄 Workflow

1. Edit CSV files in Excel/Google Sheets/Numbers
2. Save as CSV (UTF-8 encoding)
3. Run `npm run import:csv`
4. Your database is updated!

## 💡 Tips

- **Start Simple:** Begin with just `departments.csv`, `styles.csv`, and `products.csv`
- **Add Locations Later:** Locations can be added separately
- **Test Incrementally:** Import one CSV at a time to debug
- **Use Department Folders:** Keep department data separate for easier management

## 🐛 Troubleshooting

**"Style not found" warning:**
- Make sure styles are imported before products
- Check that `styleCode` in products.csv matches styles.csv exactly

**"Department not found" warning:**
- Departments must be imported before fixtures
- Check department codes match exactly (case-sensitive)

**"Location not found" warning:**
- Locations must be imported before stock
- Check location codes match exactly


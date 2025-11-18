const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

/**
 * Parse CSV file and return array of objects
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

/**
 * Import departments
 */
async function importDepartments(csvPath) {
  console.log('📦 Importing departments...');
  const rows = parseCSV(csvPath);
  
  for (const row of rows) {
    await prisma.department.upsert({
      where: { code: row.code },
      update: { name: row.name },
      create: {
        code: row.code,
        name: row.name,
      },
    });
  }
  console.log(`✅ Imported ${rows.length} departments`);
}

/**
 * Import styles
 */
async function importStyles(csvPath) {
  console.log('📦 Importing styles...');
  const rows = parseCSV(csvPath);
  
  for (const row of rows) {
    await prisma.style.upsert({
      where: { styleCode: row.styleCode },
      update: {
        name: row.name,
        description: row.description || null,
      },
      create: {
        styleCode: row.styleCode,
        name: row.name,
        description: row.description || null,
      },
    });
  }
  console.log(`✅ Imported ${rows.length} styles`);
}

/**
 * Import parent fixtures
 */
async function importParentFixtures(csvPath) {
  console.log('📦 Importing parent fixtures...');
  const rows = parseCSV(csvPath);
  
  for (const row of rows) {
    const dept = await prisma.department.findUnique({
      where: { code: row.departmentCode },
    });
    
    if (!dept) {
      console.warn(`⚠️  Department '${row.departmentCode}' not found, skipping fixture '${row.parentCode}'`);
      continue;
    }
    
    await prisma.parentFixture.upsert({
      where: {
        departmentId_parentCode: {
          departmentId: dept.id,
          parentCode: row.parentCode,
        },
      },
      update: {
        type: row.type,
        description: row.description || null,
      },
      create: {
        departmentId: dept.id,
        parentCode: row.parentCode,
        type: row.type,
        description: row.description || null,
      },
    });
  }
  console.log(`✅ Imported ${rows.length} parent fixtures`);
}

/**
 * Import sections
 */
async function importSections(csvPath) {
  console.log('📦 Importing sections...');
  const rows = parseCSV(csvPath);
  
  for (const row of rows) {
    // Find parent fixture by department code + parent code
    const dept = await prisma.department.findFirst({
      where: {
        fixtures: {
          some: {
            parentCode: row.parentFixtureCode,
          },
        },
      },
    });
    
    if (!dept) {
      console.warn(`⚠️  Department for fixture '${row.parentFixtureCode}' not found`);
      continue;
    }
    
    const fixture = await prisma.parentFixture.findFirst({
      where: {
        departmentId: dept.id,
        parentCode: row.parentFixtureCode,
      },
    });
    
    if (!fixture) {
      console.warn(`⚠️  Parent fixture '${row.parentFixtureCode}' not found`);
      continue;
    }
    
    await prisma.section.upsert({
      where: {
        parentFixtureId_sectionCode: {
          parentFixtureId: fixture.id,
          sectionCode: row.sectionCode,
        },
      },
      update: {
        sectionType: row.sectionType,
        description: row.description || null,
      },
      create: {
        parentFixtureId: fixture.id,
        sectionCode: row.sectionCode,
        sectionType: row.sectionType,
        description: row.description || null,
      },
    });
  }
  console.log(`✅ Imported ${rows.length} sections`);
}

/**
 * Import backroom locations
 */
async function importBackroomLocations(csvPath) {
  console.log('📦 Importing backroom locations...');
  const rows = parseCSV(csvPath);
  
  for (const row of rows) {
    if (row.isOverflow === 'true' || row.isOverflow === true) {
      // Handle overflow tote
      const tote = await prisma.overflowTote.upsert({
        where: { code: row.locationCode },
        update: {},
        create: {
          code: row.locationCode,
        },
      });
      
      await prisma.backroomLocation.upsert({
        where: { locationCode: row.locationCode },
        update: {},
        create: {
          overflowToteId: tote.id,
          locationCode: row.locationCode,
        },
      });
    } else {
      // Handle regular backroom location
      const aisle = await prisma.backroomAisle.upsert({
        where: { aisleNumber: parseInt(row.aisle, 10) },
        update: {},
        create: {
          aisleNumber: parseInt(row.aisle, 10),
        },
      });
      
      const column = await prisma.backroomColumn.upsert({
        where: {
          aisleId_columnLetter: {
            aisleId: aisle.id,
            columnLetter: row.column,
          },
        },
        update: {},
        create: {
          aisleId: aisle.id,
          columnLetter: row.column,
        },
      });
      
      const bayType = parseInt(row.bay, 10) <= 9 ? 'shelf' : 'tray';
      const bay = await prisma.backroomBay.upsert({
        where: {
          columnId_bayNumber: {
            columnId: column.id,
            bayNumber: parseInt(row.bay, 10),
          },
        },
        update: {},
        create: {
          columnId: column.id,
          bayNumber: parseInt(row.bay, 10),
          type: bayType,
        },
      });
      
      await prisma.backroomLocation.upsert({
        where: { locationCode: row.locationCode },
        update: {},
        create: {
          aisleId: aisle.id,
          columnId: column.id,
          bayId: bay.id,
          locationCode: row.locationCode,
        },
      });
    }
  }
  console.log(`✅ Imported ${rows.length} backroom locations`);
}

/**
 * Import sales floor locations
 */
async function importSalesFloorLocations(csvPath) {
  console.log('📦 Importing sales floor locations...');
  const rows = parseCSV(csvPath);
  
  for (const row of rows) {
    const dept = await prisma.department.findUnique({
      where: { code: row.department },
    });
    
    if (!dept) {
      console.warn(`⚠️  Department '${row.department}' not found`);
      continue;
    }
    
    const fixture = await prisma.parentFixture.findFirst({
      where: {
        departmentId: dept.id,
        parentCode: row.parentFixture,
      },
    });
    
    if (!fixture) {
      console.warn(`⚠️  Parent fixture '${row.parentFixture}' not found in department '${row.department}'`);
      continue;
    }
    
    let section = null;
    if (row.sectionCode) {
      // Normalize section code: add parentheses if not present
      let sectionCode = row.sectionCode.trim();
      if (!sectionCode.startsWith('(')) {
        sectionCode = `(${sectionCode})`;
      }
      
      section = await prisma.section.findFirst({
        where: {
          parentFixtureId: fixture.id,
          sectionCode: sectionCode,
        },
      });
      
      if (!section) {
        console.warn(`⚠️  Section '${sectionCode}' not found in fixture '${row.parentFixture}'`);
      }
    }
    
    await prisma.salesFloorLocation.upsert({
      where: { locationCode: row.locationCode },
      update: {},
      create: {
        departmentId: dept.id,
        parentFixtureId: fixture.id,
        sectionId: section?.id || null,
        locationCode: row.locationCode,
      },
    });
  }
  console.log(`✅ Imported ${rows.length} sales floor locations`);
}

/**
 * Import products
 */
async function importProducts(csvPath) {
  console.log('📦 Importing products...');
  const rows = parseCSV(csvPath);
  
  for (const row of rows) {
    const style = await prisma.style.findUnique({
      where: { styleCode: row.styleCode },
    });
    
    if (!style) {
      console.warn(`⚠️  Style '${row.styleCode}' not found, skipping product '${row.upc}'`);
      continue;
    }
    
    await prisma.product.upsert({
      where: { upc: row.upc },
      update: {
        styleId: style.id,
        name: row.name,
        price: parseFloat(row.price),
        color: row.color || null,
        size: row.size || null,
        imageUrl: row.imageUrl || null,
      },
      create: {
        upc: row.upc,
        styleId: style.id,
        name: row.name,
        price: parseFloat(row.price),
        color: row.color || null,
        size: row.size || null,
        imageUrl: row.imageUrl || null,
      },
    });
  }
  console.log(`✅ Imported ${rows.length} products`);
}

/**
 * Import initial stock
 */
async function importInitialStock(csvPath) {
  console.log('📦 Importing initial stock...');
  const rows = parseCSV(csvPath);
  
  for (const row of rows) {
    const product = await prisma.product.findUnique({
      where: { upc: row.upc },
    });
    
    if (!product) {
      console.warn(`⚠️  Product with UPC '${row.upc}' not found`);
      continue;
    }
    
    if (row.locationType === 'backroom') {
      const location = await prisma.backroomLocation.findUnique({
        where: { locationCode: row.locationCode },
      });
      
      if (!location) {
        console.warn(`⚠️  Backroom location '${row.locationCode}' not found`);
        continue;
      }
      
      await prisma.productBackroomStock.upsert({
        where: {
          productId_backroomLocationId: {
            productId: product.id,
            backroomLocationId: location.id,
          },
        },
        update: { qty: parseInt(row.qty, 10) },
        create: {
          productId: product.id,
          backroomLocationId: location.id,
          qty: parseInt(row.qty, 10),
        },
      });
      
      // Create movement log
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          qty: parseInt(row.qty, 10),
          type: 'PLACE_IN_BACK',
          toBackroomLocationId: location.id,
          notes: 'Initial stock from CSV import',
        },
      });
    } else if (row.locationType === 'salesfloor') {
      const location = await prisma.salesFloorLocation.findUnique({
        where: { locationCode: row.locationCode },
      });
      
      if (!location) {
        console.warn(`⚠️  Sales floor location '${row.locationCode}' not found`);
        continue;
      }
      
      await prisma.productSalesFloorStock.upsert({
        where: {
          productId_salesFloorLocationId: {
            productId: product.id,
            salesFloorLocationId: location.id,
          },
        },
        update: { qty: parseInt(row.qty, 10) },
        create: {
          productId: product.id,
          salesFloorLocationId: location.id,
          qty: parseInt(row.qty, 10),
        },
      });
      
      // Create movement log
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          qty: parseInt(row.qty, 10),
          type: 'PLACE_ON_FLOOR',
          toSalesFloorLocationId: location.id,
          notes: 'Initial stock from CSV import',
        },
      });
    }
  }
  console.log(`✅ Imported ${rows.length} stock entries`);
}

/**
 * Main import function
 */
async function importAll() {
  const mockDataDir = path.join(__dirname, '../mock-data');
  
  try {
    console.log('🚀 Starting CSV import...\n');
    
    // Import in order (respecting dependencies)
    if (fs.existsSync(path.join(mockDataDir, 'departments.csv'))) {
      await importDepartments(path.join(mockDataDir, 'departments.csv'));
    }
    
    if (fs.existsSync(path.join(mockDataDir, 'styles.csv'))) {
      await importStyles(path.join(mockDataDir, 'styles.csv'));
    }
    
    if (fs.existsSync(path.join(mockDataDir, 'parent_fixtures.csv'))) {
      await importParentFixtures(path.join(mockDataDir, 'parent_fixtures.csv'));
    }
    
    if (fs.existsSync(path.join(mockDataDir, 'sections.csv'))) {
      await importSections(path.join(mockDataDir, 'sections.csv'));
    }
    
    if (fs.existsSync(path.join(mockDataDir, 'backroom_locations.csv'))) {
      await importBackroomLocations(path.join(mockDataDir, 'backroom_locations.csv'));
    }
    
    if (fs.existsSync(path.join(mockDataDir, 'salesfloor_locations.csv'))) {
      await importSalesFloorLocations(path.join(mockDataDir, 'salesfloor_locations.csv'));
    }
    
    if (fs.existsSync(path.join(mockDataDir, 'products.csv'))) {
      await importProducts(path.join(mockDataDir, 'products.csv'));
    }
    
    if (fs.existsSync(path.join(mockDataDir, 'initial_stock.csv'))) {
      await importInitialStock(path.join(mockDataDir, 'initial_stock.csv'));
    }
    
    // Import department-specific files
    const deptDir = path.join(mockDataDir, 'departments');
    if (fs.existsSync(deptDir)) {
      const deptFiles = fs.readdirSync(deptDir);
      for (const file of deptFiles) {
        if (file.endsWith('_products.csv')) {
          console.log(`\n📁 Importing department file: ${file}`);
          await importProducts(path.join(deptDir, file));
        }
      }
    }
    
    console.log('\n✅ Import complete!');
  } catch (error) {
    console.error('❌ Import error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  importAll();
}

module.exports = { importAll };


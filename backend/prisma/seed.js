const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // =============================================
  // 1. DEPARTMENT
  // =============================================
  const fashionDept = await prisma.department.upsert({
    where: { code: "Fash" },
    update: {},
    create: {
      code: "Fash",
      name: "Fashion",
    },
  });

  // =============================================
  // 2. PARENT FIXTURES (MT02, UT03)
  // =============================================
  const mt02 = await prisma.parentFixture.upsert({
    where: {
      departmentId_parentCode: {
        departmentId: fashionDept.id,
        parentCode: "MT02",
      },
    },
    update: {},
    create: {
      departmentId: fashionDept.id,
      parentCode: "MT02",
      type: "table",
      description: "Main Fashion Table 02",
    },
  });

  const ut03 = await prisma.parentFixture.upsert({
    where: {
      departmentId_parentCode: {
        departmentId: fashionDept.id,
        parentCode: "UT03",
      },
    },
    update: {},
    create: {
      departmentId: fashionDept.id,
      parentCode: "UT03",
      type: "table",
      description: "Uncharted Threads Table 03",
    },
  });

  // =============================================
  // 3. SALES FLOOR SECTIONS
  // =============================================
  const mt02Bunker99 = await prisma.section.upsert({
    where: {
      parentFixtureId_sectionCode: {
        parentFixtureId: mt02.id,
        sectionCode: "99",
      },
    },
    update: {},
    create: {
      parentFixtureId: mt02.id,
      sectionCode: "99",
      sectionType: "bunker",
      description: "MT02 Bunker Section 99",
    },
  });

  const ut03BaseSection = await prisma.section.upsert({
    where: {
      parentFixtureId_sectionCode: {
        parentFixtureId: ut03.id,
        sectionCode: "0",
      },
    },
    update: {},
    create: {
      parentFixtureId: ut03.id,
      sectionCode: "0",
      sectionType: "surrounding",
      description: "UT03 Base Section",
    },
  });

  // =============================================
  // 4. SALES FLOOR LOCATIONS
  // =============================================
  const fash_MT02_99 = await prisma.salesFloorLocation.upsert({
    where: { locationCode: "FashMT02(99)" },
    update: {},
    create: {
      departmentId: fashionDept.id,
      parentFixtureId: mt02.id,
      sectionId: mt02Bunker99.id,
      locationCode: "FashMT02(99)",
    },
  });

  const fash_UT03_0 = await prisma.salesFloorLocation.upsert({
    where: { locationCode: "FashUT03(0)" },
    update: {},
    create: {
      departmentId: fashionDept.id,
      parentFixtureId: ut03.id,
      sectionId: ut03BaseSection.id,
      locationCode: "FashUT03(0)",
    },
  });

  // =============================================
  // 5. BACKROOM AISLES / COLUMNS / BAYS
  // =============================================
  const aisle4 = await prisma.backroomAisle.upsert({
    where: { aisleNumber: 4 },
    update: {},
    create: {
      aisleNumber: 4,
      name: "Backroom Aisle 4",
    },
  });

  const columnC = await prisma.backroomColumn.upsert({
    where: {
      aisleId_columnLetter: {
        aisleId: aisle4.id,
        columnLetter: "C",
      },
    },
    update: {},
    create: {
      aisleId: aisle4.id,
      columnLetter: "C",
    },
  });

  const bay12 = await prisma.backroomBay.upsert({
    where: {
      columnId_bayNumber: {
        columnId: columnC.id,
        bayNumber: 12,
      },
    },
    update: {},
    create: {
      columnId: columnC.id,
      bayNumber: 12,
      type: "tray",
    },
  });

  // Overflow Tote
  const overflow88 = await prisma.overflowTote.upsert({
    where: { code: "O4TT88" },
    update: {},
    create: {
      code: "O4TT88",
      description: "Overflow Tote 88",
    },
  });

  // =============================================
  // 6. BACKROOM LOCATIONS (04C12 + Overflow)
  // =============================================
  const location_04C12 = await prisma.backroomLocation.upsert({
    where: { locationCode: "04C12" },
    update: {},
    create: {
      aisleId: aisle4.id,
      columnId: columnC.id,
      bayId: bay12.id,
      locationCode: "04C12",
    },
  });

  const overflowLocation88 = await prisma.backroomLocation.upsert({
    where: { locationCode: "O4TT88" },
    update: {},
    create: {
      overflowToteId: overflow88.id,
      locationCode: "O4TT88",
    },
  });

  // =============================================
  // 7. STYLE & VARIANT & PRODUCT
  // =============================================
  const styleDenim = await prisma.style.upsert({
    where: { styleCode: "UT03-DENIM" },
    update: {
      departmentId: fashionDept.id,
    },
    create: {
      styleCode: "UT03-DENIM",
      name: "Uncharted Threads Denim Jacket",
      description: "A popular denim jacket from UT03",
      departmentId: fashionDept.id,
    },
  });

  // Create variant for Medium size
  const variantMedium = await prisma.variant.upsert({
    where: {
      styleId_variantCode: {
        styleId: styleDenim.id,
        variantCode: "M-BLUE",
      },
    },
    update: {},
    create: {
      styleId: styleDenim.id,
      variantCode: "M-BLUE",
      size: "M",
      color: "Blue",
    },
  });

  const productJacket = await prisma.product.upsert({
    where: { upc: "123456789012" },
    update: {
      styleId: styleDenim.id,
      variantId: variantMedium.id,
      departmentId: fashionDept.id,
      name: "Denim Jacket - Medium Blue",
      price: 34.99,
      size: "M",
      color: "Blue",
      status: "ACTIVE",
      imageUrl: "https://picsum.photos/300",
    },
    create: {
      upc: "123456789012",
      styleId: styleDenim.id,
      variantId: variantMedium.id,
      departmentId: fashionDept.id,
      name: "Denim Jacket - Medium Blue",
      price: 34.99,
      size: "M",
      color: "Blue",
      status: "ACTIVE",
      imageUrl: "https://picsum.photos/300",
    },
  });

  // Create an UNCONFIGURED product (stub from unknown scan)
  const stubProduct = await prisma.product.upsert({
    where: { upc: "999999999999" },
    update: {},
    create: {
      upc: "999999999999",
      name: "Unknown Product (999999999999)",
      status: "UNCONFIGURED",
    },
  });

  // =============================================
  // 8. INITIAL STOCK (Backroom + Sales Floor)
  // =============================================
  // Backroom: 10 units in 04C12
  await prisma.productBackroomStock.upsert({
    where: {
      productId_backroomLocationId: {
        productId: productJacket.id,
        backroomLocationId: location_04C12.id,
      },
    },
    update: { qty: 10 },
    create: {
      productId: productJacket.id,
      backroomLocationId: location_04C12.id,
      qty: 10,
    },
  });

  // Sales Floor: 3 units on FashMT02(99)
  await prisma.productSalesFloorStock.upsert({
    where: {
      productId_salesFloorLocationId: {
        productId: productJacket.id,
        salesFloorLocationId: fash_MT02_99.id,
      },
    },
    update: { qty: 3 },
    create: {
      productId: productJacket.id,
      salesFloorLocationId: fash_MT02_99.id,
      qty: 3,
    },
  });

  // =============================================
  // 9. MOVEMENT LOGS
  // =============================================
  await prisma.inventoryMovement.create({
    data: {
      productId: productJacket.id,
      qty: 10,
      type: "PLACE_IN_BACK",
      toBackroomLocationId: location_04C12.id,
      notes: "Initial stock arrival",
    },
  });

  await prisma.inventoryMovement.create({
    data: {
      productId: productJacket.id,
      qty: 3,
      type: "PLACE_ON_FLOOR",
      fromBackroomLocationId: location_04C12.id,
      toSalesFloorLocationId: fash_MT02_99.id,
      notes: "Moved 3 jackets to sales floor",
    },
  });

  await prisma.inventoryMovement.create({
    data: {
      productId: productJacket.id,
      qty: 1,
      type: "PULL_FROM_BACK",
      fromBackroomLocationId: location_04C12.id,
      notes: "Pulled one for transfer",
    },
  });

  console.log("🌱 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
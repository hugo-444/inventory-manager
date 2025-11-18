-- CreateEnum
CREATE TYPE "ParentFixtureType" AS ENUM ('table', 'bunker', 'wall', 'wall_section', 'bar', 'bar_section', 'spinner', 'window', 'surrounding', 'custom');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('bunker', 'wall', 'wall_section', 'bar', 'bar_section', 'spinner', 'window', 'surrounding', 'overflow');

-- CreateEnum
CREATE TYPE "BackroomBayType" AS ENUM ('shelf', 'tray');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('PLACE_IN_BACK', 'PULL_FROM_BACK', 'AUDIT_BACKROOM', 'PLACE_ON_FLOOR', 'MOVE_ON_FLOOR', 'REMOVE_FROM_FLOOR');

-- CreateTable
CREATE TABLE "Style" (
    "id" TEXT NOT NULL,
    "styleCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Style_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "upc" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "color" TEXT,
    "size" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentFixture" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "parentCode" TEXT NOT NULL,
    "type" "ParentFixtureType" NOT NULL,
    "description" TEXT,

    CONSTRAINT "ParentFixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "parentFixtureId" TEXT NOT NULL,
    "sectionCode" TEXT NOT NULL,
    "sectionType" "SectionType" NOT NULL,
    "description" TEXT,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesFloorLocation" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "parentFixtureId" TEXT NOT NULL,
    "sectionId" TEXT,
    "locationCode" TEXT NOT NULL,

    CONSTRAINT "SalesFloorLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSalesFloorStock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "salesFloorLocationId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "lastAuditDate" TIMESTAMP(3),

    CONSTRAINT "ProductSalesFloorStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackroomAisle" (
    "id" TEXT NOT NULL,
    "aisleNumber" INTEGER NOT NULL,
    "name" TEXT,
    "description" TEXT,

    CONSTRAINT "BackroomAisle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackroomColumn" (
    "id" TEXT NOT NULL,
    "aisleId" TEXT NOT NULL,
    "columnLetter" TEXT NOT NULL,

    CONSTRAINT "BackroomColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackroomBay" (
    "id" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "bayNumber" INTEGER NOT NULL,
    "type" "BackroomBayType" NOT NULL,

    CONSTRAINT "BackroomBay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OverflowTote" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "OverflowTote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackroomLocation" (
    "id" TEXT NOT NULL,
    "aisleId" TEXT,
    "columnId" TEXT,
    "bayId" TEXT,
    "overflowToteId" TEXT,
    "locationCode" TEXT NOT NULL,

    CONSTRAINT "BackroomLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBackroomStock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "backroomLocationId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "lastAuditDate" TIMESTAMP(3),

    CONSTRAINT "ProductBackroomStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fromBackroomLocationId" TEXT,
    "toBackroomLocationId" TEXT,
    "fromSalesFloorLocationId" TEXT,
    "toSalesFloorLocationId" TEXT,
    "qty" INTEGER NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Style_styleCode_key" ON "Style"("styleCode");

-- CreateIndex
CREATE INDEX "Style_styleCode_idx" ON "Style"("styleCode");

-- CreateIndex
CREATE UNIQUE INDEX "Product_upc_key" ON "Product"("upc");

-- CreateIndex
CREATE INDEX "Product_upc_idx" ON "Product"("upc");

-- CreateIndex
CREATE INDEX "Product_styleId_idx" ON "Product"("styleId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Department_code_idx" ON "Department"("code");

-- CreateIndex
CREATE INDEX "ParentFixture_departmentId_idx" ON "ParentFixture"("departmentId");

-- CreateIndex
CREATE INDEX "ParentFixture_parentCode_idx" ON "ParentFixture"("parentCode");

-- CreateIndex
CREATE UNIQUE INDEX "ParentFixture_departmentId_parentCode_key" ON "ParentFixture"("departmentId", "parentCode");

-- CreateIndex
CREATE INDEX "Section_parentFixtureId_idx" ON "Section"("parentFixtureId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_parentFixtureId_sectionCode_key" ON "Section"("parentFixtureId", "sectionCode");

-- CreateIndex
CREATE UNIQUE INDEX "SalesFloorLocation_locationCode_key" ON "SalesFloorLocation"("locationCode");

-- CreateIndex
CREATE INDEX "SalesFloorLocation_locationCode_idx" ON "SalesFloorLocation"("locationCode");

-- CreateIndex
CREATE INDEX "SalesFloorLocation_departmentId_idx" ON "SalesFloorLocation"("departmentId");

-- CreateIndex
CREATE INDEX "SalesFloorLocation_parentFixtureId_idx" ON "SalesFloorLocation"("parentFixtureId");

-- CreateIndex
CREATE INDEX "ProductSalesFloorStock_productId_idx" ON "ProductSalesFloorStock"("productId");

-- CreateIndex
CREATE INDEX "ProductSalesFloorStock_salesFloorLocationId_idx" ON "ProductSalesFloorStock"("salesFloorLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSalesFloorStock_productId_salesFloorLocationId_key" ON "ProductSalesFloorStock"("productId", "salesFloorLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "BackroomAisle_aisleNumber_key" ON "BackroomAisle"("aisleNumber");

-- CreateIndex
CREATE INDEX "BackroomAisle_aisleNumber_idx" ON "BackroomAisle"("aisleNumber");

-- CreateIndex
CREATE INDEX "BackroomColumn_aisleId_idx" ON "BackroomColumn"("aisleId");

-- CreateIndex
CREATE UNIQUE INDEX "BackroomColumn_aisleId_columnLetter_key" ON "BackroomColumn"("aisleId", "columnLetter");

-- CreateIndex
CREATE INDEX "BackroomBay_columnId_idx" ON "BackroomBay"("columnId");

-- CreateIndex
CREATE UNIQUE INDEX "BackroomBay_columnId_bayNumber_key" ON "BackroomBay"("columnId", "bayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OverflowTote_code_key" ON "OverflowTote"("code");

-- CreateIndex
CREATE INDEX "OverflowTote_code_idx" ON "OverflowTote"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BackroomLocation_locationCode_key" ON "BackroomLocation"("locationCode");

-- CreateIndex
CREATE INDEX "BackroomLocation_locationCode_idx" ON "BackroomLocation"("locationCode");

-- CreateIndex
CREATE INDEX "ProductBackroomStock_productId_idx" ON "ProductBackroomStock"("productId");

-- CreateIndex
CREATE INDEX "ProductBackroomStock_backroomLocationId_idx" ON "ProductBackroomStock"("backroomLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBackroomStock_productId_backroomLocationId_key" ON "ProductBackroomStock"("productId", "backroomLocationId");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_idx" ON "InventoryMovement"("productId");

-- CreateIndex
CREATE INDEX "InventoryMovement_timestamp_idx" ON "InventoryMovement"("timestamp");

-- CreateIndex
CREATE INDEX "InventoryMovement_type_idx" ON "InventoryMovement"("type");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentFixture" ADD CONSTRAINT "ParentFixture_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_parentFixtureId_fkey" FOREIGN KEY ("parentFixtureId") REFERENCES "ParentFixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesFloorLocation" ADD CONSTRAINT "SalesFloorLocation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesFloorLocation" ADD CONSTRAINT "SalesFloorLocation_parentFixtureId_fkey" FOREIGN KEY ("parentFixtureId") REFERENCES "ParentFixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesFloorLocation" ADD CONSTRAINT "SalesFloorLocation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSalesFloorStock" ADD CONSTRAINT "ProductSalesFloorStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSalesFloorStock" ADD CONSTRAINT "ProductSalesFloorStock_salesFloorLocationId_fkey" FOREIGN KEY ("salesFloorLocationId") REFERENCES "SalesFloorLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackroomColumn" ADD CONSTRAINT "BackroomColumn_aisleId_fkey" FOREIGN KEY ("aisleId") REFERENCES "BackroomAisle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackroomBay" ADD CONSTRAINT "BackroomBay_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "BackroomColumn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackroomLocation" ADD CONSTRAINT "BackroomLocation_aisleId_fkey" FOREIGN KEY ("aisleId") REFERENCES "BackroomAisle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackroomLocation" ADD CONSTRAINT "BackroomLocation_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "BackroomColumn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackroomLocation" ADD CONSTRAINT "BackroomLocation_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "BackroomBay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackroomLocation" ADD CONSTRAINT "BackroomLocation_overflowToteId_fkey" FOREIGN KEY ("overflowToteId") REFERENCES "OverflowTote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBackroomStock" ADD CONSTRAINT "ProductBackroomStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBackroomStock" ADD CONSTRAINT "ProductBackroomStock_backroomLocationId_fkey" FOREIGN KEY ("backroomLocationId") REFERENCES "BackroomLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_fromBackroomLocationId_fkey" FOREIGN KEY ("fromBackroomLocationId") REFERENCES "BackroomLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_toBackroomLocationId_fkey" FOREIGN KEY ("toBackroomLocationId") REFERENCES "BackroomLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_fromSalesFloorLocationId_fkey" FOREIGN KEY ("fromSalesFloorLocationId") REFERENCES "SalesFloorLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_toSalesFloorLocationId_fkey" FOREIGN KEY ("toSalesFloorLocationId") REFERENCES "SalesFloorLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

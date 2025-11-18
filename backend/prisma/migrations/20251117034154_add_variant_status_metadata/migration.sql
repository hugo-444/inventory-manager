-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNCONFIGURED', 'DISCONTINUED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InventoryMovementType" ADD VALUE 'MOVE';
ALTER TYPE "InventoryMovementType" ADD VALUE 'ADJUSTMENT';
ALTER TYPE "InventoryMovementType" ADD VALUE 'AUDIT_CORRECTION';
ALTER TYPE "InventoryMovementType" ADD VALUE 'RECEIVE';
ALTER TYPE "InventoryMovementType" ADD VALUE 'RETURN';

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_styleId_fkey";

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "performedBy" TEXT,
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'UNCONFIGURED',
ADD COLUMN     "variantId" TEXT,
ALTER COLUMN "styleId" DROP NOT NULL,
ALTER COLUMN "price" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Style" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "variantCode" TEXT NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "flavor" TEXT,
    "packSize" TEXT,
    "metadata" JSONB,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Variant_styleId_idx" ON "Variant"("styleId");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_styleId_variantCode_key" ON "Variant"("styleId", "variantCode");

-- CreateIndex
CREATE INDEX "InventoryMovement_performedBy_idx" ON "InventoryMovement"("performedBy");

-- CreateIndex
CREATE INDEX "Product_variantId_idx" ON "Product"("variantId");

-- CreateIndex
CREATE INDEX "Product_departmentId_idx" ON "Product"("departmentId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Style_departmentId_idx" ON "Style"("departmentId");

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

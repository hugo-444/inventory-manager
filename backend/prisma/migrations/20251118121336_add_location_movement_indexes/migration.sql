-- CreateIndex
CREATE INDEX "BackroomLocation_aisleId_idx" ON "BackroomLocation"("aisleId");

-- CreateIndex
CREATE INDEX "BackroomLocation_columnId_idx" ON "BackroomLocation"("columnId");

-- CreateIndex
CREATE INDEX "BackroomLocation_bayId_idx" ON "BackroomLocation"("bayId");

-- CreateIndex
CREATE INDEX "BackroomLocation_overflowToteId_idx" ON "BackroomLocation"("overflowToteId");

-- CreateIndex
CREATE INDEX "InventoryMovement_fromBackroomLocationId_idx" ON "InventoryMovement"("fromBackroomLocationId");

-- CreateIndex
CREATE INDEX "InventoryMovement_toBackroomLocationId_idx" ON "InventoryMovement"("toBackroomLocationId");

-- CreateIndex
CREATE INDEX "InventoryMovement_fromSalesFloorLocationId_idx" ON "InventoryMovement"("fromSalesFloorLocationId");

-- CreateIndex
CREATE INDEX "InventoryMovement_toSalesFloorLocationId_idx" ON "InventoryMovement"("toSalesFloorLocationId");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_timestamp_idx" ON "InventoryMovement"("productId", "timestamp");

-- CreateIndex
CREATE INDEX "SalesFloorLocation_sectionId_idx" ON "SalesFloorLocation"("sectionId");

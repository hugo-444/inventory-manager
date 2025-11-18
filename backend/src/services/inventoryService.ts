import { PrismaClient, InventoryMovement, InventoryMovementType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ProductService } from './productService';
import { LocationService } from './locationService';
import { parseSalesFloorCode } from '../utils/locationParser';

export interface PlaceInBackRequest {
  productId: string;
  backroomLocationCode: string;
  qty: number;
  notes?: string;
}

export interface PullFromBackRequest {
  productId: string;
  backroomLocationCode: string;
  qty: number;
  notes?: string;
}

export interface AuditBackroomRequest {
  productId: string;
  backroomLocationCode: string;
  actualQty: number;
  notes?: string;
}

export interface PlaceOnFloorRequest {
  productId: string;
  salesFloorLocationCode: string;
  qty: number;
  notes?: string;
}

export interface MoveOnFloorRequest {
  productId: string;
  fromSalesFloorLocationCode: string;
  toSalesFloorLocationCode: string;
  qty: number;
  notes?: string;
}

export interface RemoveFromFloorRequest {
  productId: string;
  salesFloorLocationCode: string;
  qty: number;
  notes?: string;
}

export class InventoryService {
  /**
   * Create inventory movement record
   */
  static async createMovement(data: {
    productId: string;
    type: InventoryMovementType;
    qty: number;
    fromBackroomLocationId?: string;
    toBackroomLocationId?: string;
    fromSalesFloorLocationId?: string;
    toSalesFloorLocationId?: string;
    reason?: string;
    performedBy?: string;
    notes?: string;
  }): Promise<InventoryMovement> {
    return prisma.inventoryMovement.create({
      data: {
        productId: data.productId,
        type: data.type,
        qty: data.qty,
        fromBackroomLocationId: data.fromBackroomLocationId,
        toBackroomLocationId: data.toBackroomLocationId,
        fromSalesFloorLocationId: data.fromSalesFloorLocationId,
        toSalesFloorLocationId: data.toSalesFloorLocationId,
        ...(data.reason !== undefined && { reason: data.reason }),
        ...(data.performedBy !== undefined && { performedBy: data.performedBy }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  /**
   * Place product in backroom
   */
  static async placeInBack(request: PlaceInBackRequest): Promise<InventoryMovement> {
    // Verify product exists
    const product = await ProductService.getById(request.productId);
    if (!product) {
      throw new Error(`Product '${request.productId}' not found`);
    }

    // Get or create backroom location
    const location = await LocationService.createBackroomLocation(
      request.backroomLocationCode
    );

    // Update stock
    const stock = await LocationService.getProductBackroomStock(
      request.productId,
      location.id
    );

    const currentQty = stock?.qty || 0;
    const newQty = currentQty + request.qty;

    await LocationService.updateProductBackroomStock(
      request.productId,
      location.id,
      newQty
    );

    // Create movement record
    return this.createMovement({
      productId: request.productId,
      type: 'PLACE_IN_BACK',
      qty: request.qty,
      toBackroomLocationId: location.id,
      notes: request.notes,
    });
  }

  /**
   * Pull product from backroom
   */
  static async pullFromBack(request: PullFromBackRequest): Promise<InventoryMovement> {
    // Verify product exists
    const product = await ProductService.getById(request.productId);
    if (!product) {
      throw new Error(`Product '${request.productId}' not found`);
    }

    // Get backroom location
    const location = await LocationService.getBackroomLocationByCode(
      request.backroomLocationCode
    );
    if (!location) {
      throw new Error(`Backroom location '${request.backroomLocationCode}' not found`);
    }

    // Check stock
    const stock = await LocationService.getProductBackroomStock(
      request.productId,
      location.id
    );

    const currentQty = stock?.qty || 0;
    if (currentQty < request.qty) {
      throw new Error(
        `Insufficient stock. Available: ${currentQty}, Requested: ${request.qty}`
      );
    }

    // Update stock
    await LocationService.updateProductBackroomStock(
      request.productId,
      location.id,
      currentQty - request.qty
    );

    // Create movement record
    return this.createMovement({
      productId: request.productId,
      type: 'PULL_FROM_BACK',
      qty: request.qty,
      fromBackroomLocationId: location.id,
      notes: request.notes,
    });
  }

  /**
   * Audit backroom location
   */
  static async auditBackroom(request: AuditBackroomRequest): Promise<InventoryMovement> {
    // Verify product exists
    const product = await ProductService.getById(request.productId);
    if (!product) {
      throw new Error(`Product '${request.productId}' not found`);
    }

    // Get backroom location
    const location = await LocationService.getBackroomLocationByCode(
      request.backroomLocationCode
    );
    if (!location) {
      throw new Error(`Backroom location '${request.backroomLocationCode}' not found`);
    }

    // Get current stock
    const stock = await LocationService.getProductBackroomStock(
      request.productId,
      location.id
    );

    const currentQty = stock?.qty || 0;
    const qtyDifference = request.actualQty - currentQty;

    // Update stock
    await LocationService.updateProductBackroomStock(
      request.productId,
      location.id,
      request.actualQty
    );

    // Update audit date
    if (stock) {
      await prisma.productBackroomStock.update({
        where: { id: stock.id },
        data: { lastAuditDate: new Date() },
      });
    }

    // Create movement record
    return this.createMovement({
      productId: request.productId,
      type: 'AUDIT_BACKROOM',
      qty: Math.abs(qtyDifference),
      fromBackroomLocationId: location.id,
      notes: request.notes || `Audit: ${currentQty} -> ${request.actualQty}`,
    });
  }

  /**
   * Place product on sales floor
   */
  static async placeOnFloor(request: PlaceOnFloorRequest): Promise<InventoryMovement> {
    // Verify product exists
    const product = await ProductService.getById(request.productId);
    if (!product) {
      throw new Error(`Product '${request.productId}' not found`);
    }

    // Get or create sales floor location
    const parsed = parseSalesFloorCode(request.salesFloorLocationCode);
    const location = await LocationService.getSalesFloorLocationByCode(
      request.salesFloorLocationCode
    ) || await LocationService.createSalesFloorLocation({
      departmentCode: parsed.departmentCode,
      parentCode: parsed.parentCode,
      sectionCode: parsed.sectionCode,
    });

    // Update stock
    const stock = await LocationService.getProductSalesFloorStock(
      request.productId,
      location.id
    );

    const currentQty = stock?.qty || 0;
    await LocationService.updateProductSalesFloorStock(
      request.productId,
      location.id,
      currentQty + request.qty
    );

    // Create movement record
    return this.createMovement({
      productId: request.productId,
      type: 'PLACE_ON_FLOOR',
      qty: request.qty,
      toSalesFloorLocationId: location.id,
      notes: request.notes,
    });
  }

  /**
   * Move product on sales floor
   */
  static async moveOnFloor(request: MoveOnFloorRequest): Promise<InventoryMovement> {
    // Verify product exists
    const product = await ProductService.getById(request.productId);
    if (!product) {
      throw new Error(`Product '${request.productId}' not found`);
    }

    // Get from location
    const fromLocation = await LocationService.getSalesFloorLocationByCode(
      request.fromSalesFloorLocationCode
    );
    if (!fromLocation) {
      throw new Error(
        `Sales floor location '${request.fromSalesFloorLocationCode}' not found`
      );
    }

    // Check stock at from location
    const fromStock = await LocationService.getProductSalesFloorStock(
      request.productId,
      fromLocation.id
    );

    const currentQty = fromStock?.qty || 0;
    if (currentQty < request.qty) {
      throw new Error(
        `Insufficient stock. Available: ${currentQty}, Requested: ${request.qty}`
      );
    }

    // Get or create to location
    const parsed = parseSalesFloorCode(request.toSalesFloorLocationCode);
    const toLocation = await LocationService.getSalesFloorLocationByCode(
      request.toSalesFloorLocationCode
    ) || await LocationService.createSalesFloorLocation({
      departmentCode: parsed.departmentCode,
      parentCode: parsed.parentCode,
      sectionCode: parsed.sectionCode,
    });

    // Update stock at from location
    await LocationService.updateProductSalesFloorStock(
      request.productId,
      fromLocation.id,
      currentQty - request.qty
    );

    // Update stock at to location
    const toStock = await LocationService.getProductSalesFloorStock(
      request.productId,
      toLocation.id
    );

    const toCurrentQty = toStock?.qty || 0;
    await LocationService.updateProductSalesFloorStock(
      request.productId,
      toLocation.id,
      toCurrentQty + request.qty
    );

    // Create movement record
    return this.createMovement({
      productId: request.productId,
      type: 'MOVE_ON_FLOOR',
      qty: request.qty,
      fromSalesFloorLocationId: fromLocation.id,
      toSalesFloorLocationId: toLocation.id,
      notes: request.notes,
    });
  }

  /**
   * Remove product from sales floor
   */
  static async removeFromFloor(
    request: RemoveFromFloorRequest
  ): Promise<InventoryMovement> {
    // Verify product exists
    const product = await ProductService.getById(request.productId);
    if (!product) {
      throw new Error(`Product '${request.productId}' not found`);
    }

    // Get sales floor location
    const location = await LocationService.getSalesFloorLocationByCode(
      request.salesFloorLocationCode
    );
    if (!location) {
      throw new Error(
        `Sales floor location '${request.salesFloorLocationCode}' not found`
      );
    }

    // Check stock
    const stock = await LocationService.getProductSalesFloorStock(
      request.productId,
      location.id
    );

    const currentQty = stock?.qty || 0;
    if (currentQty < request.qty) {
      throw new Error(
        `Insufficient stock. Available: ${currentQty}, Requested: ${request.qty}`
      );
    }

    // Update stock
    await LocationService.updateProductSalesFloorStock(
      request.productId,
      location.id,
      currentQty - request.qty
    );

    // Create movement record
    return this.createMovement({
      productId: request.productId,
      type: 'REMOVE_FROM_FLOOR',
      qty: request.qty,
      fromSalesFloorLocationId: location.id,
      notes: request.notes,
    });
  }

  /**
   * List movements
   */
  static async listMovements(options?: {
    skip?: number;
    take?: number;
    productId?: string;
  }) {
    return prisma.inventoryMovement.findMany({
      where: options?.productId ? { productId: options.productId } : undefined,
      skip: options?.skip,
      take: options?.take || 100,
      include: {
        product: true,
        fromBackroomLocation: true,
        toBackroomLocation: true,
        fromSalesFloorLocation: true,
        toSalesFloorLocation: true,
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get movement by ID
   */
  static async getMovementById(id: string): Promise<InventoryMovement | null> {
    return prisma.inventoryMovement.findUnique({
      where: { id },
      include: {
        product: true,
        fromBackroomLocation: true,
        toBackroomLocation: true,
        fromSalesFloorLocation: true,
        toSalesFloorLocation: true,
      },
    });
  }

  /**
   * Generic move between locations
   * Action: 4.3 Inventory Actions - Generic Move Between Locations
   */
  static async move(data: {
    productId: string;
    fromLocationCode?: string;
    toLocationCode: string;
    fromLocationType?: 'BACKROOM' | 'SALES_FLOOR';
    toLocationType: 'BACKROOM' | 'SALES_FLOOR';
    qty: number;
    reason?: string;
    notes?: string;
  }) {
    const product = await ProductService.getById(data.productId);
    if (!product) {
      throw new Error(`Product '${data.productId}' not found`);
    }

    // Get to location
    let toLocationId: string;
    if (data.toLocationType === 'BACKROOM') {
      const toLocation = await LocationService.getBackroomLocationByCode(data.toLocationCode);
      if (!toLocation) {
        throw new Error(`Backroom location '${data.toLocationCode}' not found`);
      }
      toLocationId = toLocation.id;
    } else {
      const toLocation = await LocationService.getSalesFloorLocationByCode(data.toLocationCode);
      if (!toLocation) {
        throw new Error(`Sales floor location '${data.toLocationCode}' not found`);
      }
      toLocationId = toLocation.id;
    }

    // Get from location if provided
    let fromLocationId: string | undefined;
    if (data.fromLocationCode && data.fromLocationType) {
      if (data.fromLocationType === 'BACKROOM') {
        const fromLocation = await LocationService.getBackroomLocationByCode(data.fromLocationCode);
        if (!fromLocation) {
          throw new Error(`Backroom location '${data.fromLocationCode}' not found`);
        }
        fromLocationId = fromLocation.id;
      } else {
        const fromLocation = await LocationService.getSalesFloorLocationByCode(data.fromLocationCode);
        if (!fromLocation) {
          throw new Error(`Sales floor location '${data.fromLocationCode}' not found`);
        }
        fromLocationId = fromLocation.id;
      }
    }

    // Decrease from location stock
    if (fromLocationId) {
      if (data.fromLocationType === 'BACKROOM') {
        const stock = await LocationService.getProductBackroomStock(data.productId, fromLocationId);
        if (!stock || stock.qty < data.qty) {
          throw new Error(`Insufficient stock at source location`);
        }
        await LocationService.updateProductBackroomStock(data.productId, fromLocationId, stock.qty - data.qty);
      } else {
        const stock = await LocationService.getProductSalesFloorStock(data.productId, fromLocationId);
        if (!stock || stock.qty < data.qty) {
          throw new Error(`Insufficient stock at source location`);
        }
        await LocationService.updateProductSalesFloorStock(data.productId, fromLocationId, stock.qty - data.qty);
      }
    }

    // Increase to location stock
    if (data.toLocationType === 'BACKROOM') {
      const stock = await LocationService.getProductBackroomStock(data.productId, toLocationId);
      const currentQty = stock?.qty || 0;
      await LocationService.updateProductBackroomStock(data.productId, toLocationId, currentQty + data.qty);
    } else {
      const stock = await LocationService.getProductSalesFloorStock(data.productId, toLocationId);
      const currentQty = stock?.qty || 0;
      await LocationService.updateProductSalesFloorStock(data.productId, toLocationId, currentQty + data.qty);
    }

    // Create movement record
    const movementData: any = {
      productId: data.productId,
      qty: data.qty,
      type: 'MOVE',
      reason: data.reason,
      notes: data.notes,
    };

    if (data.fromLocationType === 'BACKROOM') {
      movementData.fromBackroomLocationId = fromLocationId;
    } else if (data.fromLocationType === 'SALES_FLOOR') {
      movementData.fromSalesFloorLocationId = fromLocationId;
    }

    if (data.toLocationType === 'BACKROOM') {
      movementData.toBackroomLocationId = toLocationId;
    } else {
      movementData.toSalesFloorLocationId = toLocationId;
    }

    return this.createMovement(movementData);
  }

  /**
   * Manual adjustment
   * Action: 4.3 Inventory Actions - Adjust Inventory
   */
  static async adjust(data: {
    productId: string;
    locationCode: string;
    locationType: 'BACKROOM' | 'SALES_FLOOR';
    qty: number; // Can be negative
    reason?: string;
    notes?: string;
  }) {
    const product = await ProductService.getById(data.productId);
    if (!product) {
      throw new Error(`Product '${data.productId}' not found`);
    }

    let locationId: string;
    if (data.locationType === 'BACKROOM') {
      const location = await LocationService.getBackroomLocationByCode(data.locationCode);
      if (!location) {
        throw new Error(`Backroom location '${data.locationCode}' not found`);
      }
      locationId = location.id;
    } else {
      const location = await LocationService.getSalesFloorLocationByCode(data.locationCode);
      if (!location) {
        throw new Error(`Sales floor location '${data.locationCode}' not found`);
      }
      locationId = location.id;
    }

    // Get current stock
    let currentQty = 0;
    if (data.locationType === 'BACKROOM') {
      const stock = await LocationService.getProductBackroomStock(data.productId, locationId);
      currentQty = stock?.qty || 0;
    } else {
      const stock = await LocationService.getProductSalesFloorStock(data.productId, locationId);
      currentQty = stock?.qty || 0;
    }

    const newQty = currentQty + data.qty;
    if (newQty < 0) {
      throw new Error(`Adjustment would result in negative stock`);
    }

    // Update stock
    if (data.locationType === 'BACKROOM') {
      await LocationService.updateProductBackroomStock(data.productId, locationId, newQty);
    } else {
      await LocationService.updateProductSalesFloorStock(data.productId, locationId, newQty);
    }

    // Create movement record
    const movementData: any = {
      productId: data.productId,
      qty: Math.abs(data.qty),
      type: 'ADJUSTMENT',
      reason: data.reason,
      notes: data.notes,
    };

    if (data.locationType === 'BACKROOM') {
      movementData.toBackroomLocationId = locationId;
    } else {
      movementData.toSalesFloorLocationId = locationId;
    }

    return this.createMovement(movementData);
  }

  /**
   * Audit entire location
   * Action: 4.3 Inventory Actions - Audit Bin / Audit Location
   */
  static async auditLocation(data: {
    locationCode: string;
    locationType: 'BACKROOM' | 'SALES_FLOOR';
    counts: Record<string, number>; // productId -> countedQty
    notes?: string;
  }) {
    let locationId: string;
    if (data.locationType === 'BACKROOM') {
      const location = await LocationService.getBackroomLocationByCode(data.locationCode);
      if (!location) {
        throw new Error(`Backroom location '${data.locationCode}' not found`);
      }
      locationId = location.id;
    } else {
      const location = await LocationService.getSalesFloorLocationByCode(data.locationCode);
      if (!location) {
        throw new Error(`Sales floor location '${data.locationCode}' not found`);
      }
      locationId = location.id;
    }

    const adjustments: any[] = [];

    for (const [productId, countedQty] of Object.entries(data.counts)) {
      // Get current stock
      let currentQty = 0;
      if (data.locationType === 'BACKROOM') {
        const stock = await LocationService.getProductBackroomStock(productId, locationId);
        currentQty = stock?.qty || 0;
      } else {
        const stock = await LocationService.getProductSalesFloorStock(productId, locationId);
        currentQty = stock?.qty || 0;
      }

      const adjustment = countedQty - currentQty;

      if (adjustment !== 0) {
        // Update stock
        if (data.locationType === 'BACKROOM') {
          await LocationService.updateProductBackroomStock(productId, locationId, countedQty);
          await prisma.productBackroomStock.updateMany({
            where: {
              productId,
              backroomLocationId: locationId,
            },
            data: {
              lastAuditDate: new Date(),
            },
          });
        } else {
          await LocationService.updateProductSalesFloorStock(productId, locationId, countedQty);
          await prisma.productSalesFloorStock.updateMany({
            where: {
              productId,
              salesFloorLocationId: locationId,
            },
            data: {
              lastAuditDate: new Date(),
            },
          });
        }

        // Create movement record
        const movementData: any = {
          productId,
          qty: Math.abs(adjustment),
          type: 'AUDIT_CORRECTION',
          notes: data.notes,
        };

        if (data.locationType === 'BACKROOM') {
          movementData.toBackroomLocationId = locationId;
        } else {
          movementData.toSalesFloorLocationId = locationId;
        }

        const movement = await this.createMovement(movementData);
        adjustments.push({
          productId,
          previousQty: currentQty,
          countedQty,
          adjustment,
          movementId: movement.id,
        });
      }
    }

    return {
      locationCode: data.locationCode,
      locationType: data.locationType,
      adjustments,
      totalProductsAudited: Object.keys(data.counts).length,
      totalAdjustments: adjustments.length,
    };
  }
}


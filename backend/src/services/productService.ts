import { PrismaClient, Product, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class ProductService {
  /**
   * Create a new product
   */
  static async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return prisma.product.create({ data });
  }

  /**
   * Get product by ID
   */
  static async getById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
      include: {
        style: true,
        variant: true,
        department: true,
        salesStock: { include: { location: true } },
        backStock: { include: { location: true } },
      },
    });
  }

  /**
   * Get all locations for a product (backroom + sales floor)
   */
  static async getProductLocations(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        backStock: {
          include: {
            location: {
              include: {
                aisle: true,
                column: true,
                bay: true,
                overflowTote: true,
              },
            },
          },
        },
        salesStock: {
          include: {
            location: {
              include: {
                department: true,
                parentFixture: true,
                section: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    return {
      backroom: product.backStock.map((stock) => ({
        locationId: stock.location.id,
        locationCode: stock.location.locationCode,
        qty: stock.qty,
        lastAuditDate: stock.lastAuditDate,
      })),
      salesFloor: product.salesStock.map((stock) => ({
        locationId: stock.location.id,
        locationCode: stock.location.locationCode,
        qty: stock.qty,
        lastAuditDate: stock.lastAuditDate,
      })),
    };
  }

  /**
   * Get product by UPC
   * If not found, creates a stub product with UNCONFIGURED status
   */
  static async getByUpc(upc: string, createIfNotFound: boolean = true): Promise<Product | null> {
    let product = await prisma.product.findUnique({
      where: { upc },
      include: {
        style: true,
        variant: true,
        department: true,
        salesStock: { include: { location: true } },
        backStock: { include: { location: true } },
      },
    });

    // If not found and createIfNotFound is true, create a stub product
    if (!product && createIfNotFound) {
      product = await prisma.product.create({
        data: {
          upc,
          name: `Unknown Product (${upc})`,
          status: 'UNCONFIGURED',
        },
        include: {
          style: true,
          variant: true,
          department: true,
          salesStock: { include: { location: true } },
          backStock: { include: { location: true } },
        },
      });
    }

    return product;
  }

  /**
   * List products with filters
   */
  static async list(options?: {
    skip?: number;
    take?: number;
    styleId?: string;
    departmentId?: string;
    variantId?: string;
    status?: string;
    q?: string; // search query
  }): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {};
    
    if (options?.styleId) {
      where.styleId = options.styleId;
    }
    if (options?.departmentId) {
      where.departmentId = options.departmentId;
    }
    if (options?.variantId) {
      where.variantId = options.variantId;
    }
    if (options?.status) {
      where.status = options.status as any;
    }
    if (options?.q) {
      where.OR = [
        { name: { contains: options.q, mode: 'insensitive' } },
        { upc: { contains: options.q } },
      ];
    }

    return prisma.product.findMany({
      where,
      skip: options?.skip,
      take: options?.take || 100,
      include: {
        style: true,
        variant: true,
        department: true,
        salesStock: { include: { location: true } },
        backStock: { include: { location: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update product
   */
  static async update(
    id: string,
    data: Prisma.ProductUpdateInput
  ): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete product
   */
  static async delete(id: string): Promise<Product> {
    return prisma.product.delete({
      where: { id },
    });
  }
}


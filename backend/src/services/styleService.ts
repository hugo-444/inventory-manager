import { PrismaClient, Style, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class StyleService {
  /**
   * Create a new style
   */
  static async create(data: Prisma.StyleCreateInput): Promise<Style> {
    return prisma.style.create({ data });
  }

  /**
   * Get style by ID
   */
  static async getById(id: string): Promise<Style | null> {
    return prisma.style.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
  }

  /**
   * Get style by code
   */
  static async getByCode(styleCode: string): Promise<Style | null> {
    return prisma.style.findUnique({
      where: { styleCode },
      include: {
        products: true,
      },
    });
  }

  /**
   * List styles
   */
  static async list(options?: {
    skip?: number;
    take?: number;
  }): Promise<Style[]> {
    return prisma.style.findMany({
      skip: options?.skip,
      take: options?.take || 100,
      include: {
        products: true,
      },
      orderBy: { styleCode: 'asc' },
    });
  }

  /**
   * Update style
   */
  static async update(
    id: string,
    data: Prisma.StyleUpdateInput
  ): Promise<Style> {
    return prisma.style.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete style
   */
  static async delete(id: string): Promise<Style> {
    return prisma.style.delete({
      where: { id },
    });
  }

  /**
   * Get variants for style with aggregated inventory
   * Action: 4.4 Query Actions - Get Variants for Style
   */
  static async getVariantsWithInventory(styleId: string) {
    const style = await prisma.style.findUnique({
      where: { id: styleId },
      include: {
        variants: {
          include: {
            products: {
              include: {
                backStock: true,
                salesStock: true,
              },
            },
          },
        },
      },
    });

    if (!style) {
      return null;
    }

    return style.variants.map((variant) => {
      // Aggregate inventory across all products in this variant
      let totalBackroomQty = 0;
      let totalSalesFloorQty = 0;
      const locations: { backroom: string[]; salesFloor: string[] } = {
        backroom: [],
        salesFloor: [],
      };

      variant.products.forEach((product) => {
        product.backStock.forEach((stock) => {
          totalBackroomQty += stock.qty;
          if (!locations.backroom.includes(stock.location.locationCode)) {
            locations.backroom.push(stock.location.locationCode);
          }
        });
        product.salesStock.forEach((stock) => {
          totalSalesFloorQty += stock.qty;
          if (!locations.salesFloor.includes(stock.location.locationCode)) {
            locations.salesFloor.push(stock.location.locationCode);
          }
        });
      });

      return {
        id: variant.id,
        variantCode: variant.variantCode,
        size: variant.size,
        color: variant.color,
        flavor: variant.flavor,
        packSize: variant.packSize,
        metadata: variant.metadata,
        totalInventory: {
          backroom: totalBackroomQty,
          salesFloor: totalSalesFloorQty,
          total: totalBackroomQty + totalSalesFloorQty,
        },
        locations,
        productCount: variant.products.length,
      };
    });
  }
}


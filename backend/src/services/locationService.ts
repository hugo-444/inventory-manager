import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  parseSalesFloorCode,
  parseBackroomCode,
  parseOverflowCode,
  buildSalesFloorCode,
  buildBackroomCode,
  isOverflowCode,
} from '../utils/locationParser';

export class LocationService {
  // ========================================================================
  // Department Operations
  // ========================================================================

  static async createDepartment(data: Prisma.DepartmentCreateInput) {
    return prisma.department.create({ data });
  }

  static async getDepartmentById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      include: {
        fixtures: true,
        locations: true,
      },
    });
  }

  static async getDepartmentByCode(code: string) {
    return prisma.department.findUnique({
      where: { code },
      include: {
        fixtures: true,
        locations: true,
      },
    });
  }

  static async listDepartments() {
    return prisma.department.findMany({
      include: {
        fixtures: true,
      },
    });
  }

  // ========================================================================
  // Parent Fixture Operations
  // ========================================================================

  static async createParentFixture(data: Prisma.ParentFixtureCreateInput) {
    return prisma.parentFixture.create({ data });
  }

  static async getParentFixtureById(id: string) {
    return prisma.parentFixture.findUnique({
      where: { id },
      include: {
        department: true,
        sections: true,
        locations: true,
      },
    });
  }

  static async listParentFixtures(departmentId?: string) {
    return prisma.parentFixture.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: true,
        sections: true,
      },
    });
  }

  // ========================================================================
  // Section Operations
  // ========================================================================

  static async createSection(data: Prisma.SectionCreateInput) {
    return prisma.section.create({ data });
  }

  static async getSectionById(id: string) {
    return prisma.section.findUnique({
      where: { id },
      include: {
        parentFixture: true,
        locations: true,
      },
    });
  }

  static async listSections(parentFixtureId?: string) {
    return prisma.section.findMany({
      where: parentFixtureId ? { parentFixtureId } : undefined,
      include: {
        parentFixture: true,
      },
    });
  }

  // ========================================================================
  // Sales Floor Location Operations
  // ========================================================================

  static async createSalesFloorLocation(data: {
    departmentCode: string;
    parentCode: string;
    sectionCode?: string;
  }) {
    // Get or verify department
    const dept = await this.getDepartmentByCode(data.departmentCode);
    if (!dept) {
      throw new Error(`Department '${data.departmentCode}' not found`);
    }

    // Get or verify parent fixture
    const fixture = await prisma.parentFixture.findFirst({
      where: {
        departmentId: dept.id,
        parentCode: data.parentCode,
      },
    });

    if (!fixture) {
      throw new Error(
        `Parent fixture '${data.parentCode}' not found in department '${data.departmentCode}'`
      );
    }

    // Get or verify section if provided
    let section = null;
    if (data.sectionCode) {
      section = await prisma.section.findFirst({
        where: {
          parentFixtureId: fixture.id,
          sectionCode: `(${data.sectionCode})`,
        },
      });

      if (!section) {
        throw new Error(
          `Section '${data.sectionCode}' not found in parent fixture '${data.parentCode}'`
        );
      }
    }

    // Build location code
    const locationCode = buildSalesFloorCode(
      data.departmentCode,
      data.parentCode,
      data.sectionCode
    );

    // Check if location already exists
    const existing = await prisma.salesFloorLocation.findUnique({
      where: { locationCode },
    });

    if (existing) {
      return existing;
    }

    // Create location
    return prisma.salesFloorLocation.create({
      data: {
        departmentId: dept.id,
        parentFixtureId: fixture.id,
        sectionId: section?.id,
        locationCode,
      },
    });
  }

  static async getSalesFloorLocationByCode(locationCode: string) {
    return prisma.salesFloorLocation.findUnique({
      where: { locationCode },
      include: {
        department: true,
        parentFixture: true,
        section: true,
        products: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  static async listSalesFloorLocations() {
    return prisma.salesFloorLocation.findMany({
      include: {
        department: true,
        parentFixture: true,
        section: true,
      },
    });
  }

  // ========================================================================
  // Backroom Location Operations
  // ========================================================================

  static async createBackroomLocation(locationCode: string) {
    // Check if location already exists
    const existing = await prisma.backroomLocation.findUnique({
      where: { locationCode },
    });

    if (existing) {
      return existing;
    }

    if (isOverflowCode(locationCode)) {
      // Handle overflow tote
      const overflowData = parseOverflowCode(locationCode);

      // Get or create overflow tote
      let tote = await prisma.overflowTote.findUnique({
        where: { code: overflowData.code },
      });

      if (!tote) {
        tote = await prisma.overflowTote.create({
          data: { code: overflowData.code },
        });
      }

      return prisma.backroomLocation.create({
        data: {
          overflowToteId: tote.id,
          locationCode,
        },
      });
    } else {
      // Handle regular backroom location
      const backroomData = parseBackroomCode(locationCode);

      // Get or create aisle
      let aisle = await prisma.backroomAisle.findUnique({
        where: { aisleNumber: backroomData.aisleNumber },
      });

      if (!aisle) {
        aisle = await prisma.backroomAisle.create({
          data: { aisleNumber: backroomData.aisleNumber },
        });
      }

      // Get or create column
      let column = await prisma.backroomColumn.findFirst({
        where: {
          aisleId: aisle.id,
          columnLetter: backroomData.columnLetter,
        },
      });

      if (!column) {
        column = await prisma.backroomColumn.create({
          data: {
            aisleId: aisle.id,
            columnLetter: backroomData.columnLetter,
          },
        });
      }

      // Get or create bay
      const bayType = backroomData.bayNumber <= 9 ? 'shelf' : 'tray';
      let bay = await prisma.backroomBay.findFirst({
        where: {
          columnId: column.id,
          bayNumber: backroomData.bayNumber,
        },
      });

      if (!bay) {
        bay = await prisma.backroomBay.create({
          data: {
            columnId: column.id,
            bayNumber: backroomData.bayNumber,
            type: bayType,
          },
        });
      }

      return prisma.backroomLocation.create({
        data: {
          aisleId: aisle.id,
          columnId: column.id,
          bayId: bay.id,
          locationCode,
        },
      });
    }
  }

  static async getBackroomLocationByCode(locationCode: string) {
    return prisma.backroomLocation.findUnique({
      where: { locationCode },
      include: {
        aisle: true,
        column: true,
        bay: true,
        overflowTote: true,
        stock: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  static async listBackroomLocations() {
    return prisma.backroomLocation.findMany({
      include: {
        aisle: true,
        column: true,
        bay: true,
        overflowTote: true,
      },
    });
  }

  // ========================================================================
  // Stock Operations
  // ========================================================================

  static async getProductSalesFloorStock(
    productId: string,
    locationId: string
  ) {
    return prisma.productSalesFloorStock.findFirst({
      where: {
        productId,
        salesFloorLocationId: locationId,
      },
    });
  }

  static async getProductBackroomStock(
    productId: string,
    locationId: string
  ) {
    return prisma.productBackroomStock.findFirst({
      where: {
        productId,
        backroomLocationId: locationId,
      },
    });
  }

  static async updateProductSalesFloorStock(
    productId: string,
    locationId: string,
    qty: number
  ) {
    return prisma.productSalesFloorStock.upsert({
      where: {
        productId_salesFloorLocationId: {
          productId,
          salesFloorLocationId: locationId,
        },
      },
      update: { qty },
      create: {
        productId,
        salesFloorLocationId: locationId,
        qty,
      },
    });
  }

  static async updateProductBackroomStock(
    productId: string,
    locationId: string,
    qty: number
  ) {
    return prisma.productBackroomStock.upsert({
      where: {
        productId_backroomLocationId: {
          productId,
          backroomLocationId: locationId,
        },
      },
      update: { qty },
      create: {
        productId,
        backroomLocationId: locationId,
        qty,
      },
    });
  }
}


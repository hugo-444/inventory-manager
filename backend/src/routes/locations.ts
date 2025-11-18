import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { LocationService } from '../services/locationService';
import { z } from 'zod';

const createDepartmentSchema = z.object({
  code: z.string(),
  name: z.string(),
});

const createParentFixtureSchema = z.object({
  departmentId: z.string().uuid(),
  parentCode: z.string(),
  type: z.enum(['table', 'bunker', 'wall', 'wall_section', 'bar', 'bar_section', 'spinner', 'window', 'surrounding', 'custom']),
  description: z.string().optional(),
});

const createSectionSchema = z.object({
  parentFixtureId: z.string().uuid(),
  sectionCode: z.string(),
  sectionType: z.enum(['bunker', 'wall', 'wall_section', 'bar', 'bar_section', 'spinner', 'window', 'surrounding', 'overflow']),
  description: z.string().optional(),
});

const createSalesFloorLocationSchema = z.object({
  departmentCode: z.string(),
  parentCode: z.string(),
  sectionCode: z.string().optional(),
});

const createBackroomLocationSchema = z.object({
  locationCode: z.string(),
});

export async function locationRoutes(fastify: FastifyInstance) {
  // ========================================================================
  // Department Routes
  // ========================================================================

  fastify.post(
    '/api/locations/departments',
    async (request: FastifyRequest<{ Body: z.infer<typeof createDepartmentSchema> }>, reply: FastifyReply) => {
      try {
        const department = await LocationService.createDepartment(request.body);
        return reply.code(201).send(department);
      } catch (error: any) {
        if (error.code === 'P2002') {
          return reply.code(400).send({ error: 'Department with this code already exists' });
        }
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.get('/api/locations/departments', async (request: FastifyRequest, reply: FastifyReply) => {
    const departments = await LocationService.listDepartments();
    return reply.send(departments);
  });

  fastify.get(
    '/api/locations/departments/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const department = await LocationService.getDepartmentById(request.params.id);
      if (!department) {
        return reply.code(404).send({ error: 'Department not found' });
      }
      return reply.send(department);
    }
  );

  // ========================================================================
  // Parent Fixture Routes
  // ========================================================================

  fastify.post(
    '/api/locations/parent-fixtures',
    async (request: FastifyRequest<{ Body: z.infer<typeof createParentFixtureSchema> }>, reply: FastifyReply) => {
      try {
        const fixture = await LocationService.createParentFixture(request.body);
        return reply.code(201).send(fixture);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.get(
    '/api/locations/parent-fixtures',
    async (request: FastifyRequest<{ Querystring: { departmentId?: string } }>, reply: FastifyReply) => {
      const fixtures = await LocationService.listParentFixtures(request.query.departmentId);
      return reply.send(fixtures);
    }
  );

  fastify.get(
    '/api/locations/parent-fixtures/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const fixture = await LocationService.getParentFixtureById(request.params.id);
      if (!fixture) {
        return reply.code(404).send({ error: 'Parent fixture not found' });
      }
      return reply.send(fixture);
    }
  );

  // ========================================================================
  // Section Routes
  // ========================================================================

  fastify.post(
    '/api/locations/sections',
    async (request: FastifyRequest<{ Body: z.infer<typeof createSectionSchema> }>, reply: FastifyReply) => {
      try {
        const section = await LocationService.createSection(request.body);
        return reply.code(201).send(section);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.get(
    '/api/locations/sections',
    async (request: FastifyRequest<{ Querystring: { parentFixtureId?: string } }>, reply: FastifyReply) => {
      const sections = await LocationService.listSections(request.query.parentFixtureId);
      return reply.send(sections);
    }
  );

  fastify.get(
    '/api/locations/sections/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const section = await LocationService.getSectionById(request.params.id);
      if (!section) {
        return reply.code(404).send({ error: 'Section not found' });
      }
      return reply.send(section);
    }
  );

  // ========================================================================
  // Sales Floor Location Routes
  // ========================================================================

  fastify.post(
    '/api/locations/sales-floor',
    async (request: FastifyRequest<{ Body: z.infer<typeof createSalesFloorLocationSchema> }>, reply: FastifyReply) => {
      try {
        const location = await LocationService.createSalesFloorLocation(request.body);
        return reply.code(201).send(location);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.get('/api/locations/sales-floor', async (request: FastifyRequest, reply: FastifyReply) => {
    const locations = await LocationService.listSalesFloorLocations();
    return reply.send(locations);
  });

  fastify.get(
    '/api/locations/sales-floor/:code',
    async (request: FastifyRequest<{ Params: { code: string } }>, reply: FastifyReply) => {
      const location = await LocationService.getSalesFloorLocationByCode(request.params.code);
      if (!location) {
        return reply.code(404).send({ error: 'Sales floor location not found' });
      }
      return reply.send(location);
    }
  );

  // ========================================================================
  // Backroom Location Routes
  // ========================================================================

  fastify.post(
    '/api/locations/backroom',
    async (request: FastifyRequest<{ Body: z.infer<typeof createBackroomLocationSchema> }>, reply: FastifyReply) => {
      try {
        const location = await LocationService.createBackroomLocation(request.body.locationCode);
        return reply.code(201).send(location);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.get('/api/locations/backroom', async (request: FastifyRequest, reply: FastifyReply) => {
    const locations = await LocationService.listBackroomLocations();
    return reply.send(locations);
  });

  fastify.get(
    '/api/locations/backroom/:code',
    async (request: FastifyRequest<{ Params: { code: string } }>, reply: FastifyReply) => {
      const location = await LocationService.getBackroomLocationByCode(request.params.code);
      if (!location) {
        return reply.code(404).send({ error: 'Backroom location not found' });
      }
      return reply.send(location);
    }
  );

  // Get products at a location (works for both backroom and sales floor)
  // Action: 4.4 Query Actions - Get Products at Location
  fastify.get(
    '/api/locations/backroom/:code/products',
    async (request: FastifyRequest<{ Params: { code: string } }>, reply: FastifyReply) => {
      const location = await LocationService.getBackroomLocationByCode(request.params.code);
      if (!location) {
        return reply.code(404).send({ error: 'Backroom location not found' });
      }
      
      const products = location.stock?.map((stock) => ({
        productId: stock.product.id,
        upc: stock.product.upc,
        name: stock.product.name,
        qty: stock.qty,
        lastAuditDate: stock.lastAuditDate,
      })) || [];
      
      return reply.send(products);
    }
  );

  fastify.get(
    '/api/locations/sales-floor/:code/products',
    async (request: FastifyRequest<{ Params: { code: string } }>, reply: FastifyReply) => {
      const location = await LocationService.getSalesFloorLocationByCode(request.params.code);
      if (!location) {
        return reply.code(404).send({ error: 'Sales floor location not found' });
      }
      
      const products = location.products?.map((stock) => ({
        productId: stock.product.id,
        upc: stock.product.upc,
        name: stock.product.name,
        qty: stock.qty,
        lastAuditDate: stock.lastAuditDate,
      })) || [];
      
      return reply.send(products);
    }
  );

  // Unified location endpoint - get location by code (works for both types)
  fastify.get(
    '/api/locations/:code',
    async (request: FastifyRequest<{ Params: { code: string } }>, reply: FastifyReply) => {
      // Try backroom first
      const backroomLocation = await LocationService.getBackroomLocationByCode(request.params.code);
      if (backroomLocation) {
        return reply.send({
          type: 'BACKROOM',
          ...backroomLocation,
        });
      }

      // Try sales floor
      const salesFloorLocation = await LocationService.getSalesFloorLocationByCode(request.params.code);
      if (salesFloorLocation) {
        return reply.send({
          type: 'SALES_FLOOR',
          ...salesFloorLocation,
        });
      }

      return reply.code(404).send({ error: 'Location not found' });
    }
  );

  // Unified location products endpoint
  fastify.get(
    '/api/locations/:code/products',
    async (request: FastifyRequest<{ Params: { code: string } }>, reply: FastifyReply) => {
      // Try backroom first
      const backroomLocation = await LocationService.getBackroomLocationByCode(request.params.code);
      if (backroomLocation) {
        const products = backroomLocation.stock?.map((stock) => ({
          productId: stock.product.id,
          upc: stock.product.upc,
          name: stock.product.name,
          qty: stock.qty,
          lastAuditDate: stock.lastAuditDate,
        })) || [];
        return reply.send({ type: 'BACKROOM', products });
      }

      // Try sales floor
      const salesFloorLocation = await LocationService.getSalesFloorLocationByCode(request.params.code);
      if (salesFloorLocation) {
        const products = salesFloorLocation.products?.map((stock) => ({
          productId: stock.product.id,
          upc: stock.product.upc,
          name: stock.product.name,
          qty: stock.qty,
          lastAuditDate: stock.lastAuditDate,
        })) || [];
        return reply.send({ type: 'SALES_FLOOR', products });
      }

      return reply.code(404).send({ error: 'Location not found' });
    }
  );
}


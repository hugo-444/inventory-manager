import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { InventoryService } from '../services/inventoryService';
import { z } from 'zod';

const placeInBackSchema = z.object({
  productId: z.string().uuid(),
  backroomLocationCode: z.string(),
  qty: z.number().positive(),
  notes: z.string().optional(),
});

const pullFromBackSchema = z.object({
  productId: z.string().uuid(),
  backroomLocationCode: z.string(),
  qty: z.number().positive(),
  notes: z.string().optional(),
});

const auditBackroomSchema = z.object({
  productId: z.string().uuid(),
  backroomLocationCode: z.string(),
  actualQty: z.number().nonnegative(),
  notes: z.string().optional(),
});

const placeOnFloorSchema = z.object({
  productId: z.string().uuid(),
  salesFloorLocationCode: z.string(),
  qty: z.number().positive(),
  notes: z.string().optional(),
});

const moveOnFloorSchema = z.object({
  productId: z.string().uuid(),
  fromSalesFloorLocationCode: z.string(),
  toSalesFloorLocationCode: z.string(),
  qty: z.number().positive(),
  notes: z.string().optional(),
});

const removeFromFloorSchema = z.object({
  productId: z.string().uuid(),
  salesFloorLocationCode: z.string(),
  qty: z.number().positive(),
  notes: z.string().optional(),
});

export async function inventoryRoutes(fastify: FastifyInstance) {
  // List movements
  fastify.get(
    '/api/inventory/movements',
    async (
      request: FastifyRequest<{
        Querystring: { skip?: string; take?: string; productId?: string };
      }>,
      reply: FastifyReply
    ) => {
      const movements = await InventoryService.listMovements({
        skip: request.query.skip ? parseInt(request.query.skip, 10) : undefined,
        take: request.query.take ? parseInt(request.query.take, 10) : undefined,
        productId: request.query.productId,
      });
      return reply.send(movements);
    }
  );

  // Get movement by ID
  fastify.get(
    '/api/inventory/movements/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const movement = await InventoryService.getMovementById(request.params.id);
      if (!movement) {
        return reply.code(404).send({ error: 'Movement not found' });
      }
      return reply.send(movement);
    }
  );

  // Place in back
  fastify.post(
    '/api/inventory/place-in-back',
    async (request: FastifyRequest<{ Body: z.infer<typeof placeInBackSchema> }>, reply: FastifyReply) => {
      try {
        const movement = await InventoryService.placeInBack(request.body);
        return reply.code(201).send(movement);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Pull from back
  fastify.post(
    '/api/inventory/pull-from-back',
    async (request: FastifyRequest<{ Body: z.infer<typeof pullFromBackSchema> }>, reply: FastifyReply) => {
      try {
        const movement = await InventoryService.pullFromBack(request.body);
        return reply.code(201).send(movement);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Audit backroom
  fastify.post(
    '/api/inventory/audit-backroom',
    async (request: FastifyRequest<{ Body: z.infer<typeof auditBackroomSchema> }>, reply: FastifyReply) => {
      try {
        const movement = await InventoryService.auditBackroom(request.body);
        return reply.code(201).send(movement);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Place on floor
  fastify.post(
    '/api/inventory/place-on-floor',
    async (request: FastifyRequest<{ Body: z.infer<typeof placeOnFloorSchema> }>, reply: FastifyReply) => {
      try {
        const movement = await InventoryService.placeOnFloor(request.body);
        return reply.code(201).send(movement);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Move on floor
  fastify.post(
    '/api/inventory/move-on-floor',
    async (request: FastifyRequest<{ Body: z.infer<typeof moveOnFloorSchema> }>, reply: FastifyReply) => {
      try {
        const movement = await InventoryService.moveOnFloor(request.body);
        return reply.code(201).send(movement);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Remove from floor
  fastify.post(
    '/api/inventory/remove-from-floor',
    async (request: FastifyRequest<{ Body: z.infer<typeof removeFromFloorSchema> }>, reply: FastifyReply) => {
      try {
        const movement = await InventoryService.removeFromFloor(request.body);
        return reply.code(201).send(movement);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Generic move between locations
  // Action: 4.3 Inventory Actions - Generic Move Between Locations
  const moveSchema = z.object({
    productId: z.string().uuid(),
    fromLocationCode: z.string().optional(),
    toLocationCode: z.string(),
    fromLocationType: z.enum(['BACKROOM', 'SALES_FLOOR']).optional(),
    toLocationType: z.enum(['BACKROOM', 'SALES_FLOOR']),
    qty: z.number().positive(),
    reason: z.string().optional(),
    notes: z.string().optional(),
  });

  fastify.post(
    '/api/inventory/move',
    async (request: FastifyRequest<{ Body: z.infer<typeof moveSchema> }>, reply: FastifyReply) => {
      try {
        const movement = await InventoryService.move(request.body);
        return reply.code(201).send(movement);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Manual adjustment
  // Action: 4.3 Inventory Actions - Adjust Inventory
  const adjustSchema = z.object({
    productId: z.string().uuid(),
    locationCode: z.string(),
    locationType: z.enum(['BACKROOM', 'SALES_FLOOR']),
    qty: z.number(), // Can be negative for reductions
    reason: z.string().optional(),
    notes: z.string().optional(),
  });

  fastify.post(
    '/api/inventory/adjust',
    async (request: FastifyRequest<{ Body: z.infer<typeof adjustSchema> }>, reply: FastifyReply) => {
      try {
        const movement = await InventoryService.adjust(request.body);
        return reply.code(201).send(movement);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Audit entire location
  // Action: 4.3 Inventory Actions - Audit Bin / Audit Location
  const auditLocationSchema = z.object({
    locationCode: z.string(),
    locationType: z.enum(['BACKROOM', 'SALES_FLOOR']),
    counts: z.record(z.string().uuid(), z.number().nonnegative()), // productId -> countedQty
    notes: z.string().optional(),
  });

  fastify.post(
    '/api/inventory/audit-location',
    async (request: FastifyRequest<{ Body: z.infer<typeof auditLocationSchema> }>, reply: FastifyReply) => {
      try {
        const result = await InventoryService.auditLocation(request.body);
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}


import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StyleService } from '../services/styleService';
import { z } from 'zod';

const createStyleSchema = z.object({
  styleCode: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

const updateStyleSchema = createStyleSchema.partial();

export async function styleRoutes(fastify: FastifyInstance) {
  // Create style
  fastify.post(
    '/api/styles',
    async (request: FastifyRequest<{ Body: z.infer<typeof createStyleSchema> }>, reply: FastifyReply) => {
      try {
        const style = await StyleService.create(request.body);
        return reply.code(201).send(style);
      } catch (error: any) {
        if (error.code === 'P2002') {
          return reply.code(400).send({ error: 'Style with this code already exists' });
        }
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // List styles
  fastify.get(
    '/api/styles',
    async (request: FastifyRequest<{ Querystring: { skip?: string; take?: string } }>, reply: FastifyReply) => {
      const styles = await StyleService.list({
        skip: request.query.skip ? parseInt(request.query.skip, 10) : undefined,
        take: request.query.take ? parseInt(request.query.take, 10) : undefined,
      });
      return reply.send(styles);
    }
  );

  // Get style by ID
  fastify.get(
    '/api/styles/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const style = await StyleService.getById(request.params.id);
      if (!style) {
        return reply.code(404).send({ error: 'Style not found' });
      }
      return reply.send(style);
    }
  );

  // Get style by code
  fastify.get(
    '/api/styles/code/:code',
    async (request: FastifyRequest<{ Params: { code: string } }>, reply: FastifyReply) => {
      const style = await StyleService.getByCode(request.params.code);
      if (!style) {
        return reply.code(404).send({ error: 'Style not found' });
      }
      return reply.send(style);
    }
  );

  // Update style
  fastify.put(
    '/api/styles/:id',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: z.infer<typeof updateStyleSchema>;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const style = await StyleService.update(request.params.id, request.body);
        return reply.send(style);
      } catch (error: any) {
        if (error.code === 'P2025') {
          return reply.code(404).send({ error: 'Style not found' });
        }
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Delete style
  fastify.delete(
    '/api/styles/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await StyleService.delete(request.params.id);
        return reply.code(204).send();
      } catch (error: any) {
        if (error.code === 'P2025') {
          return reply.code(404).send({ error: 'Style not found' });
        }
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Get variants for style with inventory
  // Action: 4.4 Query Actions - Get Variants for Style
  fastify.get(
    '/api/styles/:id/variants-with-inventory',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const variants = await StyleService.getVariantsWithInventory(request.params.id);
      if (!variants) {
        return reply.code(404).send({ error: 'Style not found' });
      }
      return reply.send(variants);
    }
  );
}


import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/productService';
import { z } from 'zod';

const createProductSchema = z.object({
  upc: z.string(),
  styleId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  name: z.string(),
  price: z.number().nonnegative().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'UNCONFIGURED', 'DISCONTINUED']).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateProductSchema = createProductSchema.partial();

export async function productRoutes(fastify: FastifyInstance) {
  // Create product
  fastify.post(
    '/api/products',
    async (request: FastifyRequest<{ Body: z.infer<typeof createProductSchema> }>, reply: FastifyReply) => {
      try {
        const product = await ProductService.create(request.body);
        return reply.code(201).send(product);
      } catch (error: any) {
        if (error.code === 'P2002') {
          return reply.code(400).send({ error: 'Product with this UPC already exists' });
        }
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // List products with filters
  // Action: 4.1 Product-related actions - Filter & Search Products
  fastify.get(
    '/api/products',
    async (request: FastifyRequest<{ 
      Querystring: { 
        skip?: string; 
        take?: string; 
        styleId?: string;
        departmentId?: string;
        variantId?: string;
        status?: string;
        q?: string;
      } 
    }>, reply: FastifyReply) => {
      const products = await ProductService.list({
        skip: request.query.skip ? parseInt(request.query.skip, 10) : undefined,
        take: request.query.take ? parseInt(request.query.take, 10) : undefined,
        styleId: request.query.styleId,
        departmentId: request.query.departmentId,
        variantId: request.query.variantId,
        status: request.query.status,
        q: request.query.q,
      });
      return reply.send(products);
    }
  );

  // Get product by UPC (MUST come before /:id route!)
  // Action: 3.1 Scan Product by UPC (Existing) or 3.2 Create Stub if not found
  fastify.get(
    '/api/products/upc/:upc',
    async (request: FastifyRequest<{ Params: { upc: string } }>, reply: FastifyReply) => {
      const product = await ProductService.getByUpc(request.params.upc, true);
      if (!product) {
        return reply.code(404).send({ error: 'Product not found' });
      }
      
      // Add needsConfiguration flag for frontend
      const response = {
        ...product,
        needsConfiguration: product.status === 'UNCONFIGURED',
      };
      
      return reply.send(response);
    }
  );

  // Scan endpoint (alternative to /upc/:upc)
  fastify.post(
    '/api/products/scan',
    async (request: FastifyRequest<{ Body: { upc: string } }>, reply: FastifyReply) => {
      const product = await ProductService.getByUpc(request.body.upc, true);
      if (!product) {
        return reply.code(404).send({ error: 'Product not found' });
      }
      
      const response = {
        ...product,
        needsConfiguration: product.status === 'UNCONFIGURED',
      };
      
      return reply.send(response);
    }
  );

  // Get product locations
  // Action: 4.4 Query Actions - Get Product Locations
  fastify.get(
    '/api/products/:id/locations',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const locations = await ProductService.getProductLocations(request.params.id);
      if (!locations) {
        return reply.code(404).send({ error: 'Product not found' });
      }
      return reply.send(locations);
    }
  );

  // Get product by ID (MUST come after specific routes like /upc/:upc)
  fastify.get(
    '/api/products/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const product = await ProductService.getById(request.params.id);
      if (!product) {
        return reply.code(404).send({ error: 'Product not found' });
      }
      return reply.send(product);
    }
  );

  // Update product
  fastify.put(
    '/api/products/:id',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: z.infer<typeof updateProductSchema>;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const product = await ProductService.update(request.params.id, request.body);
        return reply.send(product);
      } catch (error: any) {
        if (error.code === 'P2025') {
          return reply.code(404).send({ error: 'Product not found' });
        }
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Delete product
  fastify.delete(
    '/api/products/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await ProductService.delete(request.params.id);
        return reply.code(204).send();
      } catch (error: any) {
        if (error.code === 'P2025') {
          return reply.code(404).send({ error: 'Product not found' });
        }
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}


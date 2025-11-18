import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { productRoutes } from './routes/products';
import { styleRoutes } from './routes/styles';
import { locationRoutes } from './routes/locations';
import { inventoryRoutes } from './routes/inventory';

const fastify = Fastify({
  logger: true,
});

// Register CORS - Allow all origins for beta (restrict in production)
fastify.register(cors, {
  origin: true, // Allow all origins for beta testing
  credentials: true,
});

// Register routes
fastify.register(productRoutes);
fastify.register(styleRoutes);
fastify.register(locationRoutes);
fastify.register(inventoryRoutes);

// Health check
fastify.get('/', async (request, reply) => {
  return {
    message: 'Inventory Manager API',
    version: '1.0.0',
    status: 'running',
  };
});

fastify.get('/health', async (request, reply) => {
  return { status: 'healthy' };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();


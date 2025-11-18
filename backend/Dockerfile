# Use Node.js 20 LTS
FROM node:20-alpine

# Install Prisma CLI globally (needed for migrations)
RUN npm install -g prisma

# Set working directory
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including dev dependencies for build)
# Use npm install instead of npm ci to handle cases without lock file
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]


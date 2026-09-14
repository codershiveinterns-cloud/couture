const { PrismaClient } = require('@prisma/client');

// Reuse a single PrismaClient instance across the process (and across
// nodemon hot-reloads in dev) to avoid exhausting the DB connection pool.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;

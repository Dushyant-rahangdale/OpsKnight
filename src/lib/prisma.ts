import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Configuration for Scale
 *
 * Connection pool settings for handling 100-500+ concurrent users:
 * - connection_limit: Max connections per instance (default 10 is too low)
 * - pool_timeout: How long to wait for a connection
 * - statement_cache_size: Prepared statement cache
 *
 * Configure via DATABASE_URL query params or environment variables:
 * DATABASE_URL="postgresql://...?connection_limit=40&pool_timeout=30"
 */

const prismaClientSingleton = () => {
  // Log configuration for debugging
  const poolSize = process.env.DATABASE_POOL_SIZE || '40';
  const logLevel = process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn'];

  return new PrismaClient({
    log: logLevel as any,
    // Datasource configuration can be overridden via env
    datasourceUrl: process.env.DATABASE_URL,
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Connection pool health check
export async function checkDatabaseHealth(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (error) {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

// Graceful shutdown helper
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;

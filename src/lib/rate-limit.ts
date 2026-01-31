import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Check rate limit using PostgreSQL for distributed coordination
 * Uses a tiered approach:
 * 1. Checks atomic counter in DB
 * 2. Auto-expires records via cleanup (simplified for this implementation)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number; count: number }> {
  try {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs);
    const dbKey = `${key}:${windowStart}`; // Unique key per window
    const expiresAt = new Date(now + windowMs);

    // Atomic increment using upsert
    // If record exists, increment count. If not, create with count 1.
    const result = await prisma.rateLimit.upsert({
      where: { key: dbKey },
      create: {
        key: dbKey,
        count: 1,
        expiresAt,
      },
      update: {
        count: { increment: 1 },
      },
    });

    const resetAt = (windowStart + 1) * windowMs;
    const count = result.count;
    const remaining = Math.max(0, limit - count);

    // Probability-based cleanup (1% chance to clean old records)
    if (Math.random() < 0.01) {
      cleanupExpiredRateLimits().catch(err => {
        logger.error('Failed to cleanup rate limits', { error: err });
      });
    }

    return {
      allowed: count <= limit,
      remaining,
      resetAt,
      count,
    };
  } catch (error) {
    // Fail OPEN if DB is down to avoid outage
    logger.error('Rate limit DB check failed, allowing request', { error });
    return {
      allowed: true,
      remaining: 1,
      resetAt: Date.now() + windowMs,
      count: 0,
    };
  }
}

async function cleanupExpiredRateLimits() {
  await prisma.rateLimit.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
}

// Stub for interface compatibility if needed, though we moved to async
export function getRateLimitStoreSize(): number {
  return 0; // Stateless
}

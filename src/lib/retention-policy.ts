import 'server-only';
import { logger } from './logger';

/**
 * Data Retention Policy Service
 *
 * Provides centralized access to data retention settings with caching.
 * All date calculations use these settings - NO hardcoded limits.
 *
 * Settings:
 * - incidentRetentionDays: How long to keep incident data (default: 730 = 2 years)
 * - alertRetentionDays: How long to keep alert data (default: 365 = 1 year)
 * - logRetentionDays: How long to keep log entries (default: 90 days)
 * - metricsRetentionDays: How long to keep metric rollups (default: 365 = 1 year)
 * - realTimeWindowDays: Use real-time queries for this period, rollups for older (default: 90 days)
 */

export interface RetentionPolicy {
  incidentRetentionDays: number;
  alertRetentionDays: number;
  logRetentionDays: number;
  metricsRetentionDays: number;
  realTimeWindowDays: number;
}

// Default retention policy (used if settings not found)
const DEFAULT_POLICY: RetentionPolicy = {
  incidentRetentionDays: 730, // 2 years
  alertRetentionDays: 365, // 1 year
  logRetentionDays: 90, // 90 days
  metricsRetentionDays: 365, // 1 year
  realTimeWindowDays: 90, // 90 days for real-time, older uses rollups
};

// Cache for retention policy
let cachedPolicy: RetentionPolicy | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches retention policy from database with caching
 */
export async function getRetentionPolicy(): Promise<RetentionPolicy> {
  const now = Date.now();

  // Return cached policy if still valid
  if (cachedPolicy && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedPolicy;
  }

  try {
    const { default: prisma } = await import('./prisma');

    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' },
      select: {
        incidentRetentionDays: true,
        alertRetentionDays: true,
        logRetentionDays: true,
        metricsRetentionDays: true,
        realTimeWindowDays: true,
      },
    });

    if (settings) {
      cachedPolicy = {
        incidentRetentionDays:
          settings.incidentRetentionDays ?? DEFAULT_POLICY.incidentRetentionDays,
        alertRetentionDays: settings.alertRetentionDays ?? DEFAULT_POLICY.alertRetentionDays,
        logRetentionDays: settings.logRetentionDays ?? DEFAULT_POLICY.logRetentionDays,
        metricsRetentionDays: settings.metricsRetentionDays ?? DEFAULT_POLICY.metricsRetentionDays,
        realTimeWindowDays: settings.realTimeWindowDays ?? DEFAULT_POLICY.realTimeWindowDays,
      };
    } else {
      // Create default settings if not exists
      await prisma.systemSettings.upsert({
        where: { id: 'default' },
        create: {
          id: 'default',
          incidentRetentionDays: DEFAULT_POLICY.incidentRetentionDays,
          alertRetentionDays: DEFAULT_POLICY.alertRetentionDays,
          logRetentionDays: DEFAULT_POLICY.logRetentionDays,
          metricsRetentionDays: DEFAULT_POLICY.metricsRetentionDays,
          realTimeWindowDays: DEFAULT_POLICY.realTimeWindowDays,
        },
        update: {},
      });
      cachedPolicy = { ...DEFAULT_POLICY };
    }

    cacheTimestamp = now;
    return cachedPolicy;
  } catch (error) {
    logger.error('[RetentionPolicy] Failed to fetch settings, using defaults', { error });
    return DEFAULT_POLICY;
  }
}

/**
 * Clears the cached policy (call after settings update)
 */
export function clearRetentionPolicyCache(): void {
  cachedPolicy = null;
  cacheTimestamp = 0;
}

/**
 * Updates retention policy settings
 */
export async function updateRetentionPolicy(
  policy: Partial<RetentionPolicy>
): Promise<RetentionPolicy> {
  const { default: prisma } = await import('./prisma');

  // Validate values
  const validated: Partial<RetentionPolicy> = {};

  if (policy.incidentRetentionDays !== undefined) {
    validated.incidentRetentionDays = Math.max(30, Math.min(3650, policy.incidentRetentionDays)); // 30 days to 10 years
  }
  if (policy.alertRetentionDays !== undefined) {
    validated.alertRetentionDays = Math.max(7, Math.min(3650, policy.alertRetentionDays)); // 7 days to 10 years
  }
  if (policy.logRetentionDays !== undefined) {
    validated.logRetentionDays = Math.max(1, Math.min(365, policy.logRetentionDays)); // 1 day to 1 year
  }
  if (policy.metricsRetentionDays !== undefined) {
    validated.metricsRetentionDays = Math.max(30, Math.min(3650, policy.metricsRetentionDays)); // 30 days to 10 years
  }
  if (policy.realTimeWindowDays !== undefined) {
    validated.realTimeWindowDays = Math.max(7, Math.min(365, policy.realTimeWindowDays)); // 7 days to 1 year
  }

  const updated = await prisma.systemSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      ...DEFAULT_POLICY,
      ...validated,
    },
    update: validated,
    select: {
      incidentRetentionDays: true,
      alertRetentionDays: true,
      logRetentionDays: true,
      metricsRetentionDays: true,
      realTimeWindowDays: true,
    },
  });

  // Clear cache
  clearRetentionPolicyCache();

  logger.info('[RetentionPolicy] Updated', { policy: validated });

  return {
    incidentRetentionDays: updated.incidentRetentionDays ?? DEFAULT_POLICY.incidentRetentionDays,
    alertRetentionDays: updated.alertRetentionDays ?? DEFAULT_POLICY.alertRetentionDays,
    logRetentionDays: updated.logRetentionDays ?? DEFAULT_POLICY.logRetentionDays,
    metricsRetentionDays: updated.metricsRetentionDays ?? DEFAULT_POLICY.metricsRetentionDays,
    realTimeWindowDays: updated.realTimeWindowDays ?? DEFAULT_POLICY.realTimeWindowDays,
  };
}

/**
 * Helper: Get the earliest date for incident data based on retention policy
 */
export async function getIncidentRetentionStartDate(): Promise<Date> {
  const policy = await getRetentionPolicy();
  const date = new Date();
  date.setDate(date.getDate() - policy.incidentRetentionDays);
  return date;
}

/**
 * Helper: Get the date boundary between real-time and rollup data
 */
export async function getRealTimeWindowStart(): Promise<Date> {
  const policy = await getRetentionPolicy();
  const date = new Date();
  date.setDate(date.getDate() - policy.realTimeWindowDays);
  return date;
}

/**
 * Helper: Determines if a date range should use rollups
 * Returns true if the start date is before the real-time window
 */
export async function shouldUseRollups(startDate: Date): Promise<boolean> {
  const realTimeStart = await getRealTimeWindowStart();
  return startDate < realTimeStart;
}

/**
 * Helper: Get date bounds for a query respecting retention policy
 */
export async function getQueryDateBounds(
  requestedStart: Date | undefined,
  requestedEnd: Date | undefined,
  dataType: 'incident' | 'alert' | 'log' | 'metrics' = 'incident'
): Promise<{ start: Date; end: Date; isClipped: boolean }> {
  const policy = await getRetentionPolicy();
  const now = new Date();

  // Get retention days based on data type
  let retentionDays: number;
  switch (dataType) {
    case 'alert':
      retentionDays = policy.alertRetentionDays;
      break;
    case 'log':
      retentionDays = policy.logRetentionDays;
      break;
    case 'metrics':
      retentionDays = policy.metricsRetentionDays;
      break;
    case 'incident':
    default:
      retentionDays = policy.incidentRetentionDays;
  }

  // Calculate retention boundary
  const retentionBoundary = new Date(now);
  retentionBoundary.setDate(retentionBoundary.getDate() - retentionDays);

  // End date defaults to now
  const end = requestedEnd && requestedEnd <= now ? requestedEnd : now;

  // Start date defaults to retention boundary, but can't go before it
  let start: Date;
  let isClipped = false;

  if (requestedStart) {
    if (requestedStart < retentionBoundary) {
      start = retentionBoundary;
      isClipped = true;
    } else {
      start = requestedStart;
    }
  } else {
    start = retentionBoundary;
  }

  // Ensure start is not after end
  if (start > end) {
    start = end;
  }

  return { start, end, isClipped };
}

/**
 * Get pagination info based on date range and expected volume
 * Helps UI decide page size and total pages
 */
export interface PaginationInfo {
  suggestedPageSize: number;
  useStreamingAPI: boolean;
  useRollupData: boolean;
}

export async function getPaginationRecommendation(
  startDate: Date,
  endDate: Date,
  estimatedIncidentsPerDay: number = 10
): Promise<PaginationInfo> {
  const policy = await getRetentionPolicy();
  const realTimeStart = await getRealTimeWindowStart();

  const daySpan = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const estimatedTotal = daySpan * estimatedIncidentsPerDay;

  const useRollupData = startDate < realTimeStart;

  // For large datasets, suggest smaller pages and streaming
  let suggestedPageSize: number;
  let useStreamingAPI: boolean;

  if (estimatedTotal > 10000) {
    suggestedPageSize = 100;
    useStreamingAPI = true;
  } else if (estimatedTotal > 1000) {
    suggestedPageSize = 250;
    useStreamingAPI = true;
  } else if (estimatedTotal > 100) {
    suggestedPageSize = 50;
    useStreamingAPI = false;
  } else {
    suggestedPageSize = estimatedTotal;
    useStreamingAPI = false;
  }

  return {
    suggestedPageSize,
    useStreamingAPI,
    useRollupData,
  };
}

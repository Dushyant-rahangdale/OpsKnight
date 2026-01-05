import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shouldUseRollups, getRealTimeWindowStart, getQueryDateBounds, getPaginationRecommendation } from '@/lib/retention-policy';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
    default: {
        systemSettings: {
            findUnique: vi.fn().mockResolvedValue({
                incidentRetentionDays: 730,
                alertRetentionDays: 365,
                logRetentionDays: 90,
                metricsRetentionDays: 365,
                realTimeWindowDays: 90,
            }),
            upsert: vi.fn(),
        },
    },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('retention-policy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('shouldUseRollups', () => {
        it('returns true for dates older than real-time window', async () => {
            // 100 days ago (beyond default 90 day real-time window)
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 100);

            const result = await shouldUseRollups(oldDate);
            expect(result).toBe(true);
        });

        it('returns false for recent dates within real-time window', async () => {
            // 30 days ago (within default 90 day window)
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 30);

            const result = await shouldUseRollups(recentDate);
            expect(result).toBe(false);
        });

        it('returns false for current date', async () => {
            const now = new Date();
            const result = await shouldUseRollups(now);
            expect(result).toBe(false);
        });
    });

    describe('getRealTimeWindowStart', () => {
        it('returns date based on retention policy', async () => {
            const result = await getRealTimeWindowStart();
            const now = new Date();
            const expectedStart = new Date(now);
            expectedStart.setDate(expectedStart.getDate() - 90);

            // Within 1 day tolerance
            const diff = Math.abs(result.getTime() - expectedStart.getTime());
            expect(diff).toBeLessThan(24 * 60 * 60 * 1000);
        });
    });

    describe('getQueryDateBounds', () => {
        it('clips start date to retention boundary', async () => {
            // Request 3 years ago (beyond 2 year retention)
            const oldStart = new Date();
            oldStart.setFullYear(oldStart.getFullYear() - 3);

            const result = await getQueryDateBounds(oldStart, undefined, 'incident');

            expect(result.isClipped).toBe(true);
            expect(result.start.getTime()).toBeGreaterThan(oldStart.getTime());
        });

        it('does not clip recent dates', async () => {
            const recentStart = new Date();
            recentStart.setDate(recentStart.getDate() - 30);

            const result = await getQueryDateBounds(recentStart, undefined, 'incident');

            expect(result.isClipped).toBe(false);
            expect(result.start.getTime()).toBe(recentStart.getTime());
        });

        it('defaults end date to now', async () => {
            const start = new Date();
            start.setDate(start.getDate() - 7);

            const before = Date.now();
            const result = await getQueryDateBounds(start, undefined);
            const after = Date.now();

            expect(result.end.getTime()).toBeGreaterThanOrEqual(before);
            expect(result.end.getTime()).toBeLessThanOrEqual(after);
        });
    });

    describe('getPaginationRecommendation', () => {
        it('recommends streaming for large date ranges', async () => {
            const start = new Date();
            start.setDate(start.getDate() - 365);
            const end = new Date();

            const result = await getPaginationRecommendation(start, end, 50); // 50 incidents/day

            expect(result.useStreamingAPI).toBe(true);
            expect(result.suggestedPageSize).toBeLessThanOrEqual(250);
        });

        it('does not recommend streaming for small datasets', async () => {
            const start = new Date();
            start.setDate(start.getDate() - 7);
            const end = new Date();

            const result = await getPaginationRecommendation(start, end, 5); // 5 incidents/day = 35 total

            expect(result.useStreamingAPI).toBe(false);
        });

        it('recommends rollups for old date ranges', async () => {
            const start = new Date();
            start.setDate(start.getDate() - 180); // Beyond 90 day real-time window
            const end = new Date();

            const result = await getPaginationRecommendation(start, end);

            expect(result.useRollupData).toBe(true);
        });
    });
});

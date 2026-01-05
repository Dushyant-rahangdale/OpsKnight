#!/usr/bin/env ts-node
/**
 * SLA Rollup Generation Scheduled Job
 *
 * Generates daily metric rollups for fast historical queries.
 *
 * Schedule: Run daily at 1 AM via cron or task scheduler
 * Example cron: 0 1 * * * npx ts-node scripts/generate-rollups.ts
 *
 * Options:
 *   --backfill <days>  Backfill rollups for the specified number of days
 *   --date <YYYY-MM-DD> Generate rollup for a specific date
 *
 * Exit codes:
 *   0 - Success
 *   1 - Error during execution
 */

import { generateAllDailyRollups, backfillRollups } from '../src/lib/metric-rollup';

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const startTime = Date.now();

    console.log('[Rollup Generator] Starting...');

    try {
        // Check for backfill flag
        const backfillIndex = args.indexOf('--backfill');
        if (backfillIndex !== -1) {
            const days = parseInt(args[backfillIndex + 1] || '30', 10);
            console.log(`[Rollup Generator] Backfilling ${days} days of rollups...`);

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);

            await backfillRollups(startDate, endDate);

            const duration = Date.now() - startTime;
            console.log(`[Rollup Generator] Backfill complete (${duration}ms)`);
            process.exit(0);
        }

        // Check for specific date flag
        const dateIndex = args.indexOf('--date');
        if (dateIndex !== -1) {
            const dateStr = args[dateIndex + 1];
            if (!dateStr) {
                console.error('[Rollup Generator] Error: --date requires a date argument (YYYY-MM-DD)');
                process.exit(1);
            }

            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                console.error('[Rollup Generator] Error: Invalid date format. Use YYYY-MM-DD');
                process.exit(1);
            }

            console.log(`[Rollup Generator] Generating rollup for ${dateStr}...`);
            await generateAllDailyRollups(date);

            const duration = Date.now() - startTime;
            console.log(`[Rollup Generator] Complete (${duration}ms)`);
            process.exit(0);
        }

        // Default: Generate rollup for yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        console.log(`[Rollup Generator] Generating rollup for ${yesterday.toISOString().split('T')[0]}...`);
        await generateAllDailyRollups(yesterday);

        const duration = Date.now() - startTime;
        console.log(`[Rollup Generator] Complete (${duration}ms)`);
        process.exit(0);
    } catch (error) {
        console.error('[Rollup Generator] Error during execution:', error);
        process.exit(1);
    }
}

main();

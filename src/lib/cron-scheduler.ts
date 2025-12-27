import * as cron from 'node-cron';
import { processPendingEscalations } from './escalation';
import { processPendingJobs } from './jobs/queue';
import { logger } from './logger';

let cronJob: cron.ScheduledTask | null = null;
let lastRunAt: Date | null = null;
let lastSuccessAt: Date | null = null;
let lastError: string | null = null;

/**
 * Start the internal cron scheduler
 * Runs escalation and job processing every 2 minutes
 */
export function startCronScheduler() {
    // Don't start if already running
    if (cronJob) {
        logger.info('Cron scheduler already running');
        return;
    }

    // Only run in production or if explicitly enabled
    const enableInternalCron = process.env.ENABLE_INTERNAL_CRON === 'true' || process.env.NODE_ENV === 'production';

    if (!enableInternalCron) {
        logger.info('Internal cron scheduler disabled (set ENABLE_INTERNAL_CRON=true to enable)');
        return;
    }

    // Schedule: Every 2 minutes
    cronJob = cron.schedule('*/2 * * * *', async () => {
        const startTime = Date.now();
        lastRunAt = new Date();
        logger.info('Cron job started', { timestamp: new Date().toISOString() });

        try {
            // Process escalations
            const escalationResult = await processPendingEscalations();
            logger.info('Escalations processed', {
                processed: escalationResult.processed,
                total: escalationResult.total,
                errors: escalationResult.errors
            });

            // Process background jobs
            const jobResult = await processPendingJobs(50);
            logger.info('Background jobs processed', {
                processed: jobResult.processed,
                failed: jobResult.failed,
                total: jobResult.total
            });

            const duration = Date.now() - startTime;
            lastSuccessAt = new Date();
            lastError = null;
            logger.info('Cron job completed', { durationMs: duration });
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
            logger.error('Cron job failed', {
                error: lastError,
                stack: error instanceof Error ? error.stack : undefined
            });
        }
    });

    logger.info('Internal cron scheduler started (runs every 2 minutes)');
}

/**
 * Stop the internal cron scheduler
 */
export function stopCronScheduler() {
    if (cronJob) {
        cronJob.stop();
        cronJob = null;
        lastError = null;
        logger.info('Internal cron scheduler stopped');
    }
}

export function getCronSchedulerStatus() {
    return {
        running: !!cronJob,
        lastRunAt,
        lastSuccessAt,
        lastError,
        schedule: '*/2 * * * *'
    };
}

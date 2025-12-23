import { NextRequest, NextResponse } from 'next/server';
import { claimPendingJobs, processJob } from '@/lib/jobs/queue';
import { processAutoUnsnooze } from '@/app/(app)/incidents/snooze-actions';

/**
 * Cron endpoint for processing auto-unsnooze
 * 
 * This processes:
 * 1. AUTO_UNSNOOZE jobs from BackgroundJob table (PostgreSQL-based queue)
 * 2. Legacy method: Direct query of incidents with expired snoozedUntil
 * 
 * The main cron endpoint (/api/cron/process-escalations) also processes these,
 * but this is a dedicated endpoint if you want to run unsnooze jobs more frequently.
 */
export async function GET(req: NextRequest) {
    try {
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret) {
            return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
        }

        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Process AUTO_UNSNOOZE jobs from job queue
        const unsnoozeJobs = await claimPendingJobs(100, 'AUTO_UNSNOOZE');
        
        let processedJobs = 0;
        let failedJobs = 0;

        for (const job of unsnoozeJobs) {
            const success = await processJob(job);
            if (success) {
                processedJobs++;
            } else {
                failedJobs++;
            }
        }

        // Also process legacy method (direct query) for backward compatibility
        const legacyResult = await processAutoUnsnooze();

        return NextResponse.json({
            success: true,
            jobs: {
                processed: processedJobs,
                failed: failedJobs,
                total: unsnoozeJobs.length,
            },
            legacy: {
                processed: legacyResult.processed,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error processing auto-unsnooze:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    return GET(req);
}

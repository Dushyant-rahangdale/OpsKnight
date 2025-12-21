import { NextRequest, NextResponse } from 'next/server';
import { processPendingEscalations } from '@/lib/escalation';

/**
 * Cron endpoint to process pending escalations
 * 
 * This endpoint should be called periodically (e.g., every 1-5 minutes) by:
 * - Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
 * - External cron service (cron-job.org, EasyCron, etc.)
 * - Server cron (crontab on Linux)
 * 
 * Security: In production, protect this endpoint with:
 * - Authentication header (e.g., Authorization: Bearer <secret>)
 * - IP whitelist
 * - Vercel Cron secret validation
 */
export async function GET(req: NextRequest) {
    try {
        // Optional: Validate cron secret (for Vercel Cron)
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Process pending escalations
        const result = await processPendingEscalations();

        return NextResponse.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        }, { status: 200 });
    } catch (error) {
        console.error('Error processing escalations:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Also support POST for external cron services that don't support GET
export async function POST(req: NextRequest) {
    return GET(req);
}


import { NextRequest } from 'next/server';
import { getCronSchedulerStatus } from '@/lib/cron-scheduler';
import { jsonError, jsonOk } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return jsonError('CRON_SECRET is not configured', 500);
    }

    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
        return jsonError('Unauthorized', 401);
    }

    const status = getCronSchedulerStatus();
    return jsonOk({
        success: true,
        status: {
            running: status.running,
            lastRunAt: status.lastRunAt ? status.lastRunAt.toISOString() : null,
            lastSuccessAt: status.lastSuccessAt ? status.lastSuccessAt.toISOString() : null,
            lastError: status.lastError,
            schedule: status.schedule
        },
        timestamp: new Date().toISOString()
    }, 200);
}

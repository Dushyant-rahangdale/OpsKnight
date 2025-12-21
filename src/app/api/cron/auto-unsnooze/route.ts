import { NextRequest, NextResponse } from 'next/server';
import { processAutoUnsnooze } from '@/app/(app)/incidents/snooze-actions';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const cronSecret = searchParams.get('cron_secret');

    if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await processAutoUnsnooze();
        return NextResponse.json({ message: 'Auto-unsnooze processed successfully', ...result });
    } catch (error) {
        console.error('Error processing auto-unsnooze:', error);
        return NextResponse.json(
            { message: 'Error processing auto-unsnooze', error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    return GET(req);
}

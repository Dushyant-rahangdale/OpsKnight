import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { handleSlashCommand } from '@/lib/chatops/slash-commands';

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

function verifySlackSignature(body: string, signature: string, timestamp: string): boolean {
    if (!SLACK_SIGNING_SECRET) {
        logger.warn('[Slack] No signing secret configured, skipping verification');
        return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp, 10);
    if (Math.abs(currentTime - requestTime) > 300) {
        return false;
    }

    const sigBaseString = `v0:${timestamp}:${body}`;
    const computedSignature = 'v0=' + crypto
        .createHmac('sha256', SLACK_SIGNING_SECRET)
        .update(sigBaseString)
        .digest('hex');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(computedSignature),
            Buffer.from(signature)
        );
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-slack-signature') || '';
        const timestamp = request.headers.get('x-slack-request-timestamp') || '';

        if (!verifySlackSignature(body, signature, timestamp)) {
            logger.warn('[Slack] Invalid signature for slash command', { signature, timestamp });
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const params = new URLSearchParams(body);
        
        const payload = {
            command: params.get('command') || '',
            text: params.get('text') || '',
            channel_id: params.get('channel_id') || '',
            channel_name: params.get('channel_name') || '',
            user_id: params.get('user_id') || '',
            user_name: params.get('user_name') || '',
            team_id: params.get('team_id') || '',
            response_url: params.get('response_url') || '',
        };

        const result = await handleSlashCommand(payload);
        return NextResponse.json(result);

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        logger.error('[Slack] Commands API error', {
            error: error.message,
            stack: error.stack
        });
        
        return NextResponse.json({
            response_type: 'ephemeral',
            text: 'An error occurred while processing your command.'
        });
    }
}

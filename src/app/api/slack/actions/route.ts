/**
 * Slack Interactive Actions API
 * Handles Slack button clicks for ack/resolve actions
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

/**
 * Verify Slack request signature
 */
function verifySlackSignature(
    body: string,
    signature: string,
    timestamp: string
): boolean {
    if (!SLACK_SIGNING_SECRET) {
        logger.warn('[Slack] No signing secret configured, skipping verification');
        return true; // Allow in development if no secret configured
    }

    // Check timestamp (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp, 10);
    if (Math.abs(currentTime - requestTime) > 300) {
        // Request is older than 5 minutes
        return false;
    }

    // Create signature
    const sigBaseString = `v0:${timestamp}:${body}`;
    const computedSignature = 'v0=' + crypto
        .createHmac('sha256', SLACK_SIGNING_SECRET)
        .update(sigBaseString)
        .digest('hex');

    // Timing-safe comparison
    return crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(signature)
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-slack-signature') || '';
        const timestamp = request.headers.get('x-slack-request-timestamp') || '';

        // Verify signature
        if (!verifySlackSignature(body, signature, timestamp)) {
            logger.warn('[Slack] Invalid signature', { signature, timestamp });
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        let payload: any; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (body.startsWith('payload=')) {
            const params = new URLSearchParams(body);
            payload = JSON.parse(params.get('payload') || '{}');
        } else {
            try {
                payload = JSON.parse(body);
            } catch {
                const params = new URLSearchParams(body);
                payload = JSON.parse(params.get('payload') || '{}');
            }
        }

        // Handle URL verification (for Slack app setup)
        if (payload.type === 'url_verification') {
            return NextResponse.json({ challenge: payload.challenge });
        }

        // Handle interactive button clicks
        if (payload.type === 'block_actions') {
            const action = payload.actions?.[0];
            if (!action) {
                return NextResponse.json({ error: 'No action found' }, { status: 400 });
            }

            const actionValue = JSON.parse(action.value || '{}');
            const { action: actionType, incidentId } = actionValue;
            const slackUserId = payload.user?.id;
            const slackUserName = payload.user?.name || payload.user?.username;

            if (!incidentId || !actionType) {
                return NextResponse.json(
                    { error: 'Invalid action data' },
                    { status: 400 }
                );
            }

            // Get incident
            const incident = await prisma.incident.findUnique({
                where: { id: incidentId }
            });

            if (!incident) {
                return NextResponse.json(
                    { error: 'Incident not found' },
                    { status: 404 }
                );
            }

            let responseMessage = '';

            if (actionType === 'ack') {
                if (incident.status === 'OPEN') {
                    try {
                        const { updateIncidentStatus } = await import('@/app/(app)/incidents/actions');
                        await updateIncidentStatus(incidentId, 'ACKNOWLEDGED');
                    } catch {
                        await prisma.incident.update({
                            where: { id: incidentId },
                            data: { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() }
                        });
                    }
                    responseMessage = `👀 Incident acknowledged by <@${slackUserId || 'responder'}>`;
                } else {
                    return NextResponse.json({
                        text: `ℹ️ Incident is already ${incident.status.toLowerCase()}`
                    });
                }
            } else if (actionType === 'resolve') {
                if (incident.status !== 'RESOLVED') {
                    try {
                        const { updateIncidentStatus } = await import('@/app/(app)/incidents/actions');
                        await updateIncidentStatus(incidentId, 'RESOLVED');
                    } catch {
                        await prisma.incident.update({
                            where: { id: incidentId },
                            data: { status: 'RESOLVED', resolvedAt: new Date() }
                        });
                    }
                    responseMessage = `✅ Incident resolved by <@${slackUserId || 'responder'}>`;
                } else {
                    return NextResponse.json({
                        text: 'ℹ️ Incident is already resolved'
                    });
                }
            } else if (actionType === 'assign_me') {
                if (slackUserId) {
                    try {
                        const { getSlackBotToken } = await import('@/lib/slack');
                        const { inviteUserToWarRoom } = await import('@/lib/chatops/war-room');
                        const botToken = await getSlackBotToken(incident.serviceId);
                        
                        // Resolve OpsKnight user
                        const userByEmail = await prisma.user.findFirst({
                            where: { name: { contains: slackUserName, mode: 'insensitive' } },
                            select: { id: true, name: true }
                        });

                        if (userByEmail) {
                            await prisma.incident.update({
                                where: { id: incidentId },
                                data: { assigneeId: userByEmail.id }
                            });
                            responseMessage = `🙋 Incident assigned to *${userByEmail.name}* (<@${slackUserId}>)`;
                        } else {
                            responseMessage = `🙋 Reassigned incident to <@${slackUserId}>`;
                        }
                    } catch (err) {
                        logger.warn('[Slack] Reassign failed via button', { error: err });
                        responseMessage = `🙋 Incident assigned to <@${slackUserId}>`;
                    }
                }
            } else {
                return NextResponse.json(
                    { error: 'Unknown action' },
                    { status: 400 }
                );
            }

            // Create incident event
            await prisma.incidentEvent.create({
                data: {
                    incidentId,
                    message: `${responseMessage} (1-Click Slack Button)`
                }
            }).catch(() => {});

            // Send confirmation back to Slack
            return NextResponse.json({
                text: responseMessage,
                response_type: 'in_channel',
                replace_original: false
            });
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        logger.error('[Slack] Actions API error', {
            error: error.message,
            stack: error.stack
        });
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}




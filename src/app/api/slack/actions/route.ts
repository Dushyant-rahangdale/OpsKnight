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
function verifySlackSignature(body: string, signature: string, timestamp: string): boolean {
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
  const computedSignature =
    'v0=' + crypto.createHmac('sha256', SLACK_SIGNING_SECRET).update(sigBaseString).digest('hex');

  // Timing-safe comparison — throws on length mismatch, so a malformed
  // signature must be treated as invalid rather than crashing the handler
  try {
    return crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Resolve the Slack user who pressed a button to an OpsKnight account and a
 * human-readable name.
 *
 * Slack renders `<@U0673U4TWAJ>` as a display name, but the incident timeline
 * stores raw text — so a mention written for Slack surfaces as the literal user
 * ID in the web UI. Callers need both forms, so this returns the name to use in
 * timeline entries while the Slack copy keeps the mention.
 */
async function resolveSlackActor(
  botToken: string | null,
  slackUserId?: string,
  slackUserName?: string
): Promise<{ opsUser: { id: string; name: string } | null; displayName: string }> {
  let slackRealName: string | undefined;
  let slackEmail: string | undefined;

  if (botToken && slackUserId) {
    try {
      const userRes = await fetch(
        `https://slack.com/api/users.info?user=${encodeURIComponent(slackUserId)}`,
        { method: 'GET', headers: { Authorization: `Bearer ${botToken}` } }
      );
      const userData = await userRes.json();
      if (userData.ok && userData.user) {
        slackEmail = userData.user.profile?.email?.trim();
        slackRealName = (
          userData.user.profile?.real_name ||
          userData.user.real_name ||
          userData.user.name
        )?.trim();
      }
    } catch (e) {
      logger.warn('[Slack] Failed to fetch Slack user info', { error: e, slackUserId });
    }
  }

  let opsUser: { id: string; name: string } | null = null;

  if (slackEmail) {
    opsUser = await prisma.user.findFirst({
      where: { email: { equals: slackEmail, mode: 'insensitive' } },
      select: { id: true, name: true },
    });
  }

  for (const candidate of [slackRealName, slackUserName]) {
    if (opsUser || !candidate) continue;
    opsUser = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: candidate, mode: 'insensitive' } },
          { name: { contains: candidate, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true },
    });
  }

  // Never falls back to an arbitrary account — an unresolved actor is named
  // from Slack only, and callers decide whether that is good enough.
  const displayName =
    opsUser?.name || slackRealName || slackUserName || slackUserId || 'an unknown user';

  return { opsUser, displayName };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-slack-signature') || '';
    const timestamp = request.headers.get('x-slack-request-timestamp') || '';

    // Verify signature
    if (!verifySlackSignature(body, signature, timestamp)) {
      logger.warn('[Slack] Invalid signature', { signature, timestamp });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
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
        return NextResponse.json({ error: 'Invalid action data' }, { status: 400 });
      }

      // Get incident
      const incident = await prisma.incident.findUnique({
        where: { id: incidentId },
      });

      if (!incident) {
        return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
      }

      const { getSlackBotToken } = await import('@/lib/slack');
      const botToken = await getSlackBotToken(incident.serviceId);
      const { opsUser: actorUser, displayName: actorName } = await resolveSlackActor(
        botToken,
        slackUserId,
        slackUserName
      );

      // Two variants of every message: `responseMessage` goes to Slack and
      // keeps the <@ID> mention; `timelineMessage` is plain text for the
      // incident timeline, which has no way to render a Slack mention.
      let responseMessage = '';
      let timelineMessage = '';

      if (actionType === 'ack') {
        if (incident.status === 'OPEN') {
          await prisma.incident.update({
            where: { id: incidentId },
            data: {
              status: 'ACKNOWLEDGED',
              acknowledgedAt: incident.acknowledgedAt ?? new Date(),
              // Acknowledging must stop the escalation chain, exactly as
              // `/incident ack` does — otherwise the button changes the
              // status label while OpsKnight keeps paging the next step.
              escalationStatus: 'COMPLETED',
              nextEscalationAt: null,
            },
          });
          responseMessage = `👀 Incident acknowledged by <@${slackUserId || 'responder'}>`;
          timelineMessage = `Acknowledged via Slack button by ${actorName}`;
        } else {
          return NextResponse.json({
            text: `ℹ️ Incident is already ${incident.status.toLowerCase()}`,
          });
        }
      } else if (actionType === 'resolve') {
        if (incident.status !== 'RESOLVED') {
          await prisma.incident.update({
            where: { id: incidentId },
            data: {
              status: 'RESOLVED',
              resolvedAt: incident.resolvedAt ?? new Date(),
              acknowledgedAt: incident.acknowledgedAt ?? new Date(),
              escalationStatus: 'COMPLETED',
              nextEscalationAt: null,
            },
          });
          responseMessage = `✅ Incident resolved by <@${slackUserId || 'responder'}>`;
          timelineMessage = `Resolved via Slack button by ${actorName}`;

          // Auto-generate Postmortem draft & archive war-room channel
          const { archiveWarRoomChannel } = await import('@/lib/chatops/war-room');
          archiveWarRoomChannel(incidentId).catch(err => {
            logger.error('[Slack Actions] War-room channel archive failed', {
              error: err,
              incidentId,
            });
          });
        } else {
          return NextResponse.json({
            text: 'ℹ️ Incident is already resolved',
          });
        }
      } else if (actionType === 'assign_me') {
        if (slackUserId) {
          try {
            const { updateWarRoomTopic, slackApiCall } = await import('@/lib/chatops/war-room');

            // Direct invite Slack user into channel via slackUserId
            if (botToken && incident.slackChannelId) {
              await slackApiCall('conversations.invite', botToken, {
                channel: incident.slackChannelId,
                users: slackUserId,
              }).catch(() => {});
            }

            // Already resolved once above, by email then real name then
            // username — the same lookup every action type needs.
            const targetUser = actorUser;

            // No "first active user" fallback: assigning the incident to an
            // arbitrary person is worse than not assigning it. Fail loudly
            // and tell the clicker how to make resolution work.
            if (!targetUser) {
              logger.warn(
                '[Slack] assign_me could not resolve Slack user to an OpsKnight account',
                {
                  slackUserId,
                  slackUserName,
                  incidentId,
                }
              );
              return NextResponse.json({
                response_type: 'ephemeral',
                text: '⚠️ Could not match your Slack account to an OpsKnight user, so the incident was left unchanged. Make sure your Slack email matches your OpsKnight account email, then try again.',
              });
            }

            await prisma.incident.update({
              where: { id: incidentId },
              data: { assigneeId: targetUser.id },
            });
            updateWarRoomTopic(incidentId).catch(() => {});
            responseMessage = `🙋 Incident assigned to *${targetUser.name}* (<@${slackUserId}>)`;
            timelineMessage = `Assigned to ${targetUser.name} via Slack button`;
          } catch (err) {
            logger.warn('[Slack] Assign to Me failed', { error: err, incidentId });
            return NextResponse.json({
              response_type: 'ephemeral',
              text: '⚠️ Could not assign this incident. Please try again, or assign it from the OpsKnight incident page.',
            });
          }
        } else {
          return NextResponse.json({
            response_type: 'ephemeral',
            text: '⚠️ Could not identify your Slack user, so the incident was left unchanged.',
          });
        }
      } else {
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      }

      // Create incident event — plain text, so the web timeline shows a
      // name rather than a raw Slack mention like <@U0673U4TWAJ>
      await prisma.incidentEvent
        .create({
          data: {
            incidentId,
            message: timelineMessage || `${responseMessage} (1-Click Slack Button)`,
          },
        })
        .catch(() => {});

      // Post notification directly into Slack channel & response_url
      try {
        const { slackApiCall } = await import('@/lib/chatops/war-room');

        if (botToken && incident.slackChannelId) {
          await slackApiCall('chat.postMessage', botToken, {
            channel: incident.slackChannelId,
            text: responseMessage,
          }).catch(() => {});
        }

        if (payload.response_url) {
          await fetch(payload.response_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: responseMessage,
              response_type: 'in_channel',
            }),
          }).catch(() => {});
        }
      } catch (notifyErr) {
        logger.warn('[Slack] Failed to dispatch action response message', { error: notifyErr });
      }

      return NextResponse.json({
        text: responseMessage,
        response_type: 'in_channel',
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    logger.error('[Slack] Actions API error', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

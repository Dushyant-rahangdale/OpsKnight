/**
 * Slack Event Subscriptions API
 * Listens for Slack events such as `reaction_added` (:pushpin:, :memo:)
 * and automatically captures pinned messages into the OpsKnight incident timeline.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getSlackBotToken } from '@/lib/slack';
import { retryFetch } from '@/lib/retry';
import crypto from 'crypto';

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

const PIN_EMOJIS = new Set(['pushpin', 'round_pushpin', 'memo', 'star', 'bookmark']);

/**
 * Verify Slack request signature
 */
function verifySlackSignature(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  if (!SLACK_SIGNING_SECRET) {
    return true; // Allow in dev if no secret configured
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp, 10);
  if (Math.abs(currentTime - requestTime) > 300) {
    return false;
  }

  const sigBaseString = `v0:${timestamp}:${body}`;
  const computedSignature =
    'v0=' +
    crypto
      .createHmac('sha256', SLACK_SIGNING_SECRET)
      .update(sigBaseString)
      .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(computedSignature),
    Buffer.from(signature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-slack-signature') || '';
    const timestamp = request.headers.get('x-slack-request-timestamp') || '';

    // Verify signature
    if (!verifySlackSignature(rawBody, signature, timestamp)) {
      logger.warn('[Slack Events] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // 1. Handle Slack URL Verification Challenge
    if (payload.type === 'url_verification') {
      return NextResponse.json({ challenge: payload.challenge });
    }

    // 2. Handle Event Callbacks
    if (payload.type === 'event_callback' && payload.event) {
      const event = payload.event;

      // Reaction Added (📌 Emoji Reaction Sync)
      if (event.type === 'reaction_added' && PIN_EMOJIS.has(event.reaction)) {
        const channelId = event.item?.channel;
        const messageTs = event.item?.ts;
        const slackUserId = event.user;

        if (!channelId || !messageTs) {
          return NextResponse.json({ ok: true });
        }

        // Find incident linked to this channel
        const incident = await prisma.incident.findFirst({
          where: { slackChannelId: channelId },
          select: { id: true, title: true, serviceId: true, assigneeId: true },
        });

        if (!incident) {
          return NextResponse.json({ ok: true }); // Not a war-room channel
        }

        const botToken = await getSlackBotToken(incident.serviceId);
        if (!botToken) {
          return NextResponse.json({ ok: true });
        }

        // Fetch original message text from Slack history
        let messageText = '';
        let authorName = 'Slack User';

        try {
          const historyUrl = `https://slack.com/api/conversations.history?channel=${channelId}&latest=${messageTs}&inclusive=true&limit=1`;
          const historyRes = await retryFetch(historyUrl, {
            headers: { Authorization: `Bearer ${botToken}` },
          });
          const historyData = await historyRes.json();

          if (historyData.ok && historyData.messages?.[0]) {
            messageText = historyData.messages[0].text || '';
          }
        } catch (err) {
          logger.warn('[Slack Events] Failed to fetch message text', { error: err });
        }

        // Fetch reactor user info from Slack
        try {
          const userUrl = `https://slack.com/api/users.info?user=${slackUserId}`;
          const userRes = await retryFetch(userUrl, {
            headers: { Authorization: `Bearer ${botToken}` },
          });
          const userData = await userRes.json();
          if (userData.ok && userData.user) {
            authorName = userData.user.profile?.real_name || userData.user.name || slackUserId;
          }
        } catch (err) {
          logger.warn('[Slack Events] Failed to fetch reactor info', { error: err });
        }

        if (messageText) {
          // Resolve to OpsKnight user or fallback to assignee
          const userByEmail = await prisma.user.findFirst({
            where: { name: { contains: authorName, mode: 'insensitive' } },
            select: { id: true },
          });
          const noteUserId = userByEmail?.id || incident.assigneeId;

          if (noteUserId) {
            await prisma.incidentNote.create({
              data: {
                incidentId: incident.id,
                userId: noteUserId,
                content: `📌 [Slack Pin by ${authorName}]: ${messageText}`,
              },
            });
          }

          // Create timeline event
          await prisma.incidentEvent.create({
            data: {
              incidentId: incident.id,
              message: `Message pinned to timeline via 📌 emoji by @${authorName}`,
            },
          });

          // Post confirmation thread reply in Slack
          await retryFetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${botToken}`,
            },
            body: JSON.stringify({
              channel: channelId,
              thread_ts: messageTs,
              text: `📌 *Pinned to OpsKnight Incident Timeline!*`,
            }),
          }).catch(() => {});

          logger.info('[Slack Events] Pinned message synced to timeline', {
            incidentId: incident.id,
            authorName,
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    logger.error('[Slack Events] Event handler error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

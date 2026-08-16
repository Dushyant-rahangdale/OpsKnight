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

const PIN_EMOJIS = new Set(['pushpin', 'round_pushpin', 'memo', 'star', 'bookmark', 'pin', 'push_pin', 'note']);

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

  // timingSafeEqual throws on length mismatch — treat a malformed signature as invalid
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
      const rawEmoji = (event.reaction || '').split('::')[0];

      // Reaction Added (📌 Emoji Reaction Sync)
      if (event.type === 'reaction_added' && PIN_EMOJIS.has(rawEmoji)) {
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

        // Fetch original message text from Slack history (or thread replies)
        let messageText = '';
        let authorName = 'Slack User';
        let reactorEmail: string | undefined;

        // Slack API error from history/replies, retained so a failed lookup is explained
        // rather than silently degrading to placeholder note text
        let lookupError: string | undefined;

        try {
          // Pass inclusive=true and limit=10 to reliably locate messageTs in Slack channel history
          const historyUrl = `https://slack.com/api/conversations.history?channel=${channelId}&latest=${messageTs}&inclusive=true&limit=10`;
          const historyRes = await retryFetch(historyUrl, {
            headers: { Authorization: `Bearer ${botToken}` },
          });
          const historyData = await historyRes.json();

          if (!historyData.ok) {
            lookupError = historyData.error || 'unknown_error';
          }

          const foundMsg = historyData.ok
            ? historyData.messages?.find((m: { ts: string; text?: string }) => m.ts === messageTs) || historyData.messages?.[0]
            : null;

          if (foundMsg?.text) {
            messageText = foundMsg.text;
          } else {
            // Fallback to conversations.replies for thread replies
            const repliesUrl = `https://slack.com/api/conversations.replies?channel=${channelId}&ts=${messageTs}&limit=5`;
            const repliesRes = await retryFetch(repliesUrl, {
              headers: { Authorization: `Bearer ${botToken}` },
            });
            const repliesData = await repliesRes.json();
            if (!repliesData.ok) {
              lookupError = lookupError || repliesData.error || 'unknown_error';
            }
            const foundReply = repliesData.ok
              ? repliesData.messages?.find((m: { ts: string; text?: string }) => m.ts === messageTs) || repliesData.messages?.[0]
              : null;
            if (foundReply?.text) {
              messageText = foundReply.text;
            }
          }
        } catch (err) {
          lookupError = err instanceof Error ? err.message : String(err);
          logger.warn('[Slack Events] Failed to fetch message text', { error: err });
        }

        // Guaranteed fallback so note is never skipped
        if (!messageText) {
          if (lookupError) {
            logger.warn('[Slack Events] Could not read pinned message text', {
              incidentId: incident.id,
              channelId,
              messageTs,
              error: lookupError,
              hint:
                lookupError === 'missing_scope'
                  ? "Slack app is missing the 'channels:history' (or 'groups:history' for private channels) scope. Re-authorize Slack in Settings > Slack."
                  : undefined,
            });
          }

          messageText =
            (event as { text?: string }).text ||
            (lookupError === 'missing_scope'
              ? "(message text unavailable — Slack app is missing the 'channels:history' scope; re-authorize Slack in Settings > Slack)"
              : lookupError
                ? `(message text unavailable — Slack API error: ${lookupError})`
                : 'Pinned message from Slack war-room channel');
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
            reactorEmail = userData.user.profile?.email?.trim();
          }
        } catch (err) {
          logger.warn('[Slack Events] Failed to fetch reactor info', { error: err });
        }

        if (messageText) {
          // Resolve to OpsKnight user by email first, then name, then fallback to assignee
          let resolvedUser: { id: string } | null = null;
          if (reactorEmail) {
            resolvedUser = await prisma.user.findFirst({
              where: { email: { equals: reactorEmail, mode: 'insensitive' } },
              select: { id: true },
            });
          }
          if (!resolvedUser && authorName) {
            resolvedUser = await prisma.user.findFirst({
              where: { name: { contains: authorName, mode: 'insensitive' } },
              select: { id: true },
            });
          }
          const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
          const noteUserId = resolvedUser?.id || incident.assigneeId || fallbackUser?.id;

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

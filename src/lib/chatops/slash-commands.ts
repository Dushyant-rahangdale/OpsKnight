/**
 * ChatOps Slash Command Dispatcher
 * Handles /incident slash commands from Slack war-room channels.
 * Supports: ack, resolve, note, who, help
 */

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getSlackBotToken } from '@/lib/slack';
import { retryFetch } from '@/lib/retry';

export interface SlashCommandPayload {
  command: string;
  text: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  team_id: string;
  response_url: string;
}

interface SlackResponse {
  response_type: 'in_channel' | 'ephemeral';
  text?: string;
  blocks?: unknown[];
}

/**
 * Resolve a Slack user ID to an OpsKnight user with robust multi-level fallback:
 * 1. Match by email (case-insensitive)
 * 2. Match by Slack display_name / real_name / user_name against OpsKnight user name
 * 3. Fallback to incident assignee or first admin user so commands never fail
 */
async function resolveOpsKnightUser(
  slackUserId: string,
  botToken: string,
  fallbackAssigneeId?: string | null,
  slackUserName?: string
) {
  try {
    let slackEmail: string | undefined;
    let slackRealName: string | undefined;

    if (botToken) {
      const response = await retryFetch(
        'https://slack.com/api/users.info',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${botToken}`,
          },
          body: JSON.stringify({ user: slackUserId }),
        },
        { maxAttempts: 2, initialDelayMs: 300 }
      );

      const data = await response.json();
      if (data.ok && data.user) {
        slackEmail = data.user.profile?.email?.trim();
        slackRealName = (data.user.profile?.real_name || data.user.real_name || data.user.name)?.trim();
      }
    }

    // 1. Try match by email
    if (slackEmail) {
      const userByEmail = await prisma.user.findFirst({
        where: { email: { equals: slackEmail, mode: 'insensitive' } },
        select: { id: true, name: true, email: true },
      });
      if (userByEmail) return userByEmail;
    }

    // 2. Try match by real_name or user_name
    const nameToMatch = (slackRealName || slackUserName)?.trim();
    if (nameToMatch) {
      const firstName = nameToMatch.split(' ')[0];
      const userByName = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { equals: nameToMatch, mode: 'insensitive' } },
            { name: { contains: firstName, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, email: true },
      });
      if (userByName) return userByName;
    }

    // 3. Fallback to incident assignee
    if (fallbackAssigneeId) {
      const fallbackUser = await prisma.user.findUnique({
        where: { id: fallbackAssigneeId },
        select: { id: true, name: true, email: true },
      });
      if (fallbackUser) return fallbackUser;
    }

    // 4. Fallback to system admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true },
    });
    return adminUser;
  } catch (error) {
    logger.warn('[ChatOps] Failed to resolve Slack user', { slackUserId, error });
    return null;
  }
}

/**
 * Main slash command dispatcher
 */
export async function handleSlashCommand(payload: SlashCommandPayload): Promise<SlackResponse> {
  const { text, channel_id, user_id } = payload;

  // Parse subcommand and args
  const parts = text.trim().split(/\s+/);
  const subcommand = (parts[0] || 'help').toLowerCase();
  const args = parts.slice(1).join(' ');

  // Find incident linked to this channel
  const incident = await prisma.incident.findFirst({
    where: {
      slackChannelId: channel_id,
    },
    include: {
      service: { select: { id: true, name: true, escalationPolicyId: true } },
      assignee: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Handle 'help' and 'who' without requiring an incident
  if (subcommand === 'help') {
    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🛡️ OpsKnight Incident Commands', emoji: true },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: [
              '`/incident ack` — Acknowledge this incident',
              '`/incident resolve [summary]` — Resolve with optional summary',
              '`/incident note <message>` — Add an incident note',
              '`/incident who` — Show who is on-call',
              '`/incident help` — Show this help message',
            ].join('\n'),
          },
        },
      ],
    };
  }

  if (!incident) {
    return {
      response_type: 'ephemeral',
      text: '⚠️ No incident is linked to this channel. This command only works in OpsKnight war-room channels.',
    };
  }

  // Get bot token for user resolution
  const botToken = await getSlackBotToken(incident.service.id);

  switch (subcommand) {
    case 'ack':
    case 'acknowledge': {
      if (incident.status === 'ACKNOWLEDGED' || incident.status === 'RESOLVED') {
        return {
          response_type: 'ephemeral',
          text: `ℹ️ Incident is already ${incident.status.toLowerCase()}.`,
        };
      }

      await prisma.incident.update({
        where: { id: incident.id },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: incident.acknowledgedAt ?? new Date(),
          escalationStatus: 'COMPLETED',
          nextEscalationAt: null,
        },
      });

      await prisma.incidentEvent.create({
        data: {
          incidentId: incident.id,
          message: `Acknowledged via Slack ChatOps by @${payload.user_name}`,
        },
      });

      logger.info('[ChatOps] Incident acknowledged via slash command', {
        incidentId: incident.id,
        slackUser: payload.user_name,
      });

      // Update channel topic to ACKNOWLEDGED
      try {
        const { updateWarRoomTopic } = await import('@/lib/chatops/war-room');
        updateWarRoomTopic(incident.id, 'ACKNOWLEDGED').catch(err =>
          logger.warn('[ChatOps] Failed to update topic on ack', { error: err })
        );
      } catch (e) {
        logger.warn('[ChatOps] Failed to load war-room module', { error: e });
      }

      return {
        response_type: 'in_channel',
        text: `👀 *Incident Acknowledged* by <@${user_id}>\n_${incident.title}_`,
      };
    }

    case 'resolve': {
      if (incident.status === 'RESOLVED') {
        return {
          response_type: 'ephemeral',
          text: 'ℹ️ Incident is already resolved.',
        };
      }

      const resolution = args || 'Resolved via Slack ChatOps';

      await prisma.incident.update({
        where: { id: incident.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: incident.resolvedAt ?? new Date(),
          acknowledgedAt: incident.acknowledgedAt ?? new Date(),
          escalationStatus: 'COMPLETED',
          nextEscalationAt: null,
        },
      });

      // Create resolution note
      let noteUserId: string | undefined;
      if (botToken) {
        const opsUser = await resolveOpsKnightUser(
          user_id,
          botToken,
          incident.assigneeId,
          payload.user_name
        );
        noteUserId = opsUser?.id;
      }

      if (noteUserId) {
        await prisma.incidentNote.create({
          data: {
            incidentId: incident.id,
            userId: noteUserId,
            content: `[Resolution] ${resolution}`,
          },
        });
      }

      await prisma.incidentEvent.create({
        data: {
          incidentId: incident.id,
          message: `Resolved via Slack ChatOps by @${payload.user_name}: ${resolution}`,
        },
      });

      logger.info('[ChatOps] Incident resolved via slash command', {
        incidentId: incident.id,
        slackUser: payload.user_name,
      });

      // Archive war-room channel on resolve
      try {
        const { archiveWarRoomChannel } = await import('@/lib/chatops/war-room');
        archiveWarRoomChannel(incident.id).catch(err =>
          logger.warn('[ChatOps] Failed to archive war-room after slash resolve', { error: err })
        );
      } catch (e) {
        logger.warn('[ChatOps] Failed to load war-room module', { error: e });
      }

      return {
        response_type: 'in_channel',
        text: `✅ *Incident Resolved* by <@${user_id}>\n_${resolution}_`,
      };
    }

    case 'note': {
      if (!args) {
        return {
          response_type: 'ephemeral',
          text: '⚠️ Please provide a note message: `/incident note <your message>`',
        };
      }

      let noteUserId: string | undefined;
      if (botToken) {
        const opsUser = await resolveOpsKnightUser(
          user_id,
          botToken,
          incident.assigneeId,
          payload.user_name
        );
        noteUserId = opsUser?.id;
      }

      if (!noteUserId) {
        return {
          response_type: 'ephemeral',
          text: '⚠️ Could not find your OpsKnight account. Please make sure your Slack email matches your OpsKnight email.',
        };
      }

      await prisma.incidentNote.create({
        data: {
          incidentId: incident.id,
          userId: noteUserId,
          content: args,
        },
      });

      await prisma.incidentEvent.create({
        data: {
          incidentId: incident.id,
          message: `Note added via Slack ChatOps by @${payload.user_name}`,
        },
      });

      logger.info('[ChatOps] Note added via slash command', {
        incidentId: incident.id,
        slackUser: payload.user_name,
      });

      return {
        response_type: 'in_channel',
        text: `📝 *Note added* by <@${user_id}>:\n> ${args}`,
      };
    }

    case 'who': {
      // Query on-call schedule for the service
      try {
        const policy = incident.service.escalationPolicyId
          ? await prisma.escalationPolicy.findUnique({
              where: { id: incident.service.escalationPolicyId },
              include: {
                steps: {
                  include: {
                    targetUser: { select: { name: true, email: true } },
                    targetSchedule: { select: { id: true, name: true } },
                    targetTeam: {
                      select: {
                        name: true,
                        members: {
                          include: { user: { select: { name: true } } },
                          where: { role: { in: ['OWNER', 'ADMIN'] } },
                          take: 5,
                        },
                      },
                    },
                  },
                  orderBy: { stepOrder: 'asc' },
                },
              },
            })
          : null;

        if (!policy?.steps?.length) {
          return {
            response_type: 'ephemeral',
            text: `ℹ️ No escalation policy configured for *${incident.service.name}*.`,
          };
        }

        const lines = await Promise.all(policy.steps.map(async (step, i) => {
          const targets: string[] = [];
          if (step.targetUser) targets.push(`👤 ${step.targetUser.name}`);
          if (step.targetTeam) {
            const members = step.targetTeam.members.map(m => m.user.name).join(', ');
            targets.push(`👥 ${step.targetTeam.name} (${members})`);
          }
          if (step.targetSchedule) {
            // Try to resolve current on-call from schedule
            try {
              const { resolveEscalationTarget } = await import('@/lib/escalation');
              const userIds = await resolveEscalationTarget('SCHEDULE', step.targetSchedule.id, new Date());
              if (userIds.length > 0) {
                const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { name: true } });
                targets.push(`📅 ${step.targetSchedule.name} (On-call: ${users.map(u => u.name).join(', ')})`);
              } else {
                targets.push(`📅 ${step.targetSchedule.name} (No one on-call)`);
              }
            } catch {
              targets.push(`📅 ${step.targetSchedule.name}`);
            }
          }
          return `*Step ${i + 1}* (${step.delayMinutes}min delay): ${targets.join(', ') || 'Schedule-based'}`;
        }));

        return {
          response_type: 'ephemeral',
          text: `📋 *On-Call for ${incident.service.name}:*\n${lines.join('\n')}`,
        };
      } catch (error) {
        logger.error('[ChatOps] Failed to query on-call', { error });
        return {
          response_type: 'ephemeral',
          text: '⚠️ Failed to query on-call information.',
        };
      }
    }

    default:
      return {
        response_type: 'ephemeral',
        text: `❓ Unknown command: \`${subcommand}\`. Try \`/incident help\` for available commands.`,
      };
  }
}

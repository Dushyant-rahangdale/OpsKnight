/**
 * ChatOps War-Room Engine
 * Provisions dedicated Slack channels for critical incidents,
 * auto-invites on-call responders, generates video bridges,
 * and posts rich Incident Command Cards.
 */

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getSlackBotToken, sendSlackMessageToChannel } from '@/lib/slack';
import { getBaseUrl } from '@/lib/env-validation';
import { retryFetch } from '@/lib/retry';

type WarRoomResult = {
  success: boolean;
  channelId?: string;
  channelName?: string;
  warRoomUrl?: string | null;
  error?: string;
};

/**
 * Slugify a service name for Slack channel naming (lowercase, hyphens, max length)
 */
function slugify(name: string, maxLen: number = 40): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen);
}

/**
 * Generate a video bridge URL based on provider configuration
 */
export function generateBridgeUrl(
  incidentId: string,
  provider: string,
  customTemplate?: string | null
): string | null {
  switch (provider) {
    case 'JITSI':
      return `https://meet.jit.si/opsknight-inc-${incidentId.slice(-8)}`;
    case 'NONE':
      return null;
    default:
      // Custom template with {incidentId} placeholder
      if (customTemplate) {
        return customTemplate.replace(/\{incidentId\}/g, incidentId);
      }
      return null;
  }
}

/**
 * Call a Slack API method with bot token authentication
 */
async function slackApiCall(
  method: string,
  botToken: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; error?: string; channel?: { id: string; name: string }; user?: { profile?: { email?: string } } }> {
  const response = await retryFetch(
    `https://slack.com/api/${method}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${botToken}`,
      },
      body: JSON.stringify(body),
    },
    {
      maxAttempts: 2,
      initialDelayMs: 500,
      retryableErrors: (error) => {
        if (error instanceof Error) {
          return error.message.includes('fetch') || error.message.includes('network');
        }
        return false;
      },
    }
  );

  return response.json();
}

/**
 * Create a dedicated Slack war-room channel for a critical incident.
 * Checks eligibility based on ChatOpsConfig thresholds and service settings.
 */
export async function createIncidentWarRoom(incidentId: string): Promise<WarRoomResult> {
  try {
    // Load incident with service
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        service: true,
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    if (!incident) {
      return { success: false, error: 'Incident not found' };
    }

    // Already has a war-room
    if (incident.slackChannelId) {
      return { success: true, channelId: incident.slackChannelId, channelName: incident.slackChannelName || undefined };
    }

    // Load global ChatOps config
    const config = await prisma.chatOpsConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config?.enabled) {
      return { success: false, error: 'ChatOps is not enabled' };
    }

    // Check per-service override
    if (!incident.service.autoCreateWarRoom) {
      return { success: false, error: 'War-room auto-creation disabled for this service' };
    }

    // Check urgency threshold
    const urgencyMatch = config.autoCreateOnUrgency.includes(incident.urgency);
    const priorityMatch = incident.priority ? config.autoCreateOnPriority.includes(incident.priority) : false;

    if (!urgencyMatch && !priorityMatch) {
      return { success: false, error: 'Incident does not meet urgency/priority threshold' };
    }

    // Get bot token
    const botToken = await getSlackBotToken(incident.serviceId);
    if (!botToken) {
      return { success: false, error: 'No Slack bot token configured' };
    }

    // Generate channel name
    const serviceSlug = slugify(incident.service.name);
    const idSuffix = incidentId.slice(-6);
    const channelName = `${config.channelPrefix}-${idSuffix}-${serviceSlug}`.slice(0, 80);

    // Create channel via Slack API
    const createResult = await slackApiCall('conversations.create', botToken, {
      name: channelName,
      is_private: false,
    });

    if (!createResult.ok) {
      logger.error('[ChatOps] Failed to create Slack channel', {
        error: createResult.error,
        channelName,
        incidentId,
      });
      return { success: false, error: `Slack API error: ${createResult.error}` };
    }

    const channelId = createResult.channel?.id;
    if (!channelId) {
      return { success: false, error: 'No channel ID returned from Slack' };
    }

    // Set channel topic
    const appUrl = getBaseUrl();
    const dashboardUrl = `${appUrl}/incidents/${incidentId}`;
    const topic = `🚨 ${incident.title} | ${incident.urgency} | ${dashboardUrl}`;

    await slackApiCall('conversations.setTopic', botToken, {
      channel: channelId,
      topic: topic.slice(0, 250),
    }).catch(err => logger.warn('[ChatOps] Failed to set channel topic', { error: err }));

    // Resolve and invite on-call responders
    try {
      const service = await prisma.service.findUnique({
        where: { id: incident.serviceId },
        include: {
          policy: {
            include: {
              steps: {
                include: {
                  targetUser: { select: { email: true } },
                  targetTeam: {
                    include: {
                      members: {
                        include: { user: { select: { email: true } } },
                        where: { role: { in: ['OWNER', 'ADMIN'] } },
                        take: 5,
                      },
                    },
                  },
                },
                orderBy: { stepOrder: 'asc' },
                take: 3, // First 3 escalation steps
              },
            },
          },
        },
      });

      const emailsToInvite = new Set<string>();

      // Collect emails from escalation policy targets
      if (service?.policy?.steps) {
        for (const step of service.policy.steps) {
          if (step.targetUser?.email) {
            emailsToInvite.add(step.targetUser.email);
          }
          if (step.targetTeam?.members) {
            for (const member of step.targetTeam.members) {
              if (member.user.email) {
                emailsToInvite.add(member.user.email);
              }
            }
          }
        }
      }

      // Add the current assignee
      if (incident.assignee?.email) {
        emailsToInvite.add(incident.assignee.email);
      }

      // Look up Slack user IDs and invite them
      const slackUserIds: string[] = [];
      for (const email of emailsToInvite) {
        try {
          const lookupResult = await slackApiCall('users.lookupByEmail', botToken, { email });
          if (lookupResult.ok && (lookupResult as any).user?.id) { // eslint-disable-line @typescript-eslint/no-explicit-any
            slackUserIds.push((lookupResult as any).user.id); // eslint-disable-line @typescript-eslint/no-explicit-any
          }
        } catch {
          // Skip users we can't find in Slack
        }
      }

      if (slackUserIds.length > 0) {
        await slackApiCall('conversations.invite', botToken, {
          channel: channelId,
          users: slackUserIds.join(','),
        }).catch(err => logger.warn('[ChatOps] Failed to invite some users', { error: err }));
      }
    } catch (err) {
      logger.warn('[ChatOps] Failed to resolve/invite responders', { error: err, incidentId });
    }

    // Generate video bridge URL
    const videoBridge = incident.service.warRoomVideoBridge || config.defaultVideoBridge;
    const customUrl = incident.service.warRoomCustomBridgeUrl || config.customBridgeUrlTemplate;
    const warRoomUrl = generateBridgeUrl(incidentId, videoBridge, customUrl);

    // Post Incident Command Card to the channel
    await sendSlackMessageToChannel(
      channelId,
      {
        id: incident.id,
        title: incident.title,
        status: incident.status,
        urgency: incident.urgency,
        serviceName: incident.service.name,
        assigneeName: incident.assignee?.name,
      },
      'triggered',
      true,
      incident.serviceId,
      warRoomUrl ? `📹 Video Bridge: ${warRoomUrl}` : undefined
    ).catch(err => logger.warn('[ChatOps] Failed to post command card', { error: err }));

    // Update incident with war-room metadata
    await prisma.incident.update({
      where: { id: incidentId },
      data: {
        slackChannelId: channelId,
        slackChannelName: channelName,
        warRoomUrl,
      },
    });

    // Log timeline event
    await prisma.incidentEvent.create({
      data: {
        incidentId,
        message: `War-room channel #${channelName} created${warRoomUrl ? ` with video bridge` : ''}`,
      },
    });

    logger.info('[ChatOps] War-room created successfully', {
      incidentId,
      channelId,
      channelName,
      warRoomUrl,
    });

    return { success: true, channelId, channelName, warRoomUrl };
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    logger.error('[ChatOps] War-room creation failed', { incidentId, error: err });
    return { success: false, error: err };
  }
}

/**
 * Post an update message to an existing war-room channel
 */
export async function postWarRoomUpdate(
  incidentId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: { slackChannelId: true, serviceId: true },
    });

    if (!incident?.slackChannelId) {
      return { success: false, error: 'No war-room channel for this incident' };
    }

    const botToken = await getSlackBotToken(incident.serviceId);
    if (!botToken) {
      return { success: false, error: 'No Slack bot token' };
    }

    const result = await slackApiCall('chat.postMessage', botToken, {
      channel: incident.slackChannelId,
      text: message,
      unfurl_links: false,
    });

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    logger.error('[ChatOps] War-room update failed', { incidentId, error: err });
    return { success: false, error: err };
  }
}

/**
 * Archive a war-room channel when incident is resolved
 */
export async function archiveWarRoomChannel(
  incidentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: { slackChannelId: true, slackChannelName: true, serviceId: true },
    });

    if (!incident?.slackChannelId) {
      return { success: false, error: 'No war-room channel' };
    }

    const config = await prisma.chatOpsConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config?.archiveOnResolve) {
      return { success: false, error: 'Archive on resolve is disabled' };
    }

    const botToken = await getSlackBotToken(incident.serviceId);
    if (!botToken) {
      return { success: false, error: 'No Slack bot token' };
    }

    // Update topic to resolved
    await slackApiCall('conversations.setTopic', botToken, {
      channel: incident.slackChannelId,
      topic: '✅ Incident Resolved — This channel has been archived.',
    }).catch(() => {});

    // Post final message
    await slackApiCall('chat.postMessage', botToken, {
      channel: incident.slackChannelId,
      text: '✅ This incident has been resolved. Archiving war-room channel.',
    }).catch(() => {});

    // Archive channel
    const archiveResult = await slackApiCall('conversations.archive', botToken, {
      channel: incident.slackChannelId,
    });

    if (!archiveResult.ok && archiveResult.error !== 'already_archived') {
      logger.warn('[ChatOps] Failed to archive channel', { error: archiveResult.error });
    }

    // Log event
    await prisma.incidentEvent.create({
      data: {
        incidentId,
        message: `War-room channel #${incident.slackChannelName} archived`,
      },
    });

    logger.info('[ChatOps] War-room archived', {
      incidentId,
      channelId: incident.slackChannelId,
    });

    return { success: true };
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    logger.error('[ChatOps] War-room archive failed', { incidentId, error: err });
    return { success: false, error: err };
  }
}

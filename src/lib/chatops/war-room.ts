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
  customTemplate?: string | null,
  slackChannelId?: string | null,
  slackTeamId?: string | null
): string | null {
  if (!provider || provider === 'NONE') {
    return null;
  }

  // Format custom URL template if provided
  let formattedUrl = customTemplate ? customTemplate.replace(/\{incidentId\}/g, incidentId).trim() : null;

  if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  switch (provider) {
    case 'SLACK_HUDDLE':
      if (slackTeamId && slackChannelId) {
        return `https://slack.com/app_redirect?channel=${slackChannelId}&team=${slackTeamId}`;
      }
      if (slackChannelId) {
        return `https://slack.com/app_redirect?channel=${slackChannelId}`;
      }
      return `https://slack.com/app_redirect`;

    case 'JITSI':
      return formattedUrl || `https://meet.jit.si/opsknight-inc-${incidentId.slice(-8)}`;

    case 'ZOOM':
      if (formattedUrl) {
        return formattedUrl;
      }
      return `https://zoom.us/j/opsknight-inc-${incidentId.slice(-8)}`;

    case 'GOOGLE_MEET':
      if (formattedUrl) {
        return formattedUrl;
      }
      return `https://meet.google.com/lookup/opsknight-inc-${incidentId.slice(-8)}`;

    default:
      if (formattedUrl) {
        return formattedUrl;
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
 * Lookup Slack user by email via HTTP GET query parameters
 */
async function findSlackUserByEmail(
  botToken: string,
  email: string
): Promise<{ ok: boolean; error?: string; user?: { id: string } }> {
  const url = `https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`;
  const response = await retryFetch(
    url,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${botToken}`,
      },
    },
    {
      maxAttempts: 2,
      initialDelayMs: 500,
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
      const errorMsg =
        createResult.error === 'missing_scope'
          ? "Slack app is missing the 'channels:manage' scope. Please re-authorize Slack in Settings > Slack to grant channel creation permissions."
          : `Slack API error: ${createResult.error}`;
      return { success: false, error: errorMsg };
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
      const { resolveEscalationTarget } = await import('@/lib/escalation');

      const service = await prisma.service.findUnique({
        where: { id: incident.serviceId },
        include: {
          policy: {
            include: {
              steps: {
                orderBy: { stepOrder: 'asc' },
                take: 3, // First 3 escalation steps
              },
            },
          },
        },
      });

      const userIdsToInvite = new Set<string>();

      // Collect user IDs from escalation policy steps (Schedules, Teams, Users)
      if (service?.policy?.steps) {
        for (const step of service.policy.steps) {
          const targetId = step.targetUserId || step.targetTeamId || step.targetScheduleId;
          if (targetId) {
            try {
              const resolvedUserIds = await resolveEscalationTarget(
                step.targetType as 'USER' | 'TEAM' | 'SCHEDULE',
                targetId,
                new Date(),
                step.notifyOnlyTeamLead
              );
              resolvedUserIds.forEach(id => userIdsToInvite.add(id));
            } catch (stepErr) {
              logger.warn('[ChatOps] Failed to resolve step target', { targetId, error: stepErr });
            }
          }
        }
      }

      // Add the current assignee (re-query latest from DB in case escalation just assigned it)
      const latestIncidentAssignee = await prisma.incident.findUnique({
        where: { id: incidentId },
        select: { assigneeId: true },
      });
      const activeAssigneeId = latestIncidentAssignee?.assigneeId || incident.assigneeId;
      if (activeAssigneeId) {
        userIdsToInvite.add(activeAssigneeId);
      }

      const emailsToInvite = new Set<string>();

      // Fetch emails for all resolved user IDs
      if (userIdsToInvite.size > 0) {
        const usersToInvite = await prisma.user.findMany({
          where: { id: { in: Array.from(userIdsToInvite) } },
          select: { id: true, name: true, email: true },
        });

        for (const user of usersToInvite) {
          if (user.email) {
            emailsToInvite.add(user.email);
          }
        }
      }

      // Parallel email lookups for better performance
      const lookupResults = await Promise.allSettled(
        Array.from(emailsToInvite).map(async (email) => {
          const lookupResult = await slackApiCall('users.lookupByEmail', botToken, { email });
          if (lookupResult.ok && (lookupResult as any).user?.id) { // eslint-disable-line @typescript-eslint/no-explicit-any
            return (lookupResult as any).user.id as string; // eslint-disable-line @typescript-eslint/no-explicit-any
          }
          logger.warn('[ChatOps] Could not find Slack user by email', {
            email,
            error: lookupResult.error || 'User not found in Slack workspace',
          });
          return null;
        })
      );

      const slackUserIds: string[] = lookupResults
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value);

      // Invite users individually to prevent one failure from blocking all
      for (const slackUserId of slackUserIds) {
        await slackApiCall('conversations.invite', botToken, {
          channel: channelId,
          users: slackUserId,
        }).catch(err => {
          const errMsg = err?.error || (err instanceof Error ? err.message : String(err));
          if (errMsg !== 'already_in_channel') {
            logger.warn('[ChatOps] Failed to invite user to war-room', { slackUserId, error: errMsg });
          }
        });
      }
    } catch (err) {
      logger.warn('[ChatOps] Failed to resolve/invite responders', { error: err, incidentId });
    }

    // Generate video bridge URL
    const videoBridge = incident.service.warRoomVideoBridge || config.defaultVideoBridge;
    const customUrl = incident.service.warRoomCustomBridgeUrl || config.customBridgeUrlTemplate;

    // Fetch Slack teamId for native Huddle URL formatting (https://app.slack.com/huddle/teamId/channelId)
    let slackTeamId: string | null = null;
    if (botToken && videoBridge === 'SLACK_HUDDLE') {
      const authTest = await slackApiCall('auth.test', botToken, {}).catch(() => null);
      if (authTest?.ok && (authTest as any).team_id) { // eslint-disable-line @typescript-eslint/no-explicit-any
        slackTeamId = (authTest as any).team_id as string; // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }

    const warRoomUrl = generateBridgeUrl(incidentId, videoBridge, customUrl, channelId, slackTeamId);

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

/**
 * Update the Slack war-room channel topic when incident status or metadata changes
 */
export async function updateWarRoomTopic(
  incidentId: string,
  newStatus?: string
): Promise<void> {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: {
        title: true,
        urgency: true,
        status: true,
        slackChannelId: true,
        serviceId: true,
        assignee: { select: { name: true } },
        team: { select: { name: true } },
      },
    });

    if (!incident?.slackChannelId) return;

    const botToken = await getSlackBotToken(incident.serviceId);
    if (!botToken) return;

    const appUrl = getBaseUrl();
    const dashboardUrl = `${appUrl}/incidents/${incidentId}`;
    const displayStatus = newStatus || incident.status;
    const statusIcon = displayStatus === 'ACKNOWLEDGED' ? '👀' : displayStatus === 'RESOLVED' ? '✅' : '🚨';
    const assigneeText = incident.assignee ? ` | 👤 ${incident.assignee.name}` : incident.team ? ` | 👥 ${incident.team.name}` : '';
    const topic = `${statusIcon} ${incident.title} | ${displayStatus} | ${incident.urgency}${assigneeText} | ${dashboardUrl}`;

    await slackApiCall('conversations.setTopic', botToken, {
      channel: incident.slackChannelId,
      topic: topic.slice(0, 250),
    }).catch(() => {});
  } catch (err) {
    logger.warn('[ChatOps] Failed to update war-room topic', { incidentId, error: err });
  }
}

/**
 * Auto-invite a specific user to an incident's war-room channel
 */
export async function inviteUserToWarRoom(
  incidentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: { slackChannelId: true, slackChannelName: true, serviceId: true },
    });

    if (!incident?.slackChannelId) {
      return { success: false, error: 'No active war-room channel' };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user?.email) {
      return { success: false, error: 'User has no email configured' };
    }

    const botToken = await getSlackBotToken(incident.serviceId);
    if (!botToken) {
      return { success: false, error: 'No Slack bot token' };
    }

    const normalizedEmail = user.email.trim().toLowerCase();
    const lookupResult = await findSlackUserByEmail(botToken, normalizedEmail);

    if (!lookupResult.ok || !(lookupResult as any).user?.id) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const lookupErr = lookupResult.error || 'User not found in Slack workspace';
      const reason =
        lookupErr === 'user_not_found'
          ? `Email ${normalizedEmail} not found in Slack workspace`
          : lookupErr === 'missing_scope'
          ? `Slack app is missing 'users:read.email' scope`
          : lookupErr;

      await prisma.incidentEvent.create({
        data: {
          incidentId,
          message: `Slack War-Room: Could not auto-invite ${user.name} (${reason})`,
        },
      }).catch(() => {});

      return { success: false, error: reason };
    }

    const slackUserId = (lookupResult as any).user.id as string; // eslint-disable-line @typescript-eslint/no-explicit-any
    const inviteResult = await slackApiCall('conversations.invite', botToken, {
      channel: incident.slackChannelId,
      users: slackUserId,
    });

    if (!inviteResult.ok && (inviteResult as any).error !== 'already_in_channel') { // eslint-disable-line @typescript-eslint/no-explicit-any
      const inviteErr = (inviteResult as any).error || 'Failed to invite user'; // eslint-disable-line @typescript-eslint/no-explicit-any
      await prisma.incidentEvent.create({
        data: {
          incidentId,
          message: `Slack War-Room: Could not invite ${user.name} to channel #${incident.slackChannelName} (${inviteErr})`,
        },
      }).catch(() => {});

      return { success: false, error: inviteErr };
    }

    return { success: true };
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    logger.error('[ChatOps] Invite user to war-room failed', { incidentId, userId, error: err });
    return { success: false, error: err };
  }
}

/**
 * Auto-invite all members of a team to an incident's war-room channel
 */
export async function inviteTeamToWarRoom(
  incidentId: string,
  teamId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });

    for (const member of teamMembers) {
      await inviteUserToWarRoom(incidentId, member.userId).catch(() => {});
    }

    return { success: true };
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    logger.error('[ChatOps] Invite team to war-room failed', { incidentId, teamId, error: err });
    return { success: false, error: err };
  }
}

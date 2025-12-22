/**
 * User-Based Notification System (PagerDuty-style)
 * 
 * Architecture:
 * - Users configure their notification preferences (email, SMS, push)
 * - System-level providers are configured via env vars (Twilio, SMTP, etc.)
 * - Service-level: Only Slack webhook URL
 * - When sending notifications, check user preferences and system provider availability
 */

import prisma from './prisma';
import { sendNotification, NotificationChannel } from './notifications';
import { notifySlackForIncident } from './slack';
import { isChannelAvailable } from './notification-providers';

/**
 * Get user's enabled notification channels based on their preferences
 * and system provider availability
 */
export async function getUserNotificationChannels(userId: string): Promise<NotificationChannel[]> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            emailNotificationsEnabled: true,
            smsNotificationsEnabled: true,
            pushNotificationsEnabled: true,
            phoneNumber: true,
            email: true
        }
    });

    if (!user) {
        return []; // User not found
    }

    const channels: NotificationChannel[] = [];

    // Email: Check user preference and system availability
    if (user.emailNotificationsEnabled && await isChannelAvailable('EMAIL')) {
        channels.push('EMAIL');
    }

    // SMS: Check user preference, phone number, and system availability
    if (user.smsNotificationsEnabled && user.phoneNumber && await isChannelAvailable('SMS')) {
        channels.push('SMS');
    }

    // Push: Check user preference and system availability
    if (user.pushNotificationsEnabled && await isChannelAvailable('PUSH')) {
        channels.push('PUSH');
    }

    // No fallback - respect user's notification preferences
    // If all notifications are disabled, return empty array
    return channels;
}

/**
 * Send notifications to a user based on their preferences
 */
export async function sendUserNotification(
    incidentId: string,
    userId: string,
    message: string
): Promise<{ success: boolean; channelsUsed: NotificationChannel[]; errors?: string[] }> {
    const channels = await getUserNotificationChannels(userId);
    const errors: string[] = [];
    const channelsUsed: NotificationChannel[] = [];

    if (channels.length === 0) {
        return {
            success: false,
            channelsUsed: [],
            errors: ['No notification channels available for user']
        };
    }

    // Send via each enabled channel
    for (const channel of channels) {
        const result = await sendNotification(incidentId, userId, channel, message);
        if (result.success) {
            channelsUsed.push(channel);
        } else {
            errors.push(`${channel}: ${result.error || 'Failed'}`);
        }
    }

    return {
        success: channelsUsed.length > 0,
        channelsUsed,
        errors: errors.length > 0 ? errors : undefined
    };
}

/**
 * Send service-level notifications (to team members and assignee)
 * Uses user preferences for each recipient
 */
export async function sendServiceNotifications(
    incidentId: string,
    eventType: 'triggered' | 'acknowledged' | 'resolved' | 'updated'
): Promise<{ success: boolean; errors?: string[] }> {
    try {
        const incident = await prisma.incident.findUnique({
            where: { id: incidentId },
            include: {
                service: {
                    include: {
                        team: {
                            include: {
                                members: {
                                    include: { user: true }
                                }
                            }
                        }
                    }
                },
                assignee: true
            }
        });

        if (!incident || !incident.service) {
            return { success: false, errors: ['Incident or service not found'] };
        }

        const errors: string[] = [];
        const recipients: string[] = [];

        // Add assignee if exists
        if (incident.assigneeId) {
            recipients.push(incident.assigneeId);
        }

        // Add service team members if team exists
        if (incident.service.team) {
            const teamUserIds = incident.service.team.members.map(m => m.userId);
            recipients.push(...teamUserIds);
        }

        // Remove duplicates
        const uniqueRecipients = [...new Set(recipients)];

        if (uniqueRecipients.length === 0) {
            // No specific recipients, but still send service-level Slack notification if configured
            if (incident.service.slackWebhookUrl) {
                await notifySlackForIncident(incidentId, eventType).catch(err => {
                    errors.push(`Slack notification failed: ${err.message}`);
                });
            }
            return { success: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
        }

        // Send notifications to each recipient based on their preferences
        const message = `[${incident.service.name}] Incident ${eventType}: ${incident.title}`;
        for (const userId of uniqueRecipients) {
            const result = await sendUserNotification(incidentId, userId, message);
            if (!result.success) {
                errors.push(`User ${userId}: ${result.errors?.join(', ') || 'Failed'}`);
            }
        }

        // Send service-level Slack notification (if configured)
        if (incident.service.slackWebhookUrl) {
            await notifySlackForIncident(incidentId, eventType).catch(err => {
                errors.push(`Slack notification failed: ${err.message}`);
            });
        }

        return {
            success: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    } catch (error: any) {
        console.error('Service notification error:', error);
        return { success: false, errors: [error.message] };
    }
}


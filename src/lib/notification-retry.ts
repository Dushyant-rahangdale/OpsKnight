/**
 * Notification Retry Mechanism
 * Handles retrying failed notifications with exponential backoff
 */

import prisma from './prisma';
import { sendNotification, NotificationChannel } from './notifications';
import { logger } from './logger';

const _MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 5000; // 5 seconds
const MAX_RETRY_DELAY_MS = 300000; // 5 minutes

/**
 * Retry failed notifications
 * Should be called periodically by the internal worker
 */
export async function retryFailedNotifications(): Promise<{
  retried: number;
  succeeded: number;
  failed: number;
}> {
  const failedNotifications = await prisma.notification.findMany({
    where: {
      status: 'FAILED',
      failedAt: {
        not: null,
      },
      attempts: {
        lt: _MAX_RETRY_ATTEMPTS,
      },
    },
    take: 100, // Process in batches
    orderBy: {
      failedAt: 'asc', // Retry oldest failures first
    },
    include: {
      incident: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  let succeeded = 0;
  let failed = 0;

  // Filter notifications that are ready to retry based on backoff delay
  const now = Date.now();
  const readyToRetry = failedNotifications.filter(notification => {
    const timeSinceFailure = now - (notification.failedAt?.getTime() || 0);
    const retryDelay = Math.min(
      INITIAL_RETRY_DELAY_MS * Math.pow(2, notification.attempts || 0),
      MAX_RETRY_DELAY_MS
    );
    return timeSinceFailure >= retryDelay;
  });

  // Pre-load channel handlers to avoid repeated dynamic imports
  const emailModule = await import('./email');
  const smsModule = await import('./sms');
  const pushModule = await import('./push');

  // Helper to determine event type from incident status
  const getEventType = (status?: string) =>
    status === 'RESOLVED' ? 'resolved' : status === 'ACKNOWLEDGED' ? 'acknowledged' : 'triggered';

  // Process in parallel batches of 10 for better throughput
  const BATCH_SIZE = 10;
  for (let i = 0; i < readyToRetry.length; i += BATCH_SIZE) {
    const batch = readyToRetry.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async notification => {
        try {
          // Update status to PENDING
          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: 'PENDING',
              failedAt: null,
              errorMsg: null,
            },
          });

          let result: { success: boolean; error?: string } = {
            success: false,
            error: 'Unknown channel',
          };

          const eventType = getEventType(notification.incident?.status);

          // Re-dispatch based on channel
          switch (notification.channel) {
            case 'EMAIL':
              result = await emailModule.sendIncidentEmail(
                notification.userId,
                notification.incidentId,
                eventType
              );
              break;
            case 'SMS':
              result = await smsModule.sendIncidentSMS(
                notification.userId,
                notification.incidentId,
                eventType
              );
              break;
            case 'PUSH':
              result = await pushModule.sendIncidentPush(
                notification.userId,
                notification.incidentId,
                eventType
              );
              break;
            default:
              result = {
                success: false,
                error: `Retry not implemented for channel: ${notification.channel}`,
              };
          }

          if (result.success) {
            await prisma.notification.update({
              where: { id: notification.id },
              data: {
                status: 'SENT',
                sentAt: new Date(),
              },
            });
            logger.info('notification.retry.success', {
              notificationId: notification.id,
              channel: notification.channel,
            });
            return { success: true };
          } else {
            await prisma.notification.update({
              where: { id: notification.id },
              data: {
                status: 'FAILED',
                failedAt: new Date(),
                errorMsg: result.error || 'Retry failed',
                attempts: (notification.attempts || 0) + 1,
              },
            });
            return { success: false };
          }
        } catch (error: any) {
          logger.error('notification.retry.error', {
            notificationId: notification.id,
            error: error.message,
          });

          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: 'FAILED',
              failedAt: new Date(),
              errorMsg: error.message,
              attempts: (notification.attempts || 0) + 1,
            },
          });
          return { success: false };
        }
      })
    );

    // Count successes and failures from batch
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        succeeded++;
      } else {
        failed++;
      }
    }
  }

  return {
    retried: failedNotifications.length,
    succeeded,
    failed,
  };
}

/**
 * Get notification retry statistics
 */
export async function getNotificationRetryStats(): Promise<{
  pending: number;
  failed: number;
  failedRecent: number; // Failed in last 24 hours
}> {
  const [pending, failed, failedRecent] = await Promise.all([
    prisma.notification.count({
      where: { status: 'PENDING' },
    }),
    prisma.notification.count({
      where: { status: 'FAILED' },
    }),
    prisma.notification.count({
      where: {
        status: 'FAILED',
        failedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return { pending, failed, failedRecent };
}

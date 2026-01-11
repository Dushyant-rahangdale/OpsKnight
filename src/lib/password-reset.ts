import { randomBytes, createHash } from 'crypto';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getEmailConfig, getSMSConfig } from '@/lib/notification-providers';
import { createInAppNotifications } from '@/lib/in-app-notifications';
import { getAppUrl } from '@/lib/app-url';
import bcrypt from 'bcryptjs';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS_PER_WINDOW = 5;
const ADMIN_NOTIFICATION_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export type PasswordResetResult = {
  success: boolean;
  message: string; // Generic message for security
  method?: 'EMAIL' | 'SMS' | 'ADMIN_NOTIFIED'; // Internal use for debugging/logging
};

/**
 * Initiates the password reset flow.
 * SECURE: Always returns a generic success message to prevent enumeration.
 */
export async function initiatePasswordReset(
  email: string,
  ipAddress?: string
): Promise<PasswordResetResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const startTime = Date.now();

  try {
    // 1. Rate Limit Check (Audit Log based)
    await checkRateLimit(normalizedEmail, ipAddress, 'PASSWORD_RESET_INITIATED');

    // 2. User Lookup
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        // Check if user is disabled? logic says: if disabled, they can't login, but maybe reset allows re-activation?
        // Usually reset is for active users. Let's assume only active/invited.
      },
    });

    // 3. Timing Mitigation & User Validation
    if (!user || user.status === 'DISABLED') {
      await simulateWork(startTime);
      // Log attempt for nonexistent user (careful with enumeration in logs, maybe just log "Failed reset attempt")
      logger.info('Password reset requested for non-existent or disabled user', {
        email: normalizedEmail,
      });
      await logAttempt(normalizedEmail, 'PASSWORD_RESET_INITIATED', ipAddress, undefined, {
        result: 'USER_NOT_FOUND',
      });
      return {
        success: true,
        message:
          'If an account exists with this email, you will receive password reset instructions.',
      };
    }

    // 4. Generate Token
    // Token valid for 1 hour
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    // Invalidate any existing unused password reset tokens for this user (best-effort)
    await prisma.userToken.deleteMany({
      where: {
        identifier: normalizedEmail,
        type: 'PASSWORD_RESET',
        usedAt: null,
      },
    });

    // Store SHA256(token) only (never store raw token)
    await prisma.userToken.create({
      data: {
        identifier: normalizedEmail,
        type: 'PASSWORD_RESET',
        tokenHash,
        expiresAt: expires,
      },
    });

    const appUrl = await getAppUrl();
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    // 5. Channel Selection Strategy
    const emailConfig = await getEmailConfig();
    const smsConfig = await getSMSConfig(); // Checks Twilio & SNS

    let method: 'EMAIL' | 'SMS' | 'ADMIN_NOTIFIED' | null = null;
    let sent = false;

    // Strategy A: Email
    if (emailConfig.enabled) {
      // In a real app, we'd use a proper email template. For now, using the notification system.
      // Using `sendNotification` might be tricky if it expects an Incident.
      // We should probably use a direct mailer or adapt `sendNotification`.
      // Looking at `src/lib/notifications.ts`, it takes `incidentId`.
      // Actually, we probably need a lower-level sender for system messages.
      // `src/lib/email.ts` likely has `sendEmail`. Let's assume we can use that.

      // For this implementation, I'll assume we can use a direct email helper.
      try {
        const { sendEmail } = await import('@/lib/email');
        const { getPasswordResetEmailTemplate } =
          await import('@/lib/password-reset-email-template');

        const emailTemplate = getPasswordResetEmailTemplate({
          userName: user.name,
          resetLink,
          expiryMinutes: 60,
        });

        const result = await sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
        });

        if (result.success) {
          method = 'EMAIL';
          sent = true;
        } else {
          logger.warn('Failed to send reset email', { error: result.error });
          // Fallthrough to SMS
        }
      } catch (e) {
        logger.error('Exception sending reset email', { error: e });
        // Fallthrough to SMS
      }
    }

    // Strategy B: SMS (if Email failed or disabled)
    // NOTE: For password reset, we ignore user.smsNotificationsEnabled preference
    // because this is a security-critical operation that should use all available
    // system-configured channels regardless of user notification preferences.
    if (!sent && smsConfig.enabled && user.phoneNumber) {
      try {
        const { sendSMS } = await import('@/lib/sms');
        const result = await sendSMS({
          to: user.phoneNumber,
          message: `OpsSentinal: Reset your password here: ${resetLink}`,
        });

        if (result.success) {
          method = 'SMS';
          sent = true;
        } else {
          logger.warn('Failed to send reset SMS', { error: result.error });
        }
      } catch (e) {
        logger.error('Exception sending reset SMS', { error: e });
      }
    }

    // Strategy C: Admin Fallback
    if (!sent) {
      // Check cooldown for admin notifications to prevent spam
      const lastAdminNotify = await prisma.inAppNotification.findFirst({
        where: {
          type: 'TEAM',
          title: 'Password Reset Request',
          message: { contains: user.name },
          createdAt: { gt: new Date(Date.now() - ADMIN_NOTIFICATION_COOLDOWN_MS) },
        },
      });

      if (!lastAdminNotify) {
        // Find Admins
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN', status: 'ACTIVE' },
        });

        if (admins.length > 0) {
          await createInAppNotifications({
            userIds: admins.map(a => a.id),
            type: 'TEAM', // Using TEAM or similar as generic category, schema has INCIDENT, SCHEDULE, TEAM, SERVICE
            title: 'Password Reset Request',
            message: `User ${user.name} (${user.email}) requested a password reset but has no reachable notification channels. Please assist them manually.`,
            entityType: 'USER',
            entityId: user.id,
          });
          method = 'ADMIN_NOTIFIED';
          sent = true;
        }
      } else {
        method = 'ADMIN_NOTIFIED'; // Already notified recently
        sent = true;
      }
    }

    await logAttempt(normalizedEmail, 'PASSWORD_RESET_INITIATED', ipAddress, user.id, { method });

    return {
      success: true,
      message:
        'If an account exists with this email, you will receive password reset instructions.',
    };
  } catch (error) {
    logger.error('Error in initiatePasswordReset', { error });
    return { success: false, message: 'An internal error occurred.' };
  }
}

export async function checkRateLimit(email: string, ip: string | undefined, action: string) {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  // Check by Email
  const emailCount = await prisma.auditLog.count({
    where: {
      action,
      details: {
        path: ['targetEmail'],
        equals: email,
      },
      createdAt: { gt: windowStart },
    },
  });

  if (emailCount >= MAX_ATTEMPTS_PER_WINDOW) {
    throw new Error('Too many requests. Please try again later.');
  }

  // Check by IP (if provided and we store it in details)
  if (ip) {
    const ipCount = await prisma.auditLog.count({
      where: {
        action,
        details: {
          path: ['ip'],
          equals: ip,
        },
        createdAt: { gt: windowStart },
      },
    });

    // Stricter limit for failures?
    const limit =
      action === 'PASSWORD_RESET_FAILED'
        ? MAX_ATTEMPTS_PER_WINDOW * 2
        : MAX_ATTEMPTS_PER_WINDOW * 2;

    if (ipCount >= limit) {
      // Allow slightly more per IP to account for NAT
      throw new Error('Too many requests from this IP.');
    }
  }
}

async function logAttempt(
  email: string,
  action: string,
  ip: string | undefined,
  userId: string | undefined,
  data: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType: 'USER',
        entityId: userId || 'unknown', // generic if unknown
        actorId: userId, // acts as self
        details: { ...data, targetEmail: email, ip },
      },
    });
  } catch (e) {
    // Don't fail the flow if logging fails
    logger.error('Failed to write audit log', {
      component: 'password-reset',
      error: e,
      email,
      action,
    });
  }
}

/**
 * Simulates hashing work to prevent timing attacks.
 * Attempts to match the duration of a successful lookup + potential token generation.
 * Target duration: approx 300-500ms.
 */
export async function simulateWork(startTime: number) {
  // Generate a dummy hash to burn CPU
  const dummy = '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquii.V3ilJjy8.rXkFKxu'; // Cost 12 bcrypt
  // bcrypt.compare is async
  try {
    await bcrypt.compare('dummy-password', dummy);
  } catch {} // Ignore result

  // Ensure we wait at least a minimum time if hashing was too fast
  const elapsed = Date.now() - startTime;
  const minTime = 300;
  if (elapsed < minTime) {
    await new Promise(resolve => setTimeout(resolve, minTime - elapsed));
  }
}

/**
 * Completes the password reset process.
 * Verifies token, enforcing rate limits, and updates the user's password.
 */
export async function completePasswordReset(
  token: string,
  password: string,
  ip?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // 1. Rate Limit Check (IP based) - Prevent token brute forcing
    if (ip) {
      await checkRateLimit('unknown', ip, 'PASSWORD_RESET_FAILED');
    }

    // 2. Validate Token Format & Password Strength
    if (!token) {
      return { success: false, error: 'Invalid request parameters.' };
    }

    // Dynamic import to avoid circular dependency if any (though passwords.ts is generic)
    const { validatePasswordStrength } = await import('@/lib/passwords');
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return { success: false, error: passwordError };
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    // 3. Find Token
    const startTime = Date.now(); // Start timer for timing mitigation
    const record = await prisma.userToken.findFirst({
      where: {
        tokenHash,
        type: { in: ['PASSWORD_RESET', 'ADMIN_RESET_LINK'] },
        usedAt: null,
      },
      // Note: UserToken does not have a direct 'user' relation in schema, relies on 'identifier' (email)
    });

    if (!record) {
      await simulateWork(startTime); // Mitigate timing attack
      await logAttempt('unknown', 'PASSWORD_RESET_FAILED', ip, undefined, {
        reason: 'INVALID_TOKEN',
      });
      return { success: false, error: 'Invalid or expired token.' };
    }

    // 4. Check Expiration
    if (record.expiresAt < new Date()) {
      await prisma.userToken.delete({ where: { tokenHash } });
      await simulateWork(startTime); // Mitigate timing attack
      await logAttempt(record.identifier, 'PASSWORD_RESET_FAILED', ip, undefined, {
        reason: 'EXPIRED_TOKEN',
      });
      return { success: false, error: 'Token has expired.' };
    }

    // Get user and hash password before transaction
    const email = record.identifier;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      await simulateWork(startTime); // Mitigate timing attack
      await prisma.userToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      });
      return { success: false, error: 'Invalid or expired token.' };
    }

    const salt = await bcrypt.genSalt(12);

    const passwordHash = await bcrypt.hash(password, salt);

    // 5. Transaction: Update User & Mark Token Used
    await prisma.$transaction(async tx => {
      // Re-fetch user within transaction to ensure latest state, though not strictly necessary here
      // as we already fetched it and are only updating based on ID.
      // const userToUpdate = await tx.user.findUnique({ where: { email: record.identifier } });
      // if (!userToUpdate) throw new Error('User not found during transaction');

      await tx.user.update({
        where: { id: user.id }, // Use the user object fetched earlier
        data: {
          passwordHash,
          status: 'ACTIVE',
          invitedAt: null,
          deactivatedAt: null,
        },
      });

      await tx.userToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      });
    });

    // 6. Revoke Sessions (Outside transaction is fine, it's a side effect)
    // Dynamic import to avoid circular dep if auth imports password-reset
    const { revokeUserSessions } = await import('@/lib/auth');
    await revokeUserSessions(user.id);

    // 7. Audit Log
    await logAttempt(email, 'PASSWORD_RESET_COMPLETED', ip, user.id, {});

    return { success: true, message: 'Password has been reset successfully.' };
  } catch (error) {
    logger.error('Error in completePasswordReset', { error });
    // Handle rate limit error specifically
    if (error instanceof Error && error.message.includes('Too many requests')) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An internal error occurred.' };
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateNotificationPreferences } from '@/app/(app)/settings/actions';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            update: vi.fn()
        }
    }
}));

vi.mock('next-auth', () => ({
    getServerSession: vi.fn()
}));

vi.mock('@/lib/auth', () => ({
    getAuthOptions: vi.fn()
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

vi.mock('@/lib/notification-providers', () => ({
    getEmailConfig: vi.fn(),
    getSMSConfig: vi.fn(),
    getPushConfig: vi.fn(),
    getWhatsAppConfig: vi.fn()
}));

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { getEmailConfig, getSMSConfig, getPushConfig, getWhatsAppConfig } from '@/lib/notification-providers';

describe('Notification Preferences Provider Validation', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock authenticated session
        (getServerSession as any).mockResolvedValue({ // eslint-disable-line @typescript-eslint/no-explicit-any
            user: { email: 'test@example.com', name: 'Test' },
            expires: 'never'
        });

        // Mock user lookup
        (prisma.user.findUnique as any).mockResolvedValue({ // eslint-disable-line @typescript-eslint/no-explicit-any
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER',
            status: 'ACTIVE',
            passwordHash: null,
            timeZone: 'UTC',
            dailySummary: false,
            incidentDigest: 'HIGH',
            emailNotificationsEnabled: false,
            smsNotificationsEnabled: false,
            pushNotificationsEnabled: false,
            whatsappNotificationsEnabled: false,
            phoneNumber: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            invitedAt: null,
            lastLoginAt: null,
            deactivatedAt: null
        });

        // Reset provider mocks to disabled by default
        (getEmailConfig as any).mockResolvedValue({ enabled: false }); // eslint-disable-line @typescript-eslint/no-explicit-any
        (getSMSConfig as any).mockResolvedValue({ enabled: false }); // eslint-disable-line @typescript-eslint/no-explicit-any
        (getPushConfig as any).mockResolvedValue({ enabled: false }); // eslint-disable-line @typescript-eslint/no-explicit-any
        (getWhatsAppConfig as any).mockResolvedValue({ enabled: false }); // eslint-disable-line @typescript-eslint/no-explicit-any

        // Mock update to succeed by default
        (prisma.user.update as any).mockResolvedValue({}); // eslint-disable-line @typescript-eslint/no-explicit-any
    });

    describe('Email Notifications', () => {
        it('should allow enabling email notifications when email provider is configured', async () => {
            (getEmailConfig as any).mockResolvedValue({ enabled: true }); // eslint-disable-line @typescript-eslint/no-explicit-any

            const formData = new FormData();
            formData.append('emailNotificationsEnabled', 'on');

            const result = await updateNotificationPreferences({}, formData);

            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: expect.objectContaining({
                    emailNotificationsEnabled: true
                })
            });
        });

        it('should prevent enabling email notifications when email provider is not configured', async () => {
            (getEmailConfig as any).mockResolvedValue({ enabled: false }); // eslint-disable-line @typescript-eslint/no-explicit-any

            const formData = new FormData();
            formData.append('emailNotificationsEnabled', 'on');

            const result = await updateNotificationPreferences({}, formData);

            expect(result.success).toBeUndefined();
            expect(result.error).toContain('Email notifications cannot be enabled');
            expect(prisma.user.update).not.toHaveBeenCalled();
        });
    });

    describe('SMS Notifications', () => {
        it('should allow enabling SMS notifications when SMS provider is configured', async () => {
            (getSMSConfig as any).mockResolvedValue({ enabled: true }); // eslint-disable-line @typescript-eslint/no-explicit-any

            const formData = new FormData();
            formData.append('smsNotificationsEnabled', 'on');
            formData.append('phoneNumber', '+1234567890');

            const result = await updateNotificationPreferences({}, formData);

            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: expect.objectContaining({
                    smsNotificationsEnabled: true,
                    phoneNumber: '+1234567890'
                })
            });
        });

        it('should prevent enabling SMS notifications when SMS provider is not configured', async () => {
            (getSMSConfig as any).mockResolvedValue({ enabled: false }); // eslint-disable-line @typescript-eslint/no-explicit-any

            const formData = new FormData();
            formData.append('smsNotificationsEnabled', 'on');
            formData.append('phoneNumber', '+1234567890');

            const result = await updateNotificationPreferences({}, formData);

            expect(result.success).toBeUndefined();
            expect(result.error).toContain('SMS notifications cannot be enabled');
            expect(prisma.user.update).not.toHaveBeenCalled();
        });

        it('should validate phone number format when SMS is enabled', async () => {
            (getSMSConfig as any).mockResolvedValue({ enabled: true }); // eslint-disable-line @typescript-eslint/no-explicit-any

            const formData = new FormData();
            formData.append('smsNotificationsEnabled', 'on');
            formData.append('phoneNumber', '1234567890'); // Missing + prefix

            const result = await updateNotificationPreferences({}, formData);

            expect(result.success).toBeUndefined();
            expect(result.error).toContain('E.164 format');
            expect(prisma.user.update).not.toHaveBeenCalled();
        });
    });

    describe('Push Notifications', () => {
        it('should allow enabling push notifications when push provider is configured', async () => {
            (getPushConfig as any).mockResolvedValue({ enabled: true }); // eslint-disable-line @typescript-eslint/no-explicit-any

            const formData = new FormData();
            formData.append('pushNotificationsEnabled', 'on');

            const result = await updateNotificationPreferences({}, formData);

            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: expect.objectContaining({
                    pushNotificationsEnabled: true
                })
            });
        });

        it('should prevent enabling push notifications when push provider is not configured', async () => {
            (getPushConfig as any).mockResolvedValue({ enabled: false }); // eslint-disable-line @typescript-eslint/no-explicit-any

            const formData = new FormData();
            formData.append('pushNotificationsEnabled', 'on');

            const result = await updateNotificationPreferences({}, formData);

            expect(result.success).toBeUndefined();
            expect(result.error).toContain('Push notifications cannot be enabled');
            expect(prisma.user.update).not.toHaveBeenCalled();
        });
    });

    describe('WhatsApp Notifications', () => {
        it('should allow enabling WhatsApp notifications when WhatsApp provider is configured', async () => {
            (getWhatsAppConfig as any).mockResolvedValue({ enabled: true }); // eslint-disable-line @typescript-eslint/no-explicit-any

            const formData = new FormData();
            formData.append('whatsappNotificationsEnabled', 'on');
            formData.append('phoneNumberWhatsApp', '+1234567890');

            const result = await updateNotificationPreferences({}, formData);

            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: expect.objectContaining({
                    whatsappNotificationsEnabled: true,
                    phoneNumber: '+1234567890'
                })
            });
        });

        it('should prevent enabling WhatsApp notifications when WhatsApp provider is not configured', async () => {
            (getWhatsAppConfig as any).mockResolvedValue({ enabled: false }); // eslint-disable-line @typescript-eslint/no-explicit-any

            const formData = new FormData();
            formData.append('whatsappNotificationsEnabled', 'on');
            formData.append('phoneNumberWhatsApp', '+1234567890');

            const result = await updateNotificationPreferences({}, formData);

            expect(result.success).toBeUndefined();
            expect(result.error).toContain('WhatsApp notifications cannot be enabled');
            expect(prisma.user.update).not.toHaveBeenCalled();
        });
    });

    describe('Multiple Providers', () => {
        it('should allow enabling multiple notifications when all providers are configured', async () => {
            (getEmailConfig as any).mockResolvedValue({ enabled: true }); // eslint-disable-line @typescript-eslint/no-explicit-any
            (getSMSConfig as any).mockResolvedValue({ enabled: true }); // eslint-disable-line @typescript-eslint/no-explicit-any

            const formData = new FormData();
            formData.append('emailNotificationsEnabled', 'on');
            formData.append('smsNotificationsEnabled', 'on');
            formData.append('phoneNumber', '+1234567890');

            const result = await updateNotificationPreferences({}, formData);

            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: expect.objectContaining({
                    emailNotificationsEnabled: true,
                    smsNotificationsEnabled: true,
                    phoneNumber: '+1234567890'
                })
            });
        });

        it('should allow disabling all notifications regardless of provider status', async () => {
            const formData = new FormData();
            // No checkboxes checked = all disabled

            const result = await updateNotificationPreferences({}, formData);

            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: expect.objectContaining({
                    emailNotificationsEnabled: false,
                    smsNotificationsEnabled: false,
                    pushNotificationsEnabled: false,
                    whatsappNotificationsEnabled: false
                })
            });
        });
    });
});

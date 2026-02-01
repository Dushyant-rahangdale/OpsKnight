import { vi, describe, it, expect, beforeEach } from 'vitest';
import prisma from '../../src/lib/prisma';
import {
  updateProfile,
  updatePreferences,
  updateNotificationPreferences,
  createApiKey,
} from '../../src/app/(app)/settings/actions';
import * as auth from '../../src/lib/auth';
import * as nextAuth from 'next-auth';
import * as notificationProviders from '../../src/lib/notification-providers';

// Mock dependencies
vi.mock('../../src/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    apiKey: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    userAvatar: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('../../src/lib/auth', () => ({
  getAuthOptions: vi.fn(),
  revokeUserSessions: vi.fn(),
}));

vi.mock('../../src/lib/notification-providers', () => ({
  getEmailConfig: vi.fn(),
  getSMSConfig: vi.fn(),
  getPushConfig: vi.fn(),
  getWhatsAppConfig: vi.fn(),
}));

describe('Settings Actions', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (nextAuth.getServerSession as any).mockResolvedValue({ user: { email: mockUser.email } });
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (auth.getAuthOptions as any).mockReturnValue({});
  });

  describe('updateProfile', () => {
    it('should update profile name', async () => {
      const formData = new FormData();
      formData.append('name', 'New Name');

      const result = await updateProfile({}, formData);

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { name: 'New Name' },
      });
    });

    it('should return error for invalid file type', async () => {
      const formData = new FormData();
      const blob = new Blob(['test content'], { type: 'text/plain' });
      formData.append('avatar', blob, 'test.txt');

      const result = await updateProfile({}, formData);

      expect(result.error).toContain('Invalid file type');
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const formData = new FormData();
      formData.append('timeZone', 'Europe/London');
      formData.append('dailySummary', 'on');
      formData.append('incidentDigest', 'ALL');

      const result = await updatePreferences({}, formData);

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          timeZone: 'Europe/London',
          dailySummary: true,
          incidentDigest: 'ALL',
        }),
      });
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should validate provider availability', async () => {
      (notificationProviders.getEmailConfig as any).mockResolvedValue({ enabled: false });

      const formData = new FormData();
      formData.append('emailNotificationsEnabled', 'on');

      const result = await updateNotificationPreferences({}, formData);

      expect(result.error).toContain('Email notifications cannot be enabled');
    });

    it('should update valid preferences', async () => {
      (notificationProviders.getEmailConfig as any).mockResolvedValue({ enabled: true });
      (notificationProviders.getSMSConfig as any).mockResolvedValue({ enabled: false });
      (notificationProviders.getPushConfig as any).mockResolvedValue({ enabled: false });
      (notificationProviders.getWhatsAppConfig as any).mockResolvedValue({ enabled: false });

      const formData = new FormData();
      formData.append('emailNotificationsEnabled', 'on');

      const result = await updateNotificationPreferences({}, formData);

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          emailNotificationsEnabled: true,
        }),
      });
    });
  });

  describe('createApiKey', () => {
    it('should create API key', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Key');
      formData.append('scopes', 'incidents:read');

      const result = await createApiKey({}, formData);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(prisma.apiKey.create).toHaveBeenCalled();
    });
  });
});

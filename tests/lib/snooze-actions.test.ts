import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import prisma from '../../src/lib/prisma';
import {
  snoozeIncidentWithDuration,
  processAutoUnsnooze,
} from '../../src/app/(app)/incidents/snooze-actions';
import * as rbac from '../../src/lib/rbac';
import * as queue from '../../src/lib/jobs/queue';
import * as userNotifications from '../../src/lib/user-notifications';

// Mock dependencies
vi.mock('../../src/lib/prisma', () => ({
  default: {
    incident: {
      update: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('../../src/lib/jobs/queue', () => ({
  scheduleAutoUnsnooze: vi.fn(),
}));

vi.mock('../../src/lib/user-notifications', () => ({
  sendIncidentNotifications: vi.fn(),
}));

vi.mock('../../src/lib/status-page-notifications', () => ({
  notifyStatusPageSubscribers: vi.fn(),
}));

vi.mock('../../src/lib/status-page-webhooks', () => ({
  triggerWebhooksForService: vi.fn(),
}));

describe('Snooze Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('snoozeIncidentWithDuration', () => {
    it('should snooze incident and schedule unsnooze job', async () => {
      vi.spyOn(rbac, 'assertResponderOrAbove').mockResolvedValue({
        id: 'user-1',
        role: 'ADMIN',
        email: 'test@example.com',
        name: 'Test',
        timeZone: 'UTC',
      } as any);
      vi.spyOn(rbac, 'getCurrentUser').mockResolvedValue({ id: 'user-1', name: 'User 1' } as any);

      const incidentId = 'inc-1';
      const durationMinutes = 60;

      await snoozeIncidentWithDuration(incidentId, durationMinutes, 'Lunch break');

      expect(prisma.incident.update).toHaveBeenCalledWith({
        where: { id: incidentId },
        data: expect.objectContaining({
          status: 'SNOOZED',
          snoozeReason: 'Lunch break',
          escalationStatus: 'PAUSED',
        }),
      });

      expect(queue.scheduleAutoUnsnooze).toHaveBeenCalled();
    });

    it('should throw error if user is unauthorized', async () => {
      vi.spyOn(rbac, 'assertResponderOrAbove').mockRejectedValue(new Error('Unauthorized'));

      await expect(snoozeIncidentWithDuration('inc-1', 60)).rejects.toThrow('Unauthorized');
    });
  });

  describe('processAutoUnsnooze', () => {
    it('should unsnooze incidents past their snooze time', async () => {
      const snoozedIncidents = [{ id: 'inc-1' }, { id: 'inc-2' }];
      (prisma.incident.findMany as any).mockResolvedValue(snoozedIncidents);
      (prisma.incident.findUnique as any).mockResolvedValue({
        id: 'inc-1',
        serviceId: 'svc-1',
        title: 'Test Incident',
        createdAt: new Date(),
        service: { id: 'svc-1', name: 'Service 1' },
        assignee: { id: 'user-1', name: 'User 1' },
      });

      const result = await processAutoUnsnooze();

      expect(prisma.incident.update).toHaveBeenCalledTimes(2);
      expect(result.processed).toBe(2);
      expect(userNotifications.sendIncidentNotifications).toHaveBeenCalled();
    });
  });
});

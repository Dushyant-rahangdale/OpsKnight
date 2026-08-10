import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateBridgeUrl, createIncidentWarRoom, postWarRoomUpdate, archiveWarRoomChannel } from '@/lib/chatops/war-room';
import prisma from '@/lib/prisma';
import * as retryModule from '@/lib/retry';

vi.mock('@/lib/prisma', () => ({
  default: {
    incident: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    chatOpsConfig: {
      findUnique: vi.fn(),
    },
    service: {
      findUnique: vi.fn(),
    },
    incidentEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/escalation', () => ({
  resolveEscalationTarget: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/slack', () => ({
  getSlackBotToken: vi.fn().mockResolvedValue('xoxb-test-token'),
  sendSlackMessageToChannel: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/env-validation', () => ({
  getBaseUrl: () => 'https://app.opsknight.com',
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/retry', () => ({
  retryFetch: vi.fn(),
}));

describe('ChatOps War-Room Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateBridgeUrl', () => {
    it('should generate Jitsi Meet URL', () => {
      const url = generateBridgeUrl('inc-12345678', 'JITSI');
      expect(url).toBe('https://meet.jit.si/opsknight-inc-12345678');
    });

    it('should return null for NONE provider', () => {
      const url = generateBridgeUrl('inc-12345678', 'NONE');
      expect(url).toBeNull();
    });

    it('should generate Zoom meeting URL with custom template or fallback', () => {
      const customUrl = generateBridgeUrl('inc-9999', 'ZOOM', 'https://zoom.us/j/1234567890');
      expect(customUrl).toBe('https://zoom.us/j/1234567890');

      const fallbackUrl = generateBridgeUrl('inc-12345678', 'ZOOM');
      expect(fallbackUrl).toBe('https://zoom.us/j/opsknight-inc-12345678');
    });

    it('should generate Google Meet URL with custom template or fallback', () => {
      const customUrl = generateBridgeUrl('inc-9999', 'GOOGLE_MEET', 'meet.google.com/abc-defg-hij');
      expect(customUrl).toBe('https://meet.google.com/abc-defg-hij');

      const fallbackUrl = generateBridgeUrl('inc-12345678', 'GOOGLE_MEET');
      expect(fallbackUrl).toBe('https://meet.google.com/lookup/opsknight-inc-12345678');
    });

    it('should return null for unknown provider without custom template', () => {
      const url = generateBridgeUrl('inc-12345678', 'UNKNOWN');
      expect(url).toBeNull();
    });
  });

  describe('createIncidentWarRoom', () => {
    it('should return error if incident is not found', async () => {
      vi.mocked(prisma.incident.findUnique).mockResolvedValue(null as any);
      const result = await createIncidentWarRoom('inc-missing');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Incident not found');
    });

    it('should return existing war-room if already created', async () => {
      vi.mocked(prisma.incident.findUnique).mockResolvedValue({
        id: 'inc-104',
        slackChannelId: 'C123456',
        slackChannelName: 'inc-104-payments',
        service: { id: 'srv-1', name: 'Payments API' },
      } as any);

      const result = await createIncidentWarRoom('inc-104');
      expect(result.success).toBe(true);
      expect(result.channelId).toBe('C123456');
    });

    it('should return error if ChatOps is disabled globally', async () => {
      vi.mocked(prisma.incident.findUnique).mockResolvedValue({
        id: 'inc-104',
        urgency: 'HIGH',
        slackChannelId: null,
        service: { id: 'srv-1', name: 'Payments API', autoCreateWarRoom: true },
      } as any);
      vi.mocked(prisma.chatOpsConfig.findUnique).mockResolvedValue({
        enabled: false,
      } as any);

      const result = await createIncidentWarRoom('inc-104');
      expect(result.success).toBe(false);
      expect(result.error).toBe('ChatOps is not enabled');
    });

    it('should return error if incident does not meet urgency threshold', async () => {
      vi.mocked(prisma.incident.findUnique).mockResolvedValue({
        id: 'inc-104',
        urgency: 'LOW',
        priority: 'P4',
        slackChannelId: null,
        service: { id: 'srv-1', name: 'Payments API', autoCreateWarRoom: true },
      } as any);
      vi.mocked(prisma.chatOpsConfig.findUnique).mockResolvedValue({
        enabled: true,
        autoCreateOnUrgency: ['HIGH'],
        autoCreateOnPriority: ['P1', 'P2'],
      } as any);

      const result = await createIncidentWarRoom('inc-104');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Incident does not meet urgency/priority threshold');
    });

    it('should successfully create Slack channel and update incident', async () => {
      vi.mocked(prisma.incident.findUnique).mockResolvedValue({
        id: 'inc-abcdef123456',
        title: 'Database Overload',
        urgency: 'HIGH',
        status: 'OPEN',
        slackChannelId: null,
        serviceId: 'srv-1',
        service: {
          id: 'srv-1',
          name: 'Database Cluster',
          autoCreateWarRoom: true,
          warRoomVideoBridge: 'JITSI',
        },
        assignee: { id: 'usr-1', name: 'Dev', email: 'dev@test.com' },
      } as any);

      vi.mocked(prisma.chatOpsConfig.findUnique).mockResolvedValue({
        enabled: true,
        channelPrefix: 'inc',
        autoCreateOnUrgency: ['HIGH'],
        autoCreateOnPriority: ['P1'],
        defaultVideoBridge: 'JITSI',
      } as any);

      vi.mocked(prisma.service.findUnique).mockResolvedValue({
        id: 'srv-1',
        policy: { steps: [] },
      } as any);

      // Mock Slack API calls (conversations.create, setTopic)
      vi.spyOn(retryModule, 'retryFetch')
        .mockResolvedValueOnce({
          json: async () => ({ ok: true, channel: { id: 'C999888', name: 'inc-123456-database-cluster' } }),
        } as any)
        .mockResolvedValueOnce({
          json: async () => ({ ok: true }),
        } as any);

      vi.mocked(prisma.incident.update).mockResolvedValue({} as any);
      vi.mocked(prisma.incidentEvent.create).mockResolvedValue({} as any);

      const result = await createIncidentWarRoom('inc-abcdef123456');
      expect(result.success).toBe(true);
      expect(result.channelId).toBe('C999888');
      expect(result.warRoomUrl).toBe('https://meet.jit.si/opsknight-inc-ef123456');
      expect(prisma.incident.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inc-abcdef123456' },
          data: expect.objectContaining({
            slackChannelId: 'C999888',
          }),
        })
      );
    });
  });

  describe('postWarRoomUpdate', () => {
    it('should return error if no channel is linked', async () => {
      vi.mocked(prisma.incident.findUnique).mockResolvedValue({
        slackChannelId: null,
      } as any);

      const result = await postWarRoomUpdate('inc-104', 'Test note');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No war-room channel for this incident');
    });

    it('should post message to Slack channel', async () => {
      vi.mocked(prisma.incident.findUnique).mockResolvedValue({
        slackChannelId: 'C123',
        serviceId: 'srv-1',
      } as any);

      vi.spyOn(retryModule, 'retryFetch').mockResolvedValue({
        json: async () => ({ ok: true }),
      } as any);

      const result = await postWarRoomUpdate('inc-104', 'Updating database parameters');
      expect(result.success).toBe(true);
    });
  });

  describe('archiveWarRoomChannel', () => {
    it('should return error if no channel exists', async () => {
      vi.mocked(prisma.incident.findUnique).mockResolvedValue({
        slackChannelId: null,
      } as any);

      const result = await archiveWarRoomChannel('inc-104');
      expect(result.success).toBe(false);
    });

    it('should archive channel when archiveOnResolve is enabled', async () => {
      vi.mocked(prisma.incident.findUnique).mockResolvedValue({
        slackChannelId: 'C123',
        slackChannelName: 'inc-104-payments',
        serviceId: 'srv-1',
      } as any);

      vi.mocked(prisma.chatOpsConfig.findUnique).mockResolvedValue({
        archiveOnResolve: true,
      } as any);

      vi.spyOn(retryModule, 'retryFetch').mockResolvedValue({
        json: async () => ({ ok: true }),
      } as any);

      vi.mocked(prisma.incidentEvent.create).mockResolvedValue({} as any);

      const result = await archiveWarRoomChannel('inc-104');
      expect(result.success).toBe(true);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { transformPagerDutyToEvent } from '@/lib/integrations/pagerduty';
import { PagerDutyEventSchema, validatePayload } from '@/lib/integrations/schemas';

describe('PagerDuty Events API v2 Emulation', () => {
  it('should parse a standard PagerDuty v2 trigger event', () => {
    const payload = {
      routing_key: 'pd-sample-key-1234',
      event_action: 'trigger' as const,
      dedup_key: 'srv01/disk-space-low',
      client: 'Monitoring Service',
      client_url: 'https://monitoring.service.com',
      payload: {
        summary: 'Disk space on /dev/sda1 is below 10%',
        source: 'prod-server-01',
        severity: 'critical' as const,
        timestamp: '2026-08-17T12:00:00.000Z',
        component: 'disk',
        group: 'storage',
        class: 'capacity',
        custom_details: {
          free_bytes: 1048576,
          total_bytes: 107374182400,
        },
      },
    };

    const validation = validatePayload(PagerDutyEventSchema, payload);
    expect(validation.success).toBe(true);

    const event = transformPagerDutyToEvent(payload);
    expect(event.event_action).toBe('trigger');
    expect(event.dedup_key).toBe('srv01/disk-space-low');
    expect(event.payload.severity).toBe('critical');
    expect(event.payload.source).toBe('prod-server-01');
    expect(event.payload.summary).toBe('Disk space on /dev/sda1 is below 10%');
    expect(event.payload.custom_details.group).toBe('storage');
  });

  it('should handle acknowledge event', () => {
    const payload = {
      routing_key: 'pd-sample-key-1234',
      event_action: 'acknowledge' as const,
      dedup_key: 'srv01/disk-space-low',
      payload: {
        summary: 'Disk space on /dev/sda1 is below 10%',
      },
    };

    const event = transformPagerDutyToEvent(payload);
    expect(event.event_action).toBe('acknowledge');
    expect(event.dedup_key).toBe('srv01/disk-space-low');
  });

  it('should handle resolve event', () => {
    const payload = {
      routing_key: 'pd-sample-key-1234',
      event_action: 'resolve' as const,
      dedup_key: 'srv01/disk-space-low',
      payload: {
        summary: 'Disk space on /dev/sda1 is recovered',
      },
    };

    const event = transformPagerDutyToEvent(payload);
    expect(event.event_action).toBe('resolve');
    expect(event.dedup_key).toBe('srv01/disk-space-low');
  });
});

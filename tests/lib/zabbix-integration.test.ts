import { describe, it, expect } from 'vitest';
import { transformZabbixToEvent } from '@/lib/integrations/zabbix';
import { ZabbixPayloadSchema, validatePayload } from '@/lib/integrations/schemas';

describe('Zabbix Integration', () => {
  it('should validate and parse a Zabbix problem notification', () => {
    const payload = {
      event_id: '100456',
      event_name: 'Zabbix agent on prod-app-01 is unreachable',
      event_status: 'PROBLEM',
      event_value: '1',
      event_severity: 'High',
      host_name: 'prod-app-01',
      host_ip: '10.0.1.55',
      item_name: 'Agent ping',
      trigger_id: '22334',
    };

    const validation = validatePayload(ZabbixPayloadSchema, payload);
    expect(validation.success).toBe(true);

    const event = transformZabbixToEvent(payload);
    expect(event.event_action).toBe('trigger');
    expect(event.payload.severity).toBe('error');
    expect(event.payload.summary).toBe('Zabbix agent on prod-app-01 is unreachable');
    expect(event.dedup_key).toBe('zabbix-prod-app-01-22334');
    expect(event.payload.custom_details.hostIp).toBe('10.0.1.55');
  });

  it('should handle Disaster severity as critical', () => {
    const payload = {
      event_id: '100457',
      event_name: 'Disk space on /var/lib/data is critical (>99%)',
      event_status: 'PROBLEM',
      event_severity: 'Disaster',
      host_name: 'prod-db-primary',
      trigger_id: '99887',
    };

    const event = transformZabbixToEvent(payload);
    expect(event.event_action).toBe('trigger');
    expect(event.payload.severity).toBe('critical');
    expect(event.dedup_key).toBe('zabbix-prod-db-primary-99887');
  });

  it('should resolve incident when status is RESOLVED or OK', () => {
    const payload = {
      event_id: '100458',
      event_name: 'Zabbix agent on prod-app-01 is unreachable',
      event_status: 'RESOLVED',
      event_value: '0',
      host_name: 'prod-app-01',
      trigger_id: '22334',
    };

    const event = transformZabbixToEvent(payload);
    expect(event.event_action).toBe('resolve');
    expect(event.dedup_key).toBe('zabbix-prod-app-01-22334');
  });

  it('should acknowledge incident when action is ACKNOWLEDGE or UPDATE', () => {
    const payload = {
      event_id: '100459',
      event_name: 'High CPU utilization on prod-redis-01',
      action: 'ACKNOWLEDGE',
      host_name: 'prod-redis-01',
      trigger_id: '55443',
    };

    const event = transformZabbixToEvent(payload);
    expect(event.event_action).toBe('acknowledge');
    expect(event.dedup_key).toBe('zabbix-prod-redis-01-55443');
  });
});

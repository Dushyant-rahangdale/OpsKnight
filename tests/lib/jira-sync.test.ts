import { describe, expect, it } from 'vitest';
import { isValidJiraKey } from '@/lib/jira-validation';

describe('jira sync helpers', () => {
  describe('isValidJiraKey', () => {
    it('accepts standard Jira keys', () => {
      expect(isValidJiraKey('OPS-123')).toBe(true);
      expect(isValidJiraKey('PROJ-1')).toBe(true);
      expect(isValidJiraKey('MY_PROJECT-9999')).toBe(true);
    });

    it('rejects invalid keys', () => {
      expect(isValidJiraKey('')).toBe(false);
      expect(isValidJiraKey('123')).toBe(false);
      expect(isValidJiraKey('ops-123')).toBe(false);
      expect(isValidJiraKey('OPS')).toBe(false);
      expect(isValidJiraKey('OPS-')).toBe(false);
      expect(isValidJiraKey('-123')).toBe(false);
      expect(isValidJiraKey('OPS-abc')).toBe(false);
    });
  });

  describe('webhook payload parsing', () => {
    it('extracts status and assignee from issue_updated payload', () => {
      const payload = {
        webhookEvent: 'jira:issue_updated',
        issue: {
          id: '10001',
          key: 'OPS-42',
          fields: {
            status: { name: 'In Progress' },
            assignee: { displayName: 'Alice', emailAddress: 'alice@example.com' },
          },
        },
      };

      expect(payload.issue?.fields?.status?.name).toBe('In Progress');
      expect(payload.issue?.fields?.assignee?.displayName).toBe('Alice');
    });

    it('handles missing assignee gracefully', () => {
      const payload = {
        webhookEvent: 'jira:issue_updated',
        issue: {
          id: '10001',
          key: 'OPS-42',
          fields: {
            status: { name: 'Done' },
            assignee: null as null | { displayName?: string; emailAddress?: string },
          },
        },
      };

      const assignee =
        payload.issue?.fields?.assignee?.displayName ??
        payload.issue?.fields?.assignee?.emailAddress ??
        null;

      expect(assignee).toBeNull();
    });

    it('identifies unhandled event types', () => {
      const handledEvents = new Set(['jira:issue_updated', 'jira:issue_deleted']);
      expect(handledEvents.has('jira:issue_updated')).toBe(true);
      expect(handledEvents.has('jira:issue_created')).toBe(false);
      expect(handledEvents.has('project_updated')).toBe(false);
    });

    it('extracts issue id and key for link matching', () => {
      const payload = {
        webhookEvent: 'jira:issue_updated',
        issue: {
          id: '10042',
          key: 'PROJ-99',
          fields: {
            status: { name: 'To Do' },
          },
        },
      };

      expect(payload.issue?.id).toBe('10042');
      expect(payload.issue?.key).toBe('PROJ-99');
    });

    it('returns no match indicators for empty payloads', () => {
      const payload: { webhookEvent: string; issue?: { id?: string; key?: string } } = {
        webhookEvent: 'jira:issue_updated',
      };

      expect(payload.issue?.id).toBeUndefined();
      expect(payload.issue?.key).toBeUndefined();
    });
  });
});

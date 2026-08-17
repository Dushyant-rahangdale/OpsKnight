import { describe, it, expect } from 'vitest';
import { transformGitLabToEvent } from '@/lib/integrations/gitlab';
import { GitLabPayloadSchema, validatePayload } from '@/lib/integrations/schemas';
import { verifyGitLabToken } from '@/lib/integrations/signature-verification';

describe('GitLab Webhooks Integration', () => {
  it('should parse a pipeline failure event and trigger incident', () => {
    const payload = {
      object_kind: 'pipeline',
      project: {
        id: 42,
        name: 'payment-service',
        path_with_namespace: 'fintech/payment-service',
        web_url: 'https://gitlab.com/fintech/payment-service',
      },
      object_attributes: {
        id: 991,
        ref: 'main',
        status: 'failed',
      },
      ref: 'main',
      status: 'failed',
      commit: {
        id: 'abc1234',
        message: 'fix: payment retry exponential backoff',
        author: { name: 'Dev Engineer', email: 'dev@company.com' },
      },
    };

    const validation = validatePayload(GitLabPayloadSchema, payload);
    expect(validation.success).toBe(true);

    const event = transformGitLabToEvent(payload as any);
    expect(event.event_action).toBe('trigger');
    expect(event.payload.severity).toBe('error');
    expect(event.dedup_key).toBe('gitlab-fintech-payment-service-main');
    expect(event.payload.custom_details.sha).toBe('abc1234');
  });

  it('should parse a pipeline success event and resolve prior failure with matching dedup key', () => {
    const payload = {
      object_kind: 'pipeline',
      project: {
        id: 42,
        name: 'payment-service',
        path_with_namespace: 'fintech/payment-service',
        web_url: 'https://gitlab.com/fintech/payment-service',
      },
      object_attributes: {
        id: 992,
        ref: 'main',
        status: 'success',
      },
      ref: 'main',
      status: 'success',
    };

    const event = transformGitLabToEvent(payload as any);
    expect(event.event_action).toBe('resolve');
    expect(event.dedup_key).toBe('gitlab-fintech-payment-service-main');
  });

  it('should verify X-Gitlab-Token correctly', () => {
    const secret = 'gl-secret-token-123';
    expect(verifyGitLabToken('gl-secret-token-123', secret)).toBe(true);
    expect(verifyGitLabToken('wrong-token', secret)).toBe(false);
  });
});

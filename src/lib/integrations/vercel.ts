import { normalizeEventAction, normalizeSeverity, firstString } from './normalization';
import type { VercelPayload } from './schemas';

export function transformVercelToEvent(data: VercelPayload): {
  event_action: 'trigger' | 'resolve' | 'acknowledge';
  dedup_key: string;
  payload: {
    summary: string;
    source: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    custom_details: Record<string, unknown>;
  };
} {
  const eventType = (data.type || '').toLowerCase();
  const projectName =
    firstString(data.payload?.project?.name, data.payload?.deployment?.name, data.payload?.name) ||
    'vercel-project';
  const target = data.payload?.target || 'production';
  const isProduction = target === 'production';

  let event_action: 'trigger' | 'resolve' | 'acknowledge' = 'trigger';
  let severity: 'critical' | 'error' | 'warning' | 'info' = isProduction ? 'critical' : 'warning';
  let summary = `Vercel: Event on ${projectName}`;

  if (eventType.includes('deployment.error') || eventType.includes('deployment.failed')) {
    event_action = 'trigger';
    severity = isProduction ? 'critical' : 'error';
    const errMessage =
      data.payload?.error?.message || data.payload?.error?.code || 'Build or Runtime Error';
    summary = `Vercel: Deployment failed for ${projectName} (${target}) - ${errMessage}`;
  } else if (eventType.includes('deployment.canceled')) {
    event_action = 'trigger';
    severity = 'warning';
    summary = `Vercel: Deployment canceled for ${projectName} (${target})`;
  } else if (eventType.includes('deployment.succeeded') || eventType.includes('deployment.ready')) {
    event_action = 'resolve';
    severity = 'info';
    summary = `Vercel: Deployment succeeded for ${projectName} (${target})`;
  } else if (eventType.includes('domain-unverified') || eventType.includes('domain.failed')) {
    event_action = 'trigger';
    severity = 'warning';
    summary = `Vercel: Domain configuration unverified for ${projectName} (${data.payload?.domain || 'custom domain'})`;
  }

  const dedup_key = `vercel-${projectName.toLowerCase()}-${target.toLowerCase()}`;

  return {
    event_action,
    dedup_key,
    payload: {
      summary,
      source: 'Vercel',
      severity,
      custom_details: {
        eventType: data.type,
        project: projectName,
        target,
        deploymentId: data.payload?.deployment?.id,
        deploymentUrl: data.payload?.deployment?.url,
        error: data.payload?.error,
        user: data.payload?.user?.username,
        team: data.payload?.team?.slug,
        raw: data,
      },
    },
  };
}

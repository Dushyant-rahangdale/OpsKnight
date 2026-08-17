import { normalizeEventAction, normalizeSeverity, firstString } from './normalization';
import type { GitLabPayload } from './schemas';

export function transformGitLabToEvent(data: GitLabPayload): {
  event_action: 'trigger' | 'resolve' | 'acknowledge';
  dedup_key: string;
  payload: {
    summary: string;
    source: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    custom_details: Record<string, unknown>;
  };
} {
  const kind = (data.object_kind || data.event_type || 'pipeline').toLowerCase();
  const projectPath =
    firstString(data.project?.path_with_namespace, data.project?.name) || 'gitlab-project';
  const cleanProject = projectPath.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase();

  // 1. Pipeline / Build / Job Webhooks
  if (kind === 'pipeline' || kind === 'build' || kind === 'job') {
    const rawStatus =
      firstString(data.build_status, data.status, data.object_attributes?.status) || 'unknown';
    const status = rawStatus.toLowerCase();
    const ref = firstString(data.ref, 'main');

    let event_action: 'trigger' | 'resolve' | 'acknowledge' = 'trigger';
    let severity: 'critical' | 'error' | 'warning' | 'info' = 'error';

    if (status === 'success' || status === 'passed' || status === 'manual') {
      event_action = 'resolve';
      severity = 'info';
    } else if (status === 'running' || status === 'pending' || status === 'created') {
      event_action = 'acknowledge';
      severity = 'info';
    } else if (status === 'failed' || status === 'canceled') {
      event_action = 'trigger';
      severity = 'error';
    }

    const summary = `GitLab CI: Pipeline for ${projectPath} on ${ref} ${rawStatus}`;
    const dedup_key = `gitlab-${cleanProject}-${ref}`;

    return {
      event_action,
      dedup_key,
      payload: {
        summary,
        source: 'GitLab CI',
        severity,
        custom_details: {
          project: projectPath,
          ref,
          status: rawStatus,
          sha: data.sha || data.commit?.id,
          commitMessage: data.commit?.message || data.commit?.title,
          author: data.commit?.author?.name || data.user?.name,
          buildName: data.build_name,
          buildStage: data.build_stage,
          webUrl: data.project?.web_url,
          raw: data,
        },
      },
    };
  }

  // 2. Issues / Incidents / Alerts
  if (kind === 'issue' || kind === 'incident' || kind === 'alert') {
    const action = firstString(
      data.object_attributes?.action,
      data.object_attributes?.state
    )?.toLowerCase();
    const issueTitle =
      firstString(data.object_attributes?.title, data.object_attributes?.description) ||
      'GitLab Alert';
    const issueId = data.object_attributes?.id || 'alert';

    let event_action: 'trigger' | 'resolve' | 'acknowledge' = 'trigger';
    if (action === 'close' || action === 'closed' || action === 'resolved') {
      event_action = 'resolve';
    } else if (action === 'reopen' || action === 'open' || action === 'opened') {
      event_action = 'trigger';
    }

    const severity = normalizeSeverity(data.object_attributes?.severity, 'error');
    const dedup_key = `gitlab-${cleanProject}-issue-${issueId}`;

    return {
      event_action,
      dedup_key,
      payload: {
        summary: `GitLab: ${issueTitle}`,
        source: 'GitLab',
        severity,
        custom_details: {
          project: projectPath,
          issueId,
          title: data.object_attributes?.title,
          description: data.object_attributes?.description,
          url: data.object_attributes?.url,
          raw: data,
        },
      },
    };
  }

  // Default fallback for general GitLab webhooks
  const summary = `GitLab Webhook: ${projectPath} ${kind}`;
  const dedup_key = `gitlab-${cleanProject}-${kind}`;

  return {
    event_action: 'trigger',
    dedup_key,
    payload: {
      summary,
      source: 'GitLab',
      severity: 'warning',
      custom_details: {
        kind,
        project: projectPath,
        raw: data,
      },
    },
  };
}

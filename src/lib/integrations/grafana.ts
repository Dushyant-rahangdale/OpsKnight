/**
 * Grafana Integration Handler
 * Transforms Grafana alert webhooks to standard event format
 */

export type GrafanaAlert = {
  title?: string;
  message?: string;
  state?: 'alerting' | 'ok' | 'no_data' | 'pending' | 'paused';
  ruleId?: number;
  ruleName?: string;
  ruleUrl?: string;
  evalMatches?: Array<{
    metric: string;
    value: number;
    tags?: Record<string, string>;
  }>;
  tags?: Record<string, string>;
  dashboardId?: number;
  panelId?: number;
  orgId?: number;
  // Alertmanager format fields
  receiver?: string;
  groupKey?: string;
  alerts?: Array<{
    status: string;
    labels: Record<string, string>;
    annotations?: Record<string, string>;
    startsAt: string;
    endsAt?: string;
  }>;
  status?: string;
  groupLabels?: Record<string, string>;
  commonLabels?: Record<string, string>;
  commonAnnotations?: Record<string, string>;
};

export function transformGrafanaToEvent(payload: GrafanaAlert): {
  event_action: 'trigger' | 'resolve' | 'acknowledge';
  dedup_key: string;
  payload: {
    summary: string;
    source: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    custom_details: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
} {
  // Handle new Grafana alert format
  if (payload.state !== undefined || payload.ruleName) {
    const isResolved = payload.state === 'ok';
    const summary = payload.title || payload.ruleName || payload.message || 'Grafana Alert';
    // Use ruleId if available, otherwise create stable key from ruleName/title
    // Avoids Date.now() which defeats deduplication
    const dedupKey = payload.ruleId
      ? `grafana-${payload.ruleId}`
      : `grafana-${(payload.ruleName || payload.title || 'unknown').replace(/\s+/g, '-').toLowerCase()}`;

    const severity =
      payload.state === 'alerting' ? 'critical' : payload.state === 'no_data' ? 'warning' : 'info';

    return {
      event_action: isResolved ? 'resolve' : 'trigger',
      dedup_key: dedupKey,
      payload: {
        summary,
        source: 'Grafana',
        severity,
        custom_details: {
          ruleId: payload.ruleId,
          ruleName: payload.ruleName,
          ruleUrl: payload.ruleUrl,
          state: payload.state,
          message: payload.message,
          evalMatches: payload.evalMatches,
          tags: payload.tags,
          dashboardId: payload.dashboardId,
          panelId: payload.panelId,
        },
      },
    };
  }

  // Handle Prometheus Alertmanager format (Grafana can send this)
  if (payload.alerts && Array.isArray(payload.alerts)) {
    const alert = payload.alerts[0];
    if (!alert) {
      // Return acknowledge for empty alerts array instead of throwing
      // Use receiver or groupKey for stable dedup key (avoids Date.now() which defeats dedup)
      return {
        event_action: 'acknowledge' as const,
        dedup_key: `grafana-empty-${payload.receiver || payload.groupKey || 'unknown'}`,
        payload: {
          summary: 'Grafana alert received: empty alerts array',
          source: 'Grafana',
          severity: 'info' as const,
          custom_details: payload,
        },
      };
    }

    const isResolved = alert.status === 'resolved' || alert.endsAt;
    const summary =
      alert.annotations?.summary ||
      alert.annotations?.description ||
      alert.labels?.alertname ||
      'Grafana Alert';

    // Use alertname + instance for stable dedup key (avoids Date.now() which defeats dedup)
    const alertName = alert.labels?.alertname || 'alert';
    const instance = alert.labels?.instance || 'default';
    const dedupKey = `grafana-${alertName}-${instance}`.slice(0, 512);

    return {
      event_action: isResolved ? 'resolve' : 'trigger',
      dedup_key: dedupKey,
      payload: {
        summary,
        source: 'Grafana',
        severity: 'critical',
        custom_details: {
          status: payload.status,
          labels: alert.labels,
          annotations: alert.annotations,
          startsAt: alert.startsAt,
          endsAt: alert.endsAt,
          groupLabels: payload.groupLabels,
          commonLabels: payload.commonLabels,
          commonAnnotations: payload.commonAnnotations,
        },
      },
    };
  }
  // Fallback for unsupported payload formats - return acknowledge instead of throwing
  // Use title or ruleName for stable dedup key (avoids Date.now() which defeats dedup)
  return {
    event_action: 'acknowledge' as const,
    dedup_key: `grafana-unknown-${payload.title || payload.ruleName || 'fallback'}`,
    payload: {
      summary: 'Grafana event received: unknown format',
      source: 'Grafana',
      severity: 'info' as const,
      custom_details: payload,
    },
  };
}

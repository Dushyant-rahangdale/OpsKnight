'use client';

import { memo, useMemo } from 'react';

/**
 * Compact Recent Activity Widget
 * Shows last 5 incident events with relative timestamps
 */

interface RecentIncident {
  id: string;
  title: string;
  status: string;
  urgency: string;
  createdAt: Date | string;
  service?: { name: string } | null;
}

interface CompactRecentActivityProps {
  incidents: RecentIncident[];
}

/**
 * Safely parses a date value
 */
function safeParseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;

  try {
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Calculates relative time string from a date
 */
function getRelativeTime(date: Date | string | null | undefined): string {
  const parsedDate = safeParseDate(date);

  if (!parsedDate) {
    return 'Unknown';
  }

  const now = Date.now();
  const then = parsedDate.getTime();
  const diffMs = now - then;

  // Handle future dates
  if (diffMs < 0) {
    return 'Just now';
  }

  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  // For older dates, show short date
  return parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'var(--color-danger)';
    case 'ACKNOWLEDGED':
      return 'var(--color-warning)';
    case 'RESOLVED':
      return 'var(--color-success)';
    default:
      return 'var(--text-muted)';
  }
}

/**
 * CompactRecentActivity Component
 * Displays recent incident activity with status indicators
 */
const CompactRecentActivity = memo(function CompactRecentActivity({
  incidents,
}: CompactRecentActivityProps) {
  // Ensure incidents is always an array and filter out invalid entries
  const validIncidents = useMemo(() => {
    if (!Array.isArray(incidents)) return [];
    return incidents.filter(inc => inc && typeof inc === 'object' && inc.id && inc.title);
  }, [incidents]);

  if (validIncidents.length === 0) {
    return (
      <div
        className="p-3.5 rounded-sm bg-neutral-50 border border-border text-center"
        role="status"
        aria-label="No recent activity"
      >
        <div className="text-sm text-muted-foreground font-medium">No recent activity</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" role="list" aria-label="Recent activity">
      {validIncidents.slice(0, 5).map(incident => {
        const serviceName = incident.service?.name || 'Unknown';
        const relativeTime = getRelativeTime(incident.createdAt);
        const statusColor = getStatusColor(incident.status);

        return (
          <div
            key={incident.id}
            className="flex items-start gap-2 p-2 rounded-sm bg-neutral-50 border border-border"
            role="listitem"
            aria-label={`${incident.title} - ${serviceName} - ${relativeTime}`}
          >
            {/* Status indicator */}
            <div
              className="w-2 h-2 rounded-full mt-1 shrink-0"
              style={{ background: statusColor }}
              aria-hidden="true"
              title={incident.status}
            />
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium text-foreground whitespace-nowrap overflow-hidden overflow-ellipsis"
                title={incident.title}
              >
                {incident.title}
              </div>
              <div className="text-xs text-muted-foreground flex gap-2 mt-0.5 flex-wrap">
                <span
                  className="max-w-[120px] overflow-hidden overflow-ellipsis whitespace-nowrap"
                  title={serviceName}
                >
                  {serviceName}
                </span>
                <span aria-hidden="true">•</span>
                <span>{relativeTime}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default CompactRecentActivity;

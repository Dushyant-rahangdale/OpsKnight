'use client';

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
  service?: { name: string };
}

function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
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

export default function CompactRecentActivity({ incidents }: { incidents: RecentIncident[] }) {
  if (!incidents || incidents.length === 0) {
    return (
      <div
        style={{
          padding: '0.875rem',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-neutral-50)',
          border: '1px solid var(--border)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-muted)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          No recent activity
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {incidents.slice(0, 5).map(incident => (
        <div
          key={incident.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-neutral-50)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Status indicator */}
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: getStatusColor(incident.status),
              marginTop: '4px',
              flexShrink: 0,
            }}
          />
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {incident.title}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)',
                display: 'flex',
                gap: '0.5rem',
                marginTop: '2px',
              }}
            >
              <span>{incident.service?.name || 'Unknown'}</span>
              <span>•</span>
              <span>{getRelativeTime(incident.createdAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

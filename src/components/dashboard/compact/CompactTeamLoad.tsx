'use client';

/**
 * Compact Team Load Widget
 * Shows team members with active incident assignments
 */

interface AssigneeLoad {
  id: string;
  name: string;
  count: number;
}

function getLoadColor(count: number): string {
  if (count >= 5) return 'var(--color-danger)';
  if (count >= 3) return 'var(--color-warning)';
  return 'var(--color-success)';
}

export default function CompactTeamLoad({ assigneeLoad }: { assigneeLoad: AssigneeLoad[] }) {
  // Filter to only show assignees with active incidents
  const activeAssignees = assigneeLoad.filter(a => a.count > 0).slice(0, 5);

  if (activeAssignees.length === 0) {
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
          No active assignments
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
      }}
    >
      {activeAssignees.map(assignee => (
        <div
          key={assignee.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-neutral-50)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* Avatar placeholder */}
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--color-neutral-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                flexShrink: 0,
              }}
            >
              {assignee.name.charAt(0).toUpperCase()}
            </div>
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {assignee.name}
            </span>
          </div>
          {/* Count badge */}
          <div
            style={{
              padding: '0.125rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              background: getLoadColor(assignee.count),
              color: 'white',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              minWidth: '20px',
              textAlign: 'center',
            }}
          >
            {assignee.count}
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import { memo, useMemo } from 'react';

interface CompactStatsOverviewProps {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  unassignedIncidents: number;
  servicesCount: number;
}

/**
 * Safely formats a number for display
 */
function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '0';
  }
  return Math.max(0, Math.round(value)).toLocaleString();
}

/**
 * Compact Stats Overview Widget
 * Displays key incident statistics in a compact format
 */
const CompactStatsOverview = memo(function CompactStatsOverview({
  openIncidents,
  criticalIncidents,
  unassignedIncidents,
  servicesCount,
}: CompactStatsOverviewProps) {
  const stats = useMemo(
    () => [
      {
        label: 'Open',
        value: formatNumber(openIncidents),
        color: 'var(--color-info)',
        description: 'Open incidents',
      },
      {
        label: 'Critical',
        value: formatNumber(criticalIncidents),
        color: criticalIncidents > 0 ? 'var(--color-error)' : 'var(--text-muted)',
        description: 'Critical priority incidents',
      },
      {
        label: 'Unassigned',
        value: formatNumber(unassignedIncidents),
        color: unassignedIncidents > 0 ? 'var(--color-warning)' : 'var(--text-muted)',
        description: 'Unassigned incidents',
      },
      {
        label: 'Services',
        value: formatNumber(servicesCount),
        color: 'var(--text-primary)',
        description: 'Total services',
      },
    ],
    [openIncidents, criticalIncidents, unassignedIncidents, servicesCount]
  );

  return (
    <div className="flex flex-col gap-2" role="list" aria-label="Stats overview">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-2 px-3 rounded-sm bg-neutral-50 border border-border"
          role="listitem"
          aria-label={`${stat.description}: ${stat.value}`}
        >
          <span className="text-sm font-medium text-secondary-foreground">{stat.label}</span>
          <span className="text-base font-bold tabular-nums" style={{ color: stat.color }}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
});

export default CompactStatsOverview;

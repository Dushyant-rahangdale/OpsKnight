'use client';

import { memo, useMemo } from 'react';

interface CompactPerformanceMetricsProps {
  mtta: number | null;
  mttr: number | null;
  ackSlaRate: number | null;
  resolveSlaRate: number | null;
}

/**
 * Safely formats a time value in minutes to a human-readable string
 */
function formatTime(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return 'N/A';
  if (!Number.isFinite(minutes) || minutes < 0) return 'N/A';
  if (minutes < 1) return '<1m';

  const rounded = Math.round(minutes);
  if (rounded >= 60) {
    const hours = Math.floor(rounded / 60);
    const mins = rounded % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${rounded}m`;
}

/**
 * Gets the status color based on SLA compliance rate
 */
function getStatusColor(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) {
    return 'var(--text-muted)';
  }
  if (rate >= 95) return 'var(--color-success)';
  if (rate >= 80) return 'var(--color-warning)';
  return 'var(--color-error)';
}

/**
 * Safely formats a percentage value
 */
function formatPercent(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) {
    return 'N/A';
  }
  // Clamp to 0-100 range
  const clamped = Math.max(0, Math.min(100, rate));
  return `${Math.round(clamped)}%`;
}

/**
 * Compact Performance Metrics Widget
 * Displays MTTA, MTTR, and SLA compliance rates
 */
const CompactPerformanceMetrics = memo(function CompactPerformanceMetrics({
  mtta,
  mttr,
  ackSlaRate,
  resolveSlaRate,
}: CompactPerformanceMetricsProps) {
  const metrics = useMemo(
    () => [
      {
        label: 'MTTA',
        value: formatTime(mtta),
        color: 'var(--text-primary)',
        description: 'Mean Time to Acknowledge',
      },
      {
        label: 'MTTR',
        value: formatTime(mttr),
        color: 'var(--text-primary)',
        description: 'Mean Time to Resolve',
      },
      {
        label: 'ACK SLA',
        value: formatPercent(ackSlaRate),
        color: getStatusColor(ackSlaRate),
        description: 'Acknowledgment SLA Compliance',
      },
      {
        label: 'Resolve SLA',
        value: formatPercent(resolveSlaRate),
        color: getStatusColor(resolveSlaRate),
        description: 'Resolution SLA Compliance',
      },
    ],
    [mtta, mttr, ackSlaRate, resolveSlaRate]
  );

  return (
    <div className="grid grid-cols-2 gap-2.5" role="list" aria-label="Performance metrics">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className="p-2.5 px-3 rounded-sm bg-neutral-50 border border-border overflow-hidden"
          role="listitem"
          aria-label={`${metric.description}: ${metric.value}`}
        >
          <div className="text-xs text-muted-foreground font-medium mb-1.5 uppercase tracking-wide">
            {metric.label}
          </div>
          <div
            className="text-lg font-bold leading-tight overflow-hidden overflow-ellipsis tabular-nums"
            style={{ color: metric.color }}
          >
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
});

export default CompactPerformanceMetrics;

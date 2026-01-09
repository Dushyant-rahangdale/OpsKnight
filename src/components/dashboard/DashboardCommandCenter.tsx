'use client';

import React, { Suspense } from 'react';
import DashboardRefresh from '../DashboardRefresh';
import DashboardExport from '../DashboardExport';
import DashboardTimeRange from '../DashboardTimeRange';
import MetricCard from './MetricCard';
import LiveClock from './LiveClock';
import { Badge } from '@/components/ui/shadcn/badge';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type SystemStatus = {
  label: string;
  color: string;
  bg: string;
};

type DashboardCommandCenterProps = {
  systemStatus: SystemStatus;
  allOpenIncidentsCount: number;
  totalInRange: number;
  metricsOpenCount: number;
  metricsResolvedCount: number;
  unassignedCount: number;
  rangeLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incidents: any[];
  filters: Record<string, string | undefined>;
  currentPeriodAcknowledged: number;
  userTimeZone?: string;
  isClipped?: boolean;
  retentionDays?: number;
};

export default function DashboardCommandCenter({
  systemStatus,
  allOpenIncidentsCount,
  totalInRange,
  metricsOpenCount,
  metricsResolvedCount,
  unassignedCount,
  rangeLabel,
  incidents,
  filters,
  currentPeriodAcknowledged,
  userTimeZone = 'UTC',
  isClipped,
  retentionDays,
}: DashboardCommandCenterProps) {
  // Determine status badge color
  const getStatusBadgeClass = () => {
    switch (systemStatus.label) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'DEGRADED':
        return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
      case 'OPERATIONAL':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 mb-6 border border-white/10 shadow-2xl">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900 opacity-50 animate-[ambient-move_15s_ease_infinite]" />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6 mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-white [text-shadow:_0_2px_4px_rgb(0_0_0_/30%)]">
              Command Center
            </h1>
            <LiveClock timeZone={userTimeZone} />
          </div>

          {/* System Status */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/90">
            <span className="font-medium">System Status:</span>
            <Badge
              className={cn(
                'font-bold uppercase tracking-wide text-xs border animate-[breathing-glow_3s_ease-in-out_infinite]',
                getStatusBadgeClass()
              )}
              style={
                {
                  '--status-color-rgb':
                    systemStatus.label === 'CRITICAL'
                      ? '239, 68, 68'
                      : systemStatus.label === 'DEGRADED'
                        ? '245, 158, 11'
                        : '34, 197, 94',
                } as React.CSSProperties
              }
            >
              {systemStatus.label}
            </Badge>
            {allOpenIncidentsCount > 0 && (
              <span className="text-xs opacity-70">({allOpenIncidentsCount} active)</span>
            )}
            {/* Retention Warning */}
            {isClipped && (
              <Badge
                variant="outline"
                className="bg-red-500/20 text-red-300 border-red-400/30 text-xs flex items-center gap-1.5 cursor-help"
                title={`Data limited to ${retentionDays} days by retention policy`}
              >
                <AlertCircle className="h-3 w-3" />
                <span>Retention Limit: {retentionDays}d</span>
              </Badge>
            )}
          </div>

          {/* Time Range */}
          <div>
            <Suspense
              fallback={<div className="h-8 w-[300px] bg-white/10 rounded-md animate-pulse" />}
            >
              <DashboardTimeRange />
            </Suspense>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Suspense fallback={<div className="h-9 w-20 bg-white/10 rounded-md animate-pulse" />}>
            <DashboardRefresh />
          </Suspense>
          <Suspense fallback={<div className="h-9 w-24 bg-white/10 rounded-md animate-pulse" />}>
            <DashboardExport
              incidents={incidents}
              filters={filters}
              metrics={{
                totalOpen: metricsOpenCount,
                totalResolved: metricsResolvedCount,
                totalAcknowledged: currentPeriodAcknowledged,
                unassigned: unassignedCount,
              }}
            />
          </Suspense>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="TOTAL" value={totalInRange} rangeLabel={rangeLabel} isDark />
        <MetricCard label="OPEN" value={metricsOpenCount} rangeLabel={rangeLabel} isDark />
        <MetricCard label="RESOLVED" value={metricsResolvedCount} rangeLabel={rangeLabel} isDark />
        <MetricCard
          label="UNASSIGNED"
          value={unassignedCount}
          rangeLabel={isClipped ? `(Max ${retentionDays}d)` : '(ALL TIME)'}
          isDark
        />
      </div>

      <style jsx>{`
        @keyframes ambient-move {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes breathing-glow {
          0% {
            box-shadow: 0 0 0 0 rgba(var(--status-color-rgb), 0.4);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 8px 2px rgba(var(--status-color-rgb), 0.2);
            transform: scale(1.02);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(var(--status-color-rgb), 0);
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

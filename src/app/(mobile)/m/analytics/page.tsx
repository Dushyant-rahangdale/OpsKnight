import MobileCard from '@/components/mobile/MobileCard';

export const dynamic = 'force-dynamic';

export default async function MobileAnalyticsPage() {
  const { calculateSLAMetrics } = await import('@/lib/sla-server');
  const slaMetrics = await calculateSLAMetrics({
    windowDays: 7,
    includeAllTime: false,
  });

  const dayMs = 24 * 60 * 60 * 1000;
  const effectiveWindowDays = Math.max(
    1,
    Math.ceil((slaMetrics.effectiveEnd.getTime() - slaMetrics.effectiveStart.getTime()) / dayMs)
  );
  const windowLabelDays = slaMetrics.isClipped ? effectiveWindowDays : 7;
  const windowLabelSuffix = slaMetrics.isClipped ? ' (retention limit)' : '';

  const openIncidents = slaMetrics.activeIncidents;
  const incidentsInRange = slaMetrics.totalIncidents;
  const mtta = (slaMetrics.mttd || 0) * 60000; // Convert minutes to ms for formatDuration
  const mttr = (slaMetrics.mttr || 0) * 60000; // Convert minutes to ms for formatDuration

  const formatDuration = (ms: number) => {
    if (ms === 0) return '--';
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = (mins / 60).toFixed(1);
    return `${hours}h`;
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analytics
        </h1>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          Last {windowLabelDays} days{windowLabelSuffix}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MobileCard className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{openIncidents}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Open Incidents
          </div>
        </MobileCard>
        <MobileCard className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {incidentsInRange}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            New ({windowLabelDays}d)
          </div>
        </MobileCard>
        <MobileCard className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatDuration(mtta)}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            MTTA
          </div>
        </MobileCard>
        <MobileCard className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatDuration(mttr)}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            MTTR
          </div>
        </MobileCard>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
        Metrics are calculated based on the last {windowLabelDays} days of activity.
        {slaMetrics.isClipped ? ' Data is limited by retention settings.' : ''} For detailed reports
        and custom ranges, please use the desktop dashboard.
      </div>
    </div>
  );
}

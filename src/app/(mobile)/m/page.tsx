import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import {
  AlertTriangle,
  Plus,
  List,
  Phone,
  ChevronRight,
  Zap,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  ACKNOWLEDGED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  RESOLVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  SNOOZED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  SUPPRESSED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const URGENCY_STYLES: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
};

export default async function MobileDashboard() {
  const session = await getServerSession(await getAuthOptions());
  const userId = session?.user?.id;

  const { calculateSLAMetrics } = await import('@/lib/sla-server');
  const slaMetrics = await calculateSLAMetrics({ includeAllTime: true });

  const [currentOnCallShift] = await Promise.all([
    userId
      ? prisma.onCallShift.findFirst({
          where: {
            userId,
            start: { lte: new Date() },
            end: { gte: new Date() },
          },
          include: {
            schedule: { select: { name: true } },
          },
        })
      : null,
  ]);

  const openIncidents = slaMetrics.openCount;
  const criticalIncidents = slaMetrics.criticalCount;
  const acknowledgedCount = slaMetrics.acknowledgedCount;

  const resolvedToday =
    slaMetrics.trendSeries.length > 0
      ? slaMetrics.trendSeries[slaMetrics.trendSeries.length - 1].resolveCount
      : slaMetrics.manualResolvedCount + slaMetrics.autoResolvedCount;

  const incidentList = await prisma.incident.findMany({
    where: { status: { in: ['OPEN', 'ACKNOWLEDGED', 'SNOOZED', 'SUPPRESSED'] } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      urgency: true,
      createdAt: true,
      service: { select: { name: true } },
    },
  });

  const userName = session?.user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex flex-col gap-5 p-4 pb-24">
      {/* Greeting Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {greeting}, {userName}!
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Here&apos;s your incident overview
        </p>
        <div className="p-2 bg-yellow-100 text-yellow-800 text-xs font-mono rounded border border-yellow-200">
          DEBUG: Found {incidentList.length} incidents. IDs:{' '}
          {incidentList.map(i => i.id.substring(0, 4)).join(', ')}
        </div>
      </div>

      {/* On-Call Widget */}
      {currentOnCallShift && (
        <Link
          href={`/m/schedules/${currentOnCallShift.scheduleId}`}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 dark:from-emerald-700 dark:to-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/30 transition-all active:scale-[0.98]"
        >
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur-sm dark:bg-slate-900/60">
              <Phone className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-bold">You&apos;re On-Call</div>
              <div className="text-xs font-medium text-emerald-100 opacity-90">
                {currentOnCallShift.schedule.name} • Until {formatShiftEnd(currentOnCallShift.end)}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-100 opacity-70 transition-transform group-hover:translate-x-1" />
          </div>
          <div className="absolute -right-4 -top-12 h-24 w-24 rounded-full border-[3px] border-emerald-400/20" />
          <div className="absolute -right-8 -top-16 h-32 w-32 rounded-full border-[3px] border-emerald-400/10" />
        </Link>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/m/incidents/create"
          className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-sm transition-all active:scale-[0.98] active:bg-slate-50 dark:active:bg-slate-800"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 text-primary">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">New Incident</span>
        </Link>
        <Link
          href="/m/incidents"
          className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-sm transition-all active:scale-[0.98] active:bg-slate-50 dark:active:bg-slate-800"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <List className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">View All</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Open Incidents */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {openIncidents}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Open
          </div>
        </div>

        {/* Critical */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 to-red-600" />
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {criticalIncidents}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Critical
          </div>
        </div>

        {/* Acknowledged */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {acknowledgedCount}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Acknowledged
          </div>
        </div>

        {/* Resolved */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {resolvedToday}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Resolved
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recent Incidents
          </h2>
          <Link
            href="/m/incidents"
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            See all →
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {incidentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">All clear!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">No open incidents</p>
              </div>
            </div>
          ) : (
            incidentList.map(incident => (
              <Link
                key={incident.id}
                href={`/m/incidents/${incident.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[incident.status] || STATUS_STYLES.OPEN}`}
                    >
                      {incident.status}
                    </span>
                    {incident.urgency && (
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${URGENCY_STYLES[incident.urgency] || URGENCY_STYLES.LOW}`}
                      >
                        {incident.urgency}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                    {formatOpenDuration(incident.createdAt)}
                  </span>
                </div>

                <h3 className="font-semibold leading-snug text-slate-900 dark:text-white line-clamp-2">
                  {incident.title}
                </h3>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="truncate">{incident.service.name}</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span>{formatTimeAgo(incident.createdAt)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Desktop Version Link */}
      <Link
        href="/api/prefer-desktop"
        className="mt-2 block text-center text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        Switch to Desktop Version
      </Link>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatShiftEnd(date: Date): string {
  const endDate = new Date(date);
  const now = new Date();
  const isToday = endDate.toDateString() === now.toDateString();
  const isTomorrow = endDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();

  const time = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (isToday) return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  return (
    endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ` ${time}`
  );
}

function formatOpenDuration(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) {
    const mins = diffMins % 60;
    return mins > 0 ? `${diffHours}h ${mins}m` : `${diffHours}h`;
  }
  const hours = diffHours % 24;
  return hours > 0 ? `${diffDays}d ${hours}h` : `${diffDays}d`;
}

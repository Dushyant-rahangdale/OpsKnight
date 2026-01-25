import prisma from '@/lib/prisma';
import MobileCard from '@/components/mobile/MobileCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type ServiceStatus = {
  id: string;
  name: string;
  status: string;
  incidentCount: number;
};

type ActiveIncident = {
  id: string;
  title: string;
  status: string;
  urgency: string;
  serviceName: string;
  createdAt: Date;
  updatedAt: Date;
};

type Announcement = {
  id: string;
  title: string;
  type: string;
  message: string;
  startDate: Date;
  endDate: Date | null;
};

export default async function MobileStatusPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get status page config
  const statusPage = await prisma.statusPage.findFirst({
    where: { enabled: true },
    include: {
      services: {
        where: { showOnPage: true },
        include: {
          service: {
            include: {
              incidents: {
                where: { status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
                select: { id: true, urgency: true },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      announcements: {
        where: {
          isActive: true,
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        orderBy: { startDate: 'desc' },
        take: 5,
      },
    },
  });

  if (!statusPage) {
    return (
      <div className="flex flex-col gap-4 p-4 pb-24">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Status</h1>
        <MobileCard>
          <div className="flex flex-col items-center gap-3 py-6 text-center text-slate-500 dark:text-slate-400">
            <div className="text-3xl">📊</div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Status page not configured.
            </p>
            <p className="text-xs">Contact your administrator to set up a status page.</p>
          </div>
        </MobileCard>
      </div>
    );
  }

  const { calculateSLAMetrics, getExternalStatusLabel } = await import('@/lib/sla-server');

  // Optimized: Use a single call to get metrics for all services
  const serviceIds = statusPage.services.map(sp => sp.serviceId);
  const metrics = await calculateSLAMetrics({ serviceId: serviceIds });

  const serviceStatuses: ServiceStatus[] = statusPage.services.map(sp => {
    const serviceMetric = metrics.serviceMetrics.find(m => m.id === sp.serviceId);
    return {
      id: sp.service.id,
      name: sp.service.name,
      status: getExternalStatusLabel(serviceMetric?.dynamicStatus || 'OPERATIONAL'),
      incidentCount: serviceMetric?.activeCount || 0,
    };
  });

  // Overall status from aggregate metrics
  const overallStatus = getExternalStatusLabel(metrics.dynamicStatus);

  // Get active incidents with details
  const activeIncidents: ActiveIncident[] =
    serviceIds.length > 0
      ? await prisma.incident
          .findMany({
            where: {
              serviceId: { in: serviceIds },
              status: { in: ['OPEN', 'ACKNOWLEDGED'] },
            },
            include: {
              service: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
          .then(incidents =>
            incidents.map(inc => ({
              id: inc.id,
              title: inc.title,
              status: inc.status,
              urgency: inc.urgency,
              serviceName: inc.service.name,
              createdAt: inc.createdAt,
              updatedAt: inc.updatedAt,
            }))
          )
      : [];

  // Get recent resolved incidents (history)
  const recentHistory =
    serviceIds.length > 0
      ? await prisma.incident.findMany({
          where: {
            serviceId: { in: serviceIds },
            status: 'RESOLVED',
            resolvedAt: { gte: thirtyDaysAgo },
          },
          include: {
            service: { select: { name: true } },
          },
          orderBy: { resolvedAt: 'desc' },
          take: 10,
        })
      : [];

  // Announcements
  const announcements: Announcement[] = statusPage.announcements.map(a => ({
    id: a.id,
    title: a.title,
    type: a.type,
    message: a.message,
    startDate: a.startDate,
    endDate: a.endDate,
  }));

  const getStatusTone = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return {
          border: 'border-emerald-500',
          bg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
          text: 'text-emerald-700 dark:text-emerald-300',
          dot: 'bg-emerald-500',
        };
      case 'PARTIAL_OUTAGE':
        return {
          border: 'border-amber-500',
          bg: 'bg-amber-50/70 dark:bg-amber-950/40',
          text: 'text-amber-700 dark:text-amber-300',
          dot: 'bg-amber-500',
        };
      case 'MAJOR_OUTAGE':
        return {
          border: 'border-red-500',
          bg: 'bg-red-50/70 dark:bg-red-950/40',
          text: 'text-red-700 dark:text-red-300',
          dot: 'bg-red-500',
        };
      default:
        return {
          border: 'border-slate-400',
          bg: 'bg-slate-50/70 dark:bg-slate-900/50',
          text: 'text-slate-600 dark:text-slate-400',
          dot: 'bg-slate-400',
        };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return 'Operational';
      case 'PARTIAL_OUTAGE':
        return 'Partial Outage';
      case 'MAJOR_OUTAGE':
        return 'Major Outage';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return '✅';
      case 'PARTIAL_OUTAGE':
        return '⚠️';
      case 'MAJOR_OUTAGE':
        return '❌';
      default:
        return '❓';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    if (urgency === 'HIGH') {
      return {
        label: 'High',
        classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      };
    }
    if (urgency === 'MEDIUM') {
      return {
        label: 'Medium',
        classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      };
    }
    return {
      label: 'Low',
      classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    };
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'MAINTENANCE':
        return '🔧';
      case 'INCIDENT':
        return '🚨';
      case 'INFO':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Page Title */}
      <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        {statusPage.name || 'System Status'}
      </h1>

      {/* Overall Status Banner */}
      <MobileCard
        className={`border-l-4 ${getStatusTone(overallStatus).border} ${getStatusTone(overallStatus).bg}`}
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getStatusIcon(overallStatus)}</div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {overallStatus === 'OPERATIONAL'
                ? 'All Systems Operational'
                : getStatusLabel(overallStatus)}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {activeIncidents.length === 0
                ? 'No active incidents'
                : `${activeIncidents.length} active incident${activeIncidents.length > 1 ? 's' : ''}`}
            </p>
            <p
              className="mt-1 text-[11px] text-slate-500 dark:text-slate-400"
              suppressHydrationWarning
            >
              Updated {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </MobileCard>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            📢 Announcements
          </h3>
          <div className="flex flex-col gap-3">
            {announcements.map(announcement => {
              const tone =
                announcement.type === 'MAINTENANCE'
                  ? 'border-blue-400'
                  : announcement.type === 'INCIDENT'
                    ? 'border-red-400'
                    : 'border-slate-400';
              return (
                <MobileCard key={announcement.id} padding="sm" className={`border-l-4 ${tone}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getAnnouncementIcon(announcement.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {announcement.title}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        {announcement.message}
                      </p>
                      <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                        {new Date(announcement.startDate).toLocaleDateString()}
                        {announcement.endDate &&
                          ` - ${new Date(announcement.endDate).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                </MobileCard>
              );
            })}
          </div>
        </section>
      )}

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            🚨 Active Incidents
          </h3>
          <div className="flex flex-col gap-3">
            {activeIncidents.map(incident => {
              const urgencyBadge = getUrgencyBadge(incident.urgency);
              const urgencyBorder =
                incident.urgency === 'HIGH'
                  ? 'border-red-400'
                  : incident.urgency === 'MEDIUM'
                    ? 'border-amber-400'
                    : 'border-emerald-400';
              return (
                <Link
                  key={incident.id}
                  href={`/m/incidents/${incident.id}`}
                  className="no-underline"
                >
                  <MobileCard padding="sm" className={`border-l-4 ${urgencyBorder}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {incident.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {incident.serviceName}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                          {formatTimeAgo(incident.createdAt)}
                        </div>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${urgencyBadge.classes}`}
                      >
                        {urgencyBadge.label}
                      </span>
                    </div>
                  </MobileCard>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Services */}
      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          🖥️ Services ({serviceStatuses.length})
        </h3>
        <div className="flex flex-col gap-2">
          {serviceStatuses.map(service => {
            const tone = getStatusTone(service.status);
            return (
              <MobileCard
                key={service.id}
                padding="sm"
                className="flex items-center justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                  <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {service.name}
                  </span>
                </div>
                <span className={`text-[11px] font-semibold ${tone.text}`}>
                  {getStatusLabel(service.status)}
                </span>
              </MobileCard>
            );
          })}
          {serviceStatuses.length === 0 && (
            <MobileCard padding="sm">
              <div className="py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                No services configured
              </div>
            </MobileCard>
          )}
        </div>
      </section>

      {/* Recent History */}
      {recentHistory.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            📜 Recent History (
            {metrics.isClipped ? `${metrics.retentionDays} days - retention limit` : '30 days'})
          </h3>
          <div className="flex flex-col gap-2">
            {recentHistory.map(incident => (
              <Link key={incident.id} href={`/m/incidents/${incident.id}`} className="no-underline">
                <MobileCard padding="sm" className="opacity-90">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {incident.title}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {incident.service.name} • Resolved {formatTimeAgo(incident.resolvedAt!)}
                      </div>
                    </div>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Resolved
                    </span>
                  </div>
                </MobileCard>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="border-t border-slate-200 py-4 text-center text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Powered by OpsKnight
      </div>
    </div>
  );
}

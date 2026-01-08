import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import DashboardFilters from '@/components/DashboardFilters';
import IncidentTable from '@/components/IncidentTable';
import DashboardPerformanceMetrics from '@/components/DashboardPerformanceMetrics';
import DashboardQuickFilters from '@/components/DashboardQuickFilters';
import DashboardFilterChips from '@/components/DashboardFilterChips';
import DashboardAdvancedMetrics from '@/components/DashboardAdvancedMetrics';
import DashboardSavedFilters from '@/components/DashboardSavedFilters';
import DashboardPeriodComparison from '@/components/DashboardPeriodComparison';
import DashboardServiceHealth from '@/components/DashboardServiceHealth';
import DashboardUrgencyDistribution from '@/components/DashboardUrgencyDistribution';

import { calculateSLAMetrics } from '@/lib/sla-server';
import { Suspense } from 'react';
import DashboardRealtimeWrapper from '@/components/DashboardRealtimeWrapper';
import DashboardCommandCenter from '@/components/dashboard/DashboardCommandCenter';
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel';
import OnCallWidget from '@/components/dashboard/OnCallWidget';
import SidebarWidget, {
  WIDGET_ICON_BG,
  WIDGET_ICON_COLOR,
} from '@/components/dashboard/SidebarWidget';
import { Card, CardContent, CardHeader } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { FileText, ArrowRight } from 'lucide-react';
import CompactOnCallStatus from '@/components/dashboard/compact/CompactOnCallStatus';
import CompactPerformanceMetrics from '@/components/dashboard/compact/CompactPerformanceMetrics';
import CompactStatsOverview from '@/components/dashboard/compact/CompactStatsOverview';
import CompactServiceHealth from '@/components/dashboard/compact/CompactServiceHealth';
import CompactRecentActivity from '@/components/dashboard/compact/CompactRecentActivity';
import CompactTeamLoad from '@/components/dashboard/compact/CompactTeamLoad';
import {
  buildDateFilter,
  buildIncidentWhere,
  buildIncidentOrderBy,
  getDaysFromRange,
  getRangeLabel,
  type DashboardFilters as DashboardFilterParams,
} from '@/lib/dashboard-utils';

// New Imports for SLA Breach Widget
import { getWidgetData } from '@/lib/widget-data-provider';
import { WidgetProvider } from '@/components/dashboard/WidgetProvider';
import SLABreachAlertsWidget from '@/components/dashboard/widgets/SLABreachAlertsWidget';

export const revalidate = 30;

const INCIDENTS_PER_PAGE = 30;

function buildPaginationUrl(baseParams: URLSearchParams, page: number): string {
  const params = new URLSearchParams(baseParams.toString());
  if (page === 1) {
    params.delete('page');
  } else {
    params.set('page', page.toString());
  }
  const queryString = params.toString();
  return queryString ? `/?${queryString}` : '/';
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(await getAuthOptions());
  const awaitedSearchParams = await searchParams;

  // Extract search params
  const status =
    typeof awaitedSearchParams.status === 'string' ? awaitedSearchParams.status : undefined;
  const assignee =
    typeof awaitedSearchParams.assignee === 'string' ? awaitedSearchParams.assignee : undefined;
  const service =
    typeof awaitedSearchParams.service === 'string' ? awaitedSearchParams.service : undefined;
  const urgencyParam =
    typeof awaitedSearchParams.urgency === 'string' ? awaitedSearchParams.urgency : undefined;
  const urgency = (
    ['HIGH', 'MEDIUM', 'LOW'].includes(urgencyParam || '') ? urgencyParam : undefined
  ) as 'HIGH' | 'MEDIUM' | 'LOW' | undefined;
  const page =
    typeof awaitedSearchParams.page === 'string' ? parseInt(awaitedSearchParams.page) || 1 : 1;
  const sortBy =
    typeof awaitedSearchParams.sortBy === 'string' ? awaitedSearchParams.sortBy : 'createdAt';
  const sortOrder =
    typeof awaitedSearchParams.sortOrder === 'string'
      ? (awaitedSearchParams.sortOrder as 'asc' | 'desc')
      : 'desc';
  const range = typeof awaitedSearchParams.range === 'string' ? awaitedSearchParams.range : '30';
  const customStart =
    typeof awaitedSearchParams.startDate === 'string' ? awaitedSearchParams.startDate : undefined;
  const customEnd =
    typeof awaitedSearchParams.endDate === 'string' ? awaitedSearchParams.endDate : undefined;

  // Get user name for greeting
  const email = session?.user?.email ?? null;
  const user = email
    ? await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, timeZone: true },
      })
    : null;
  const userName = user?.name || 'there';
  const userTimeZone = user?.timeZone || 'UTC';

  // Build filters using utility functions
  const filterParams: DashboardFilterParams = {
    status,
    service,
    assignee,
    urgency,
    range,
    customStart,
    customEnd,
  };

  // Main query where clause (includes status filter)
  const where = buildIncidentWhere(filterParams);

  // Metrics where clause (excludes status filter for aggregate counts)
  const metricsWhere = buildIncidentWhere(filterParams, { includeStatus: false });

  // Chart where clause (excludes urgency for distribution charts)
  const chartWhere = buildIncidentWhere(filterParams, {
    includeStatus: false,
    includeUrgency: false,
  });

  // MTTA where clause
  const mttaWhere = { ...metricsWhere, acknowledgedAt: { not: null } };

  // Date filter for SLA calculations
  const dateFilter = buildDateFilter(range, customStart, customEnd);
  const metricsStartDate = dateFilter.createdAt?.gte;
  const metricsEndDate = dateFilter.createdAt?.lte;
  const assigneeFilter = assignee !== undefined ? (assignee === '' ? null : assignee) : undefined;

  // Build orderBy using utility function
  const orderBy = buildIncidentOrderBy(sortBy, sortOrder);

  const skip = (page - 1) * INCIDENTS_PER_PAGE;

  // Fetch Data in Parallel
  const [incidents, totalCount, services, users, slaMetrics, widgetData] = await Promise.all([
    prisma.incident.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        urgency: true,
        createdAt: true,
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy,
      skip,
      take: INCIDENTS_PER_PAGE,
    }),
    prisma.incident.count({ where }),
    // Optimized: Only fetch id and name for services (used in filters and service health)
    prisma.service.findMany({
      select: {
        id: true,
        name: true,
        status: true,
      },
    }),
    // Optimized: Only fetch id and name for users (used in filters)
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    }),
    calculateSLAMetrics({
      serviceId: service,
      assigneeId: assigneeFilter,
      urgency: urgency as 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
      startDate: metricsStartDate,
      endDate: metricsEndDate,
      includeAllTime: range === 'all',
      includeIncidents: true,
      incidentLimit: 5,
    }),
    // Fetch widget data specifically for the active incident summaries
    user ? getWidgetData(user.id, 'user') : Promise.resolve(null),
  ]);

  // Calculate MTTA
  // Map SLA Server metrics to Dashboard variables
  const activeShifts = slaMetrics.currentShifts;
  const metricsTotalCount = slaMetrics.totalIncidents;
  const metricsOpenCount = slaMetrics.openCount;
  const metricsResolvedCount = slaMetrics.statusMix.find(s => s.status === 'RESOLVED')?.count ?? 0;
  const unassignedCount = slaMetrics.unassignedActive;

  const allOpenIncidentsCount = slaMetrics.openCount;
  const allAcknowledgedCount = slaMetrics.acknowledgedCount;
  const allCriticalIncidentsCount = slaMetrics.criticalCount;
  const currentCriticalActive = slaMetrics.criticalCount;

  const currentPeriodAcknowledged = allAcknowledgedCount;
  const currentPeriodCritical = slaMetrics.criticalCount;
  const mttaMinutes = slaMetrics.mttd;
  const allIncidentsCount = metricsTotalCount;
  const allResolvedCountAllTime = metricsResolvedCount;

  // Previous Period Stats
  const prevTotal = slaMetrics.previousPeriod.totalIncidents;
  const prevOpen = 0; // Point-in-time snapshot not available in history
  const prevResolved = Math.round(prevTotal * (slaMetrics.previousPeriod.resolveRate / 100));
  const prevAcknowledged = Math.round(prevTotal * (slaMetrics.previousPeriod.ackRate / 100));
  const prevCritical = slaMetrics.previousPeriod.highUrgencyCount;

  // Urgency Distribution
  const urgencyCounts = slaMetrics.urgencyMix.reduce(
    (acc, item) => {
      acc[item.urgency] = item.count;
      return acc;
    },
    {} as Record<string, number>
  );

  const urgencyDistribution = [
    { label: 'High', value: urgencyCounts['HIGH'] || 0, color: 'var(--color-danger)' },
    { label: 'Medium', value: urgencyCounts['MEDIUM'] || 0, color: '#f59e0b' },
    { label: 'Low', value: urgencyCounts['LOW'] || 0, color: '#22c55e' },
  ].filter(item => item.value > 0);

  // Service Health
  const servicesWithIncidents = slaMetrics.serviceMetrics.map(s => ({
    id: s.id,
    name: s.name,
    status: s.dynamicStatus as
      | 'OPERATIONAL'
      | 'DEGRADED'
      | 'PARTIAL_OUTAGE'
      | 'MAJOR_OUTAGE'
      | 'MAINTENANCE',
    activeIncidents: s.activeCount,
    criticalIncidents: s.criticalCount,
  }));

  // Helper functions for period labels
  const getPeriodLabels = () => {
    if (range === 'all') return { current: 'All Time', previous: 'All Time' };
    const days = getDaysFromRange(range);
    if (days === 0) return { current: 'All Time', previous: 'All Time' };

    return {
      current: `Last ${days} days`,
      previous: `Previous ${days} days`,
    };
  };

  const periodLabels = getPeriodLabels();

  // Calculate system status
  const systemStatus =
    currentCriticalActive > 0
      ? { label: 'CRITICAL', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.1)' }
      : metricsOpenCount > 0
        ? { label: 'DEGRADED', color: 'var(--color-warning)', bg: 'rgba(245, 158, 11, 0.1)' }
        : { label: 'OPERATIONAL', color: 'var(--color-success)', bg: 'rgba(34, 197, 94, 0.1)' };

  const totalPages = Math.ceil(totalCount / INCIDENTS_PER_PAGE);
  const baseParams = new URLSearchParams();
  if (status && status !== 'ALL') baseParams.set('status', status);
  if (assignee !== undefined) baseParams.set('assignee', assignee);
  if (service) baseParams.set('service', service);
  if (urgency) baseParams.set('urgency', urgency);
  if (range && range !== 'all') baseParams.set('range', range);
  if (customStart) baseParams.set('startDate', customStart);
  if (customEnd) baseParams.set('endDate', customEnd);
  if (sortBy !== 'createdAt' || sortOrder !== 'desc') {
    baseParams.set('sortBy', sortBy);
    baseParams.set('sortOrder', sortOrder);
  }

  // Get greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  // Calculate total incidents for the selected range
  const totalInRange = metricsTotalCount;

  return (
    <DashboardRealtimeWrapper>
      <main className="w-full p-4 md:p-6 pb-8">
        <DashboardCommandCenter
          systemStatus={systemStatus}
          allOpenIncidentsCount={allOpenIncidentsCount}
          totalInRange={totalInRange}
          metricsOpenCount={metricsOpenCount}
          metricsResolvedCount={metricsResolvedCount}
          unassignedCount={unassignedCount}
          rangeLabel={getRangeLabel(range)}
          incidents={incidents}
          filters={{
            status: status || undefined,
            service: service || undefined,
            assignee: assignee || undefined,
            range: range !== 'all' ? range : undefined,
          }}
          currentPeriodAcknowledged={currentPeriodAcknowledged}
          userTimeZone={userTimeZone}
          isClipped={slaMetrics.isClipped}
          retentionDays={slaMetrics.retentionDays}
        />

        {/* Main Content Grid - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 md:gap-6">
          {/* Left Column - Filters and Table */}
          <div className="flex flex-col gap-4 md:gap-6">
            {/* Filters Panel */}
            <Card className="shadow-lg border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-slate-600 flex items-center justify-center shadow-sm">
                    <span className="text-lg">🔍</span>
                  </div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight">
                    Filter Incidents
                  </h2>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Saved Filters */}
                <Suspense
                  fallback={
                    <div className="h-8 w-[200px] bg-neutral-200 rounded-md animate-pulse" />
                  }
                >
                  <DashboardSavedFilters />
                </Suspense>

                {/* Quick Filters */}
                <Suspense
                  fallback={
                    <div className="flex gap-2 h-10">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="flex-1 h-10 bg-neutral-200 rounded-md animate-pulse"
                        />
                      ))}
                    </div>
                  }
                >
                  <DashboardQuickFilters />
                </Suspense>

                {/* Filter Chips */}
                <Suspense
                  fallback={
                    <div className="flex gap-2 flex-wrap min-h-[40px]">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className="w-20 h-7 bg-neutral-200 rounded-full animate-pulse"
                        />
                      ))}
                    </div>
                  }
                >
                  <DashboardFilterChips services={services} users={users} />
                </Suspense>

                {/* Dashboard Filters */}
                <DashboardFilters
                  initialStatus={status}
                  initialService={service}
                  initialAssignee={assignee}
                  services={services}
                  users={users}
                />
              </CardContent>
            </Card>

            {/* Incidents Table Panel */}
            <Card className="shadow-lg border-border/50 p-0 overflow-hidden animate-slide-up">
              <CardHeader className="pb-4 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-slate-600 flex items-center justify-center shadow-sm">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground tracking-tight mb-0.5">
                        Incident Directory
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Showing {skip + 1}-{Math.min(skip + INCIDENTS_PER_PAGE, totalCount)} of{' '}
                        {totalCount} incidents
                      </p>
                    </div>
                  </div>
                  <Link href="/incidents">
                    <Button variant="outline" size="sm" className="gap-2 shadow-xs">
                      View All <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <div className="overflow-hidden">
                {incidents.length === 0 ? (
                  <div className="py-16 px-8 text-center bg-card border-t border-b">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-30 text-muted-foreground" />
                    <p className="text-base font-semibold mb-2 text-secondary-foreground">
                      No incidents found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters to see more results.
                    </p>
                  </div>
                ) : (
                  <IncidentTable incidents={incidents} sortBy={sortBy} sortOrder={sortOrder} />
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-5 border-t bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm text-secondary-foreground font-medium">
                    Page <strong className="text-foreground">{page}</strong> of{' '}
                    <strong className="text-foreground">{totalPages}</strong>
                  </p>
                  <div className="flex gap-2 items-center">
                    <Link href={buildPaginationUrl(baseParams, 1)}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        className="text-xs font-semibold"
                      >
                        First
                      </Button>
                    </Link>
                    <Link href={buildPaginationUrl(baseParams, Math.max(1, page - 1))}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        className="text-xs font-semibold"
                      >
                        Previous
                      </Button>
                    </Link>
                    <Link href={buildPaginationUrl(baseParams, Math.min(totalPages, page + 1))}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        className="text-xs font-semibold"
                      >
                        Next
                      </Button>
                    </Link>
                    <Link href={buildPaginationUrl(baseParams, totalPages)}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        className="text-xs font-semibold"
                      >
                        Last
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar - Compact Modern Design */}
          <aside className="flex flex-col gap-5 animate-slide-in-right">
            {/* Quick Actions Panel */}
            <QuickActionsPanel greeting={greeting} userName={userName} />

            {/* SLA Breach Alerts - New Real-time Widget */}
            {widgetData && (
              <WidgetProvider initialData={widgetData}>
                <SLABreachAlertsWidget />
              </WidgetProvider>
            )}

            {/* On-Call Widget - Full Featured */}
            <OnCallWidget activeShifts={activeShifts} />

            {/* Performance Metrics - Compact */}
            <SidebarWidget
              title="Performance"
              iconBg={WIDGET_ICON_BG.blue}
              icon={<span style={{ fontSize: '20px', color: 'white' }}>⚡</span>}
            >
              <CompactPerformanceMetrics
                mtta={mttaMinutes}
                mttr={slaMetrics.mttr}
                ackSlaRate={slaMetrics.ackCompliance}
                resolveSlaRate={slaMetrics.resolveCompliance}
              />
            </SidebarWidget>

            {/* Quick Stats - Compact */}
            <SidebarWidget
              title="Overview"
              iconBg={WIDGET_ICON_BG.purple}
              icon={<span style={{ fontSize: '20px', color: 'white' }}>📊</span>}
            >
              <CompactStatsOverview
                totalIncidents={allIncidentsCount}
                openIncidents={allOpenIncidentsCount}
                resolvedIncidents={allResolvedCountAllTime}
                criticalIncidents={allCriticalIncidentsCount}
                unassignedIncidents={unassignedCount}
                servicesCount={services.length}
              />
            </SidebarWidget>

            {/* Service Health - Compact */}
            <SidebarWidget
              title="Services"
              iconBg={WIDGET_ICON_BG.green}
              icon={<span style={{ fontSize: '20px', color: 'white' }}>🔧</span>}
            >
              <CompactServiceHealth services={servicesWithIncidents} />
            </SidebarWidget>

            {/* Recent Activity - Compact */}
            <SidebarWidget
              title="Activity"
              iconBg={WIDGET_ICON_BG.purple}
              icon={<span style={{ fontSize: '20px', color: 'white' }}>📋</span>}
            >
              <CompactRecentActivity incidents={slaMetrics.recentIncidents || []} />
            </SidebarWidget>

            {/* Team Load - Compact */}
            <SidebarWidget
              title="Team Load"
              iconBg={WIDGET_ICON_BG.blue}
              icon={<span style={{ fontSize: '20px', color: 'white' }}>👥</span>}
            >
              <CompactTeamLoad assigneeLoad={slaMetrics.assigneeLoad} />
            </SidebarWidget>
          </aside>
        </div>
      </main>
    </DashboardRealtimeWrapper>
  );
}

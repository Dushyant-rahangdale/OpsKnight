import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getUserPermissions } from '@/lib/rbac';
import IncidentsListTable from '@/components/incident/IncidentsListTable';
import IncidentsFilters from '@/components/incident/IncidentsFilters';
import PresetSelector from '@/components/PresetSelector';
import { getAccessiblePresets, searchParamsToCriteria } from '@/lib/search-presets';
import { createDefaultPresetsForUser } from '@/lib/search-presets-defaults';
import {
  buildIncidentOrderBy,
  buildIncidentWhere,
  incidentListSelect,
  normalizeIncidentFilter,
  normalizeIncidentSort,
} from '@/lib/incidents-query';

export const revalidate = 30;

const ITEMS_PER_PAGE = 50; // Number of incidents per page

function buildIncidentsUrl(params: URLSearchParams): string {
  const query = params.toString();
  return query ? `/incidents?${query}` : '/incidents';
}

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    search?: string;
    priority?: string;
    urgency?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const currentFilter = normalizeIncidentFilter(params.filter);
  const currentSearch = params.search || '';
  const currentPriority = params.priority || 'all';
  const currentUrgency = params.urgency || 'all';
  const currentSort = normalizeIncidentSort(params.sort);
  const currentPage = parseInt(params.page || '1', 10);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const permissions = await getUserPermissions();
  const canCreateIncident = permissions.isResponderOrAbove;

  // Get current user with team memberships in a single query (optimized)
  const currentUser = await prisma.user.findUnique({
    where: { id: permissions.id },
    select: {
      id: true,
      name: true,
      email: true,
      teamMemberships: {
        select: {
          teamId: true,
        },
      },
    },
  });

  const userTeamIds = currentUser?.teamMemberships.map(t => t.teamId) || [];

  // Get accessible presets (and create defaults if needed)
  let presets = await getAccessiblePresets(permissions.id, userTeamIds);

  // Create default presets if user has none
  if (presets.length === 0 && permissions.isResponderOrAbove) {
    await createDefaultPresetsForUser(permissions.id);
    presets = await getAccessiblePresets(permissions.id, userTeamIds);
  }

  // Get current filter criteria
  const currentCriteria = searchParamsToCriteria({
    filter: currentFilter,
    search: currentSearch,
    priority: currentPriority,
    urgency: currentUrgency,
    sort: currentSort,
  });

  const where = buildIncidentWhere({
    filter: currentFilter,
    search: currentSearch,
    priority: currentPriority,
    urgency: currentUrgency,
    assigneeId: currentUser?.id,
  });

  const orderBy = buildIncidentOrderBy(currentSort);

  // Header stats (match users page: stat tiles + counts)
  const statsBase = {
    search: currentSearch,
    priority: currentPriority,
    urgency: currentUrgency,
    // "Mine" relies on assigneeId; fall back to permissions.id defensively
    assigneeId: currentUser?.id ?? permissions.id,
  };

  const [mineCount, openCount, resolvedCount, snoozedCount, suppressedCount] = await Promise.all([
    prisma.incident.count({ where: buildIncidentWhere({ filter: 'mine', ...statsBase }) }),
    prisma.incident.count({ where: buildIncidentWhere({ filter: 'all_open', ...statsBase }) }),
    prisma.incident.count({ where: buildIncidentWhere({ filter: 'resolved', ...statsBase }) }),
    prisma.incident.count({ where: buildIncidentWhere({ filter: 'snoozed', ...statsBase }) }),
    prisma.incident.count({ where: buildIncidentWhere({ filter: 'suppressed', ...statsBase }) }),
  ]);

  // Get total count for pagination
  const totalCount = await prisma.incident.count({ where });
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Get paginated incidents
  let incidents = await prisma.incident.findMany({
    where,
    select: incidentListSelect,
    orderBy,
    skip,
    take: ITEMS_PER_PAGE,
  });

  // Custom priority sorting if needed (P1, P2, P3, P4, P5, null)
  // Note: For pagination, we should ideally do this at DB level, but for now we'll sort in memory
  if (currentSort === 'priority') {
    const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, '': 6 };
    incidents = incidents.sort((a, b) => {
      const aPriorityKey = a.priority ?? '';
      const bPriorityKey = b.priority ?? '';
      const aPriority = priorityOrder[aPriorityKey as keyof typeof priorityOrder] || 6;
      const bPriority = priorityOrder[bPriorityKey as keyof typeof priorityOrder] || 6;
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  const tabs = [
    { id: 'mine', label: 'Mine', count: mineCount },
    { id: 'all_open', label: 'All Open', count: openCount },
    { id: 'resolved', label: 'Resolved', count: resolvedCount },
    { id: 'snoozed', label: 'Snoozed', count: snoozedCount },
    { id: 'suppressed', label: 'Suppressed', count: suppressedCount },
  ];

  const baseParams = new URLSearchParams();
  if (currentSearch) baseParams.set('search', currentSearch);
  if (currentPriority !== 'all') baseParams.set('priority', currentPriority);
  if (currentUrgency !== 'all') baseParams.set('urgency', currentUrgency);
  if (currentSort !== 'newest') baseParams.set('sort', currentSort);

  const showingFrom = totalCount === 0 ? 0 : skip + 1;
  const showingTo = Math.min(skip + ITEMS_PER_PAGE, totalCount);

  return (
    <main className="px-4 pb-8 lg:px-6 xl:px-8 max-w-[1920px] mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6 rounded-xl shadow-lg mb-4 flex flex-col lg:flex-row justify-between items-start gap-4">
        <div className="min-w-[240px]">
          <h1 className="text-2xl lg:text-3xl font-extrabold mb-1.5">Incidents</h1>
          <p className="opacity-90 text-base m-0">
            Triage, assign, and resolve operational issues fast.
          </p>
          <p className="opacity-80 text-sm mt-2">
            Showing{' '}
            <strong>
              {showingFrom}-{showingTo}
            </strong>{' '}
            of <strong>{totalCount}</strong> in this view
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {canCreateIncident ? (
            <Link
              href="/incidents/create"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors whitespace-nowrap shadow-sm"
            >
              + Create Incident
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="px-4 py-2 bg-primary/60 text-white/60 rounded-lg font-medium cursor-not-allowed whitespace-nowrap shadow-sm"
              title="Responder role or above required to create incidents"
            >
              + Create Incident
            </button>
          )}
          <Link
            href="/"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors whitespace-nowrap backdrop-blur-sm border border-white/10"
          >
            Dashboard →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full lg:w-auto lg:min-w-[600px] xl:min-w-[700px]">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/10">
            <div className="text-2xl font-extrabold leading-none tabular-nums">{mineCount}</div>
            <div className="text-[11px] uppercase tracking-wider opacity-90 mt-1 font-bold">
              MINE
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/10">
            <div className="text-2xl font-extrabold leading-none tabular-nums">{openCount}</div>
            <div className="text-[11px] uppercase tracking-wider opacity-90 mt-1 font-bold">
              OPEN
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/10">
            <div className="text-2xl font-extrabold leading-none tabular-nums">{resolvedCount}</div>
            <div className="text-[11px] uppercase tracking-wider opacity-90 mt-1 font-bold">
              RESOLVED
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/10">
            <div className="text-2xl font-extrabold leading-none tabular-nums">{snoozedCount}</div>
            <div className="text-[11px] uppercase tracking-wider opacity-90 mt-1 font-bold">
              SNOOZED
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/10">
            <div className="text-2xl font-extrabold leading-none tabular-nums">
              {suppressedCount}
            </div>
            <div className="text-[11px] uppercase tracking-wider opacity-90 mt-1 font-bold">
              SUPPRESSED
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map(tab => {
          const tabParams = new URLSearchParams(baseParams.toString());
          if (tab.id === 'all_open') {
            tabParams.delete('filter');
          } else {
            tabParams.set('filter', tab.id);
          }
          tabParams.delete('page');
          const isActive = currentFilter === tab.id;
          return (
            <Link
              key={tab.id}
              href={buildIncidentsUrl(tabParams)}
              className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-colors
                ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-red-50 text-slate-800 hover:bg-red-100 border border-transparent'
                }
              `}
            >
              <span>{tab.label}</span>
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-extrabold
                  ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-slate-800'}
                `}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Filters Panel */}
      <div className="bg-white p-4 lg:p-5 rounded-xl border border-slate-200 shadow-sm mb-4">
        <div className="flex justify-between items-center gap-4 flex-wrap mb-3">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
              Filters
            </p>
            <p className="text-sm text-slate-600">Refine the list and save presets.</p>
          </div>
          <PresetSelector presets={presets} currentCriteria={currentCriteria} />
        </div>

        <div className="mt-3">
          <IncidentsFilters
            currentFilter={currentFilter}
            currentSort={currentSort}
            currentPriority={currentPriority}
            currentUrgency={currentUrgency}
            currentSearch={currentSearch}
            currentCriteria={currentCriteria}
          />
        </div>
      </div>

      <IncidentsListTable
        incidents={incidents}
        users={users}
        canManageIncidents={permissions.isResponderOrAbove}
        pagination={{
          currentPage: currentPage,
          totalPages: totalPages,
          totalItems: totalCount,
          itemsPerPage: ITEMS_PER_PAGE,
        }}
      />
    </main>
  );
}

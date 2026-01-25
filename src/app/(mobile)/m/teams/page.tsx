import prisma from '@/lib/prisma';
import Link from 'next/link';
import { MobileSearchWithParams } from '@/components/mobile/MobileSearchParams';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MobileTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || '';

  const teams = await prisma.team.findMany({
    where: query
      ? {
          name: { contains: query, mode: 'insensitive' },
        }
      : undefined,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          members: true,
          incidents: {
            where: { status: { in: ['OPEN', 'ACKNOWLEDGED', 'SNOOZED', 'SUPPRESSED'] } },
          },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[color:var(--text-primary)]">Teams</h1>
        <p className="mt-1 text-xs font-medium text-[color:var(--text-muted)]">
          {teams.length} team{teams.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <MobileSearchWithParams placeholder="Search teams..." />

      {/* Team List */}
      <div className="flex flex-col gap-3">
        {teams.length === 0 ? (
          <EmptyState />
        ) : (
          teams.map(team => (
            <Link
              key={team.id}
              href={`/m/teams/${team.id}`}
              className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4 text-[color:var(--text-primary)] shadow-sm transition hover:bg-[color:var(--bg-secondary)]"
            >
              {/* Team Avatar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-base font-bold text-white dark:from-slate-200 dark:to-slate-50 dark:text-slate-900">
                {team.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="truncate text-sm font-semibold">{team.name}</div>
                {team.description && (
                  <div className="line-clamp-2 text-xs text-[color:var(--text-secondary)]">
                    {team.description}
                  </div>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-[color:var(--text-muted)]">
                  <span>
                    👥 {team._count.members} member{team._count.members !== 1 ? 's' : ''}
                  </span>
                  {team._count.incidents > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      🔥 {team._count.incidents} open incident
                      {team._count.incidents !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-[color:var(--text-muted)]" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--bg-secondary)] px-6 py-10 text-center">
      <div className="text-3xl">👥</div>
      <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">No teams</h3>
      <p className="text-xs text-[color:var(--text-muted)]">Use desktop to create teams</p>
    </div>
  );
}

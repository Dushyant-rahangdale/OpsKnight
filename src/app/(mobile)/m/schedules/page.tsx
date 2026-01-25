import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MobileSchedulesPage() {
  const schedules = await prisma.onCallSchedule.findMany({
    orderBy: { name: 'asc' },
    include: {
      layers: {
        include: {
          users: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          On-Call Schedules
        </h1>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Schedule List */}
      <div className="flex flex-col gap-3">
        {schedules.length === 0 ? (
          <EmptyState />
        ) : (
          schedules.map(schedule => {
            const totalParticipants = schedule.layers.reduce(
              (acc, layer) => acc + layer.users.length,
              0
            );

            return (
              <Link
                key={schedule.id}
                href={`/m/schedules/${schedule.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/60"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="truncate text-sm font-semibold">{schedule.name}</div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      📅 {schedule.layers.length} layer{schedule.layers.length !== 1 ? 's' : ''}
                    </span>
                    <span>•</span>
                    <span>
                      👥 {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/60">
      <div className="text-3xl">📅</div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No schedules</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Use desktop to create on-call schedules
      </p>
    </div>
  );
}

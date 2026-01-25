import { createIncident } from '@/app/(app)/incidents/actions';
import MobileCreateIncidentClient from './client';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function MobileCreateIncidentPage() {
  const [services, users] = await Promise.all([
    prisma.service.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          New Incident
        </h1>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          Report a new issue
        </p>
      </div>

      <MobileCreateIncidentClient services={services} users={users} createAction={createIncident} />
    </div>
  );
}

import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import MobileCard from '@/components/mobile/MobileCard';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MobileServiceDetailPage({ params }: PageProps) {
  const { id } = await params;

  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      policy: true,
      incidents: {
        where: { status: { in: ['OPEN', 'ACKNOWLEDGED', 'SNOOZED', 'SUPPRESSED'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          urgency: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          incidents: {
            where: { status: { in: ['OPEN', 'ACKNOWLEDGED', 'SNOOZED', 'SUPPRESSED'] } },
          },
        },
      },
    },
  });

  if (!service) {
    notFound();
  }

  const isHealthy = service._count.incidents === 0;

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Back Button */}
      <Link
        href="/m/services"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Services
      </Link>

      {/* Service Header */}
      <MobileCard className="relative overflow-hidden">
        <div
          className={`absolute inset-x-0 top-0 h-1 ${isHealthy ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}
        />
        <div className="flex items-start gap-3">
          {/* Health Indicator */}
          <div
            className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full ${isHealthy ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}
          />

          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{service.name}</h1>
            {service.description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {service.description}
              </p>
            )}
            <div
              className={`mt-3 inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${isHealthy ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}
            >
              {isHealthy
                ? '✓ Operational'
                : `⚠ ${service._count.incidents} Open Incident${service._count.incidents !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
      </MobileCard>

      {/* Quick Actions */}
      <Link
        href={`/m/incidents/create?serviceId=${service.id}`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" />
        New Incident
      </Link>

      {/* Service Info */}
      <MobileCard>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Details
        </h3>
        <DetailRow label="Escalation Policy" value={service.policy?.name || 'None'} />
        <DetailRow label="Created" value={formatDate(service.createdAt)} />
      </MobileCard>

      {/* Open Incidents */}
      {service.incidents.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Open Incidents
            </h2>
            <Link
              href={`/m/incidents?serviceId=${service.id}`}
              className="text-xs font-semibold text-primary"
            >
              See all →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {service.incidents.map(incident => (
              <Link
                key={incident.id}
                href={`/m/incidents/${incident.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {incident.status}
                  </span>
                  {incident.urgency && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        incident.urgency === 'HIGH'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          : incident.urgency === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}
                    >
                      {incident.urgency}
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {incident.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formatTimeAgo(incident.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 text-xs dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

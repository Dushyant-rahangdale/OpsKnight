import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MobileIncidentActions from './actions';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import {
  ArrowLeft,
  Clock,
  User,
  Zap,
  FileText,
  MessageSquare,
  Tag,
  Eye,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800',
  ACKNOWLEDGED:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  RESOLVED:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  SNOOZED:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  SUPPRESSED:
    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

const URGENCY_STYLES: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
};

const STATUS_GRADIENT: Record<string, string> = {
  OPEN: 'from-red-500 to-rose-500',
  ACKNOWLEDGED: 'from-amber-500 to-yellow-500',
  RESOLVED: 'from-emerald-500 to-green-500',
  SNOOZED: 'from-blue-500 to-indigo-500',
  SUPPRESSED: 'from-slate-500 to-gray-500',
};

export default async function MobileIncidentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const authOptions = await getAuthOptions();
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      service: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
      events: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      notes: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      },
      watchers: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      tags: {
        include: { tag: { select: { id: true, name: true, color: true } } },
      },
      postmortem: { select: { id: true, status: true } },
    },
  });

  if (!incident) {
    notFound();
  }

  const [users, teams] = await Promise.all([
    prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    prisma.team.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Back Button */}
      <Link
        href="/m/incidents"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Incidents
      </Link>

      {/* Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Status Gradient Bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${STATUS_GRADIENT[incident.status] || STATUS_GRADIENT.OPEN}`}
        />

        <div className="p-4 pt-5">
          {/* Status & Urgency Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wide border ${STATUS_STYLES[incident.status] || STATUS_STYLES.OPEN}`}
            >
              {incident.status}
            </span>
            {incident.urgency && (
              <span
                className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${URGENCY_STYLES[incident.urgency] || URGENCY_STYLES.LOW}`}
              >
                {incident.urgency}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-snug mb-2">
            {incident.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              {incident.service.name}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(incident.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <MobileIncidentActions
        incidentId={incident.id}
        status={incident.status}
        urgency={incident.urgency}
        assigneeId={incident.assigneeId}
        currentUserId={currentUserId}
        users={users}
        teams={teams}
      />

      {/* Details Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            Details
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <DetailRow
            icon={<Zap className="h-4 w-4" />}
            label="Service"
            value={incident.service.name}
          />
          <DetailRow
            icon={<User className="h-4 w-4" />}
            label="Assigned To"
            value={incident.assignee?.name || incident.team?.name || 'Unassigned'}
            subValue={incident.team && !incident.assignee ? '(Team)' : undefined}
          />
          <DetailRow
            icon={<Clock className="h-4 w-4" />}
            label="Created"
            value={formatDate(incident.createdAt)}
          />
          {incident.acknowledgedAt && (
            <DetailRow
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Acknowledged"
              value={formatDate(incident.acknowledgedAt)}
            />
          )}
          {incident.resolvedAt && (
            <DetailRow
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Resolved"
              value={formatDate(incident.resolvedAt)}
            />
          )}
        </div>
      </div>

      {/* Description */}
      {incident.description && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              Description
            </h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {incident.description}
            </p>
          </div>
        </div>
      )}

      {/* Timeline / Events */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            Recent Activity
          </h3>
        </div>
        <div className="p-4">
          {incident.events.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              No activity yet
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {incident.events.map(event => (
                <div
                  key={event.id}
                  className="pl-4 border-l-2 border-slate-200 dark:border-slate-700"
                >
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {event.message}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatTimeAgo(event.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {incident.tags.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              Tags
            </h3>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {incident.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : undefined,
                    color: tag.color || undefined,
                    border: `1px solid ${tag.color || '#e5e7eb'}40`,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Watchers */}
      {incident.watchers.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              Watchers ({incident.watchers.length})
            </h3>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {incident.watchers.map(w => (
                <span
                  key={w.id}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {w.user.name || w.user.email}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {incident.notes.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              Notes ({incident.notes.length})
            </h3>
          </div>
          <div className="p-4">
            <div className="flex flex-col gap-4">
              {incident.notes.map(n => (
                <div key={n.id} className="pl-4 border-l-2 border-primary/50">
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {n.content}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {n.user.name || n.user.email} • {formatTimeAgo(n.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Postmortem Link */}
      {incident.status === 'RESOLVED' && incident.postmortem && (
        <Link
          href={`/m/postmortems/${incident.postmortem.id}`}
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 text-emerald-700 dark:text-emerald-400 font-semibold text-sm transition-all active:scale-[0.98]"
        >
          <FileText className="h-4 w-4" />
          View Postmortem ({incident.postmortem.status})
        </Link>
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </span>
      <div className="text-right">
        <span className="text-sm font-medium text-slate-900 dark:text-white">{value}</span>
        {subValue && (
          <span className="block text-xs text-slate-500 dark:text-slate-400">{subValue}</span>
        )}
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

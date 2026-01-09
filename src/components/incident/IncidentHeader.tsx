'use client';

import Link from 'next/link';
import StatusBadge from './StatusBadge';
import EscalationStatusBadge from './EscalationStatusBadge';
import PriorityBadge from './PriorityBadge';
import AssigneeSection from './AssigneeSection';
import { Incident, Service } from '@prisma/client';
import { useTimezone } from '@/contexts/TimezoneContext';
import { formatDateTime } from '@/lib/timezone';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { Separator } from '@/components/ui/shadcn/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/shadcn/avatar';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Server,
  AlertTriangle,
  Shield,
  Users,
  ExternalLink,
  Timer,
  Calendar,
  Hash,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type IncidentHeaderProps = {
  incident: Incident & {
    service: Service & {
      policy?: { id: string; name: string } | null;
    };
    assignee: { id: string; name: string; email: string } | null;
    team?: { id: string; name: string } | null;
  };
  users: Array<{ id: string; name: string; email: string }>;
  teams: Array<{ id: string; name: string }>;
  canManage: boolean;
};

export default function IncidentHeader({ incident, users, teams, canManage }: IncidentHeaderProps) {
  const { userTimeZone } = useTimezone();
  const incidentStatus = incident.status as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Calculate time open
  const getTimeOpen = () => {
    const start = new Date(incident.createdAt);
    const end = incident.resolvedAt ? new Date(incident.resolvedAt) : new Date();
    const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);

    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const hours = Math.floor(diffInMinutes / 60);
    const mins = diffInMinutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'from-emerald-500 to-green-600';
      case 'ACKNOWLEDGED':
        return 'from-amber-400 to-orange-500';
      case 'SNOOZED':
        return 'from-indigo-400 to-purple-500';
      case 'SUPPRESSED':
        return 'from-gray-400 to-slate-500';
      default:
        return 'from-rose-500 to-red-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/incidents"
            className="inline-flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Incidents</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5" />
            {incident.id.slice(-6).toUpperCase()}
          </span>
        </nav>

        {/* Duration Badge */}
        <div
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm shadow-sm',
            'bg-gradient-to-r',
            getStatusColor(incident.status),
            'text-white'
          )}
        >
          <Timer className="h-4 w-4" />
          <span className="tabular-nums">{getTimeOpen()}</span>
          <span className="text-white/80 text-xs">
            {incident.status === 'RESOLVED' ? 'total' : 'open'}
          </span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden">
        {/* Gradient Status Bar */}
        <div className={cn('h-1.5 bg-gradient-to-r', getStatusColor(incident.status))} />

        <div className="p-6 lg:p-8">
          {/* Status Badges Row */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <StatusBadge status={incidentStatus} size="lg" showDot />
            <PriorityBadge priority={incident.priority} size="lg" showLabel />
            {incident.escalationStatus && (
              <EscalationStatusBadge
                status={incident.escalationStatus}
                currentStep={incident.currentEscalationStep}
                nextEscalationAt={incident.nextEscalationAt}
              />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] leading-tight tracking-tight mb-4">
            {incident.title}
          </h1>

          {/* Enhanced Description Section */}
          {incident.description && (
            <div className="mb-6 p-4 bg-[var(--color-neutral-50)] border border-[var(--border)] rounded-[var(--radius-md)]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-neutral-200)] flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-[var(--text-secondary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Description
                  </h4>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    {incident.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Info Grid - Premium Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Service Card */}
            <div className="group p-4 bg-gradient-to-br from-white to-[var(--color-neutral-50)] border border-[var(--border)] rounded-[var(--radius-md)] hover:shadow-[var(--shadow-md)] hover:border-[var(--primary)] transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Service
                </span>
              </div>
              <Link
                href={`/services/${incident.serviceId}`}
                className="group-hover:text-[var(--accent)] text-[var(--text-primary)] font-bold text-base transition-colors flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                {incident.service.name}
                <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>

            {/* Urgency Card */}
            <div className="p-4 bg-gradient-to-br from-white to-[var(--color-neutral-50)] border border-[var(--border)] rounded-[var(--radius-md)]">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Urgency
                </span>
              </div>
              <div
                className={cn(
                  'font-bold text-base flex items-center gap-2',
                  incident.urgency === 'HIGH'
                    ? 'text-[var(--color-error)]'
                    : 'text-[var(--color-warning)]'
                )}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    incident.urgency === 'HIGH'
                      ? 'bg-[var(--color-error)]'
                      : 'bg-[var(--color-warning)]'
                  )}
                />
                {incident.urgency}
              </div>
            </div>

            {/* Assignee Card */}
            <div className="p-4 bg-gradient-to-br from-white to-[var(--color-neutral-50)] border border-[var(--border)] rounded-[var(--radius-md)]">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Assignee
                </span>
              </div>
              <AssigneeSection
                assignee={incident.assignee}
                team={incident.team || null}
                assigneeId={incident.assigneeId}
                teamId={incident.teamId}
                users={users}
                teams={teams}
                incidentId={incident.id}
                canManage={canManage}
                variant="header"
              />
            </div>

            {/* Escalation Policy Card */}
            {incident.service.policy && (
              <div className="group p-4 bg-gradient-to-br from-white to-[var(--color-neutral-50)] border border-[var(--border)] rounded-[var(--radius-md)] hover:shadow-[var(--shadow-md)] hover:border-[var(--primary)] transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Escalation
                  </span>
                </div>
                <Link
                  href={`/policies/${incident.service.policy.id}`}
                  className="group-hover:text-[var(--accent)] text-[var(--text-primary)] font-bold text-base transition-colors flex items-center gap-2"
                >
                  {incident.service.policy.name}
                  <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            )}
          </div>

          {/* Timestamps Row */}
          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Calendar className="h-4 w-4" />
              <span>Created</span>
              <span className="font-semibold text-[var(--text-secondary)] tabular-nums">
                {formatDateTime(incident.createdAt, userTimeZone, { format: 'datetime' })}
              </span>
            </div>

            {incident.acknowledgedAt && (
              <div className="flex items-center gap-2 text-[var(--color-warning)]">
                <Clock className="h-4 w-4" />
                <span>Acknowledged</span>
                <span className="font-semibold tabular-nums">
                  {formatDateTime(incident.acknowledgedAt, userTimeZone, { format: 'datetime' })}
                </span>
              </div>
            )}

            {incident.resolvedAt && (
              <div className="flex items-center gap-2 text-[var(--color-success)]">
                <CheckCircle2 className="h-4 w-4" />
                <span>Resolved</span>
                <span className="font-semibold tabular-nums">
                  {formatDateTime(incident.resolvedAt, userTimeZone, { format: 'datetime' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

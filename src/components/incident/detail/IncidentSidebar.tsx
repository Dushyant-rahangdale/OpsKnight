'use client';

import type { IncidentStatus, Service } from '@prisma/client';
import Link from 'next/link';
import StatusBadge from '../StatusBadge';
import SLAIndicator from '../SLAIndicator';
import IncidentQuickActions from '../IncidentQuickActions';
import IncidentStatusActions from './IncidentStatusActions';
import IncidentWatchers from './IncidentWatchers';
import IncidentTags from './IncidentTags';
import { Button } from '@/components/ui/shadcn/button';
import { Separator } from '@/components/ui/shadcn/separator';
import { FileText, Zap, Eye, Activity, ChevronRight, Sparkles } from 'lucide-react';

type IncidentSidebarProps = {
  incident: {
    id: string;
    status: IncidentStatus;
    assigneeId: string | null;
    assignee: { id: string; name: string; email: string } | null;
    service: {
      id: string;
      name: string;
      targetAckMinutes?: number | null;
      targetResolveMinutes?: number | null;
    };
    acknowledgedAt?: Date | null;
    resolvedAt?: Date | null;
    createdAt: Date;
    escalationStatus?: string | null;
    currentEscalationStep?: number | null;
    nextEscalationAt?: Date | null;
  };
  users: Array<{ id: string; name: string; email: string }>;
  watchers: Array<{
    id: string;
    user: { id: string; name: string; email: string };
    role: string;
  }>;
  tags: Array<{ id: string; name: string; color?: string | null }>;
  canManage: boolean;
  onAcknowledge: () => void;
  onUnacknowledge: () => void;
  onSnooze: () => void;
  onUnsnooze: () => void;
  onSuppress: () => void;
  onUnsuppress: () => void;
  onAddWatcher: (formData: FormData) => void;
  onRemoveWatcher: (formData: FormData) => void;
};

export default function IncidentSidebar({
  incident,
  users,
  watchers,
  tags,
  canManage,
  onAcknowledge,
  onUnacknowledge,
  onSnooze,
  onUnsnooze,
  onSuppress,
  onUnsuppress,
  onAddWatcher,
  onRemoveWatcher,
}: IncidentSidebarProps) {
  const incidentStatus = incident.status as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const incidentForSLA = incident as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const serviceForSLA = incident.service as Service;

  return (
    <div className="space-y-4">
      {/* Status & Actions Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden">
        <div className="p-5">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Actions</h3>
            </div>
            <StatusBadge status={incidentStatus} size="sm" showDot />
          </div>

          {/* Status Actions */}
          <div className="space-y-4">
            <IncidentStatusActions
              incidentId={incident.id}
              currentStatus={incident.status}
              onAcknowledge={onAcknowledge}
              onUnacknowledge={onUnacknowledge}
              onSnooze={onSnooze}
              onUnsnooze={onUnsnooze}
              onSuppress={onSuppress}
              onUnsuppress={onUnsuppress}
              canManage={canManage}
            />

            <Separator />

            {/* Quick Actions */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Quick Links
              </h4>
              <IncidentQuickActions incidentId={incident.id} serviceId={incident.service.id} />
            </div>
          </div>
        </div>
      </div>

      {/* SLA Indicator Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-blue-600 flex items-center justify-center">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">SLA Status</h3>
          </div>
          <SLAIndicator incident={incidentForSLA} service={serviceForSLA} showDetails={true} />
        </div>
      </div>

      {/* Watchers Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden">
        <div className="p-5">
          <IncidentWatchers
            watchers={watchers}
            users={users}
            canManage={canManage}
            onAddWatcher={onAddWatcher}
            onRemoveWatcher={onRemoveWatcher}
          />
        </div>
      </div>

      {/* Tags Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden">
        <div className="p-5">
          <IncidentTags incidentId={incident.id} tags={tags} canManage={canManage} />
        </div>
      </div>

      {/* Postmortem Section - Only show for resolved incidents */}
      {incident.status === 'RESOLVED' && (
        <div className="bg-gradient-to-br from-[var(--color-success)]/10 to-emerald-100 border border-[var(--color-success)]/20 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-success)] to-emerald-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Postmortem</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Document lessons learned and preventive actions.
            </p>
            <Link href={`/postmortems/${incident.id}`}>
              <Button className="w-full justify-between bg-[var(--color-success)] hover:bg-[var(--color-success-dark)] text-white group">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {canManage ? 'Create Postmortem' : 'View Postmortem'}
                </span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

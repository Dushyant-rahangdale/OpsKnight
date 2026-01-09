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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { FileText, Zap, Activity, AlertCircle, ChevronRight, Eye, Tag } from 'lucide-react';

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
  users: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    gender?: string | null;
    role?: string;
  }>;
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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Actions
            </CardTitle>
            <StatusBadge status={incidentStatus} size="sm" showDot />
          </div>
          <CardDescription>Manage incident status</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* SLA Indicator Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            SLA Status
          </CardTitle>
          <CardDescription>Response time tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <SLAIndicator incident={incidentForSLA} service={serviceForSLA} showDetails={true} />
        </CardContent>
      </Card>

      {/* Watchers Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Watchers
          </CardTitle>
          <CardDescription>People following this incident</CardDescription>
        </CardHeader>
        <CardContent>
          <IncidentWatchers
            watchers={watchers}
            users={users}
            canManage={canManage}
            onAddWatcher={onAddWatcher}
            onRemoveWatcher={onRemoveWatcher}
          />
        </CardContent>
      </Card>

      {/* Tags Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </CardTitle>
          <CardDescription>Categorize this incident</CardDescription>
        </CardHeader>
        <CardContent>
          <IncidentTags incidentId={incident.id} tags={tags} canManage={canManage} />
        </CardContent>
      </Card>

      {/* Postmortem Section - Only show for resolved incidents */}
      {incident.status === 'RESOLVED' && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-green-900">
              <FileText className="h-4 w-4" />
              Postmortem
            </CardTitle>
            <CardDescription className="text-green-700">Document lessons learned</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/postmortems/${incident.id}`}>
              <Button className="w-full justify-between group" variant="default">
                <span>{canManage ? 'Create Postmortem' : 'View Postmortem'}</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import PostmortemTimeline, { type TimelineEvent } from './PostmortemTimeline';
import PostmortemImpactMetrics from './PostmortemImpactMetrics';
import type { ImpactMetrics } from './PostmortemImpactInput';
import type { ActionItem } from './PostmortemActionItems';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { useTimezone } from '@/contexts/TimezoneContext';
import { formatDateTime } from '@/lib/timezone';
import UserAvatar from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import { Calendar, Pencil } from 'lucide-react';

interface PostmortemDetailViewProps {
  postmortem: {
    id: string;
    title: string;
    summary?: string | null;
    timeline?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    impact?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    rootCause?: string | null;
    resolution?: string | null;
    actionItems?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    lessons?: string | null;
    status?: string;
    createdAt: Date;
    publishedAt?: Date | null;
    createdBy: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string | null;
      gender?: string | null;
    };
    incident: {
      id: string;
      title: string;
      resolvedAt?: Date | null;
    };
  };
  users?: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    gender?: string | null;
  }>;
  canEdit?: boolean;
  incidentId: string;
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', variant: 'warning' as const },
  PUBLISHED: { label: 'Published', variant: 'success' as const },
  ARCHIVED: { label: 'Archived', variant: 'neutral' as const },
};

const ACTION_STATUS_CONFIG = {
  OPEN: { color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
  IN_PROGRESS: { color: 'text-amber-500', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
  COMPLETED: { color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500/40' },
  BLOCKED: { color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/40' },
};

const PRIORITY_CONFIG = {
  HIGH: { color: 'text-red-500', bg: 'bg-red-500/20' },
  MEDIUM: { color: 'text-amber-500', bg: 'bg-amber-500/20' },
  LOW: { color: 'text-gray-500', bg: 'bg-gray-500/20' },
};

export default function PostmortemDetailView({
  postmortem,
  users = [],
  canEdit = false,
  incidentId,
}: PostmortemDetailViewProps) {
  const { userTimeZone } = useTimezone();

  // Parse data
  const parseTimeline = (timeline: any): TimelineEvent[] => {
    if (!timeline || !Array.isArray(timeline)) return [];
    return timeline.map((e: any) => ({
      id: e.id || `event-${Date.now()}`,
      timestamp: e.timestamp || new Date().toISOString(),
      type: e.type || 'DETECTION',
      title: e.title || '',
      description: e.description || '',
      actor: e.actor,
    }));
  };

  const parseImpact = (impact: any): ImpactMetrics => {
    if (!impact || typeof impact !== 'object') return {};
    return {
      usersAffected: impact.usersAffected,
      downtimeMinutes: impact.downtimeMinutes,
      errorRate: impact.errorRate,
      servicesAffected: Array.isArray(impact.servicesAffected) ? impact.servicesAffected : [],
      slaBreaches: impact.slaBreaches,
      revenueImpact: impact.revenueImpact,
      apiErrors: impact.apiErrors,
      performanceDegradation: impact.performanceDegradation,
    };
  };

  const parseActionItems = (actionItems: any): ActionItem[] => {
    if (!actionItems || !Array.isArray(actionItems)) return [];
    return actionItems.map((item: any) => ({
      id: item.id || `action-${Date.now()}`,
      title: item.title || '',
      description: item.description || '',
      owner: item.owner,
      dueDate: item.dueDate,
      status: item.status || 'OPEN',
      priority: item.priority || 'MEDIUM',
    }));
  };

  const timelineEvents = parseTimeline(postmortem.timeline);
  const impactMetrics = parseImpact(postmortem.impact);
  const actionItems = parseActionItems(postmortem.actionItems);

  const completedActions = actionItems.filter(item => item.status === 'COMPLETED').length;
  const totalActions = actionItems.length;
  const completionRate = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  const statusConfig =
    STATUS_CONFIG[postmortem.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-white to-slate-50 shadow-lg overflow-hidden relative">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[radial-gradient(circle,rgba(211,47,47,0.05)_0%,transparent_70%)] rounded-full translate-x-[30%] -translate-y-[30%] pointer-events-none" />

        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-br from-slate-800 to-slate-500 bg-clip-text text-transparent tracking-tight leading-tight">
                {postmortem.title}
              </h1>
              <p className="text-muted-foreground">
                Postmortem for{' '}
                <Link
                  href={`/incidents/${postmortem.incident.id}`}
                  className="text-primary no-underline font-medium hover:underline"
                >
                  {postmortem.incident.title}
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              {canEdit && (
                <Link href={`/postmortems/${incidentId}?edit=true`}>
                  <Button>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Postmortem
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex gap-4 pt-4 border-t border-slate-200 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <UserAvatar
                userId={postmortem.createdBy.id}
                name={postmortem.createdBy.name}
                gender={postmortem.createdBy.gender}
                size="xs"
              />
              Created by <strong>{postmortem.createdBy.name}</strong>
            </span>
            <span>•</span>
            <span>{formatDateTime(postmortem.createdAt, userTimeZone, { format: 'date' })}</span>
            {postmortem.publishedAt && (
              <>
                <span>•</span>
                <span>
                  Published{' '}
                  {formatDateTime(postmortem.publishedAt, userTimeZone, { format: 'date' })}
                </span>
              </>
            )}
            {postmortem.incident.resolvedAt && (
              <>
                <span>•</span>
                <span>
                  Resolved{' '}
                  {formatDateTime(postmortem.incident.resolvedAt, userTimeZone, { format: 'date' })}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      {postmortem.summary && (
        <Card className="bg-gradient-to-br from-white to-slate-50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-primary to-red-500 rounded" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed pl-6">
              {postmortem.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {timelineEvents.length > 0 && (
        <PostmortemTimeline
          events={timelineEvents}
          incidentStartTime={
            postmortem.incident.resolvedAt ? undefined : new Date(postmortem.createdAt)
          }
          incidentEndTime={postmortem.incident.resolvedAt || undefined}
        />
      )}

      {/* Impact Metrics */}
      {Object.keys(impactMetrics).length > 0 && <PostmortemImpactMetrics metrics={impactMetrics} />}

      {/* Root Cause & Resolution */}
      {(postmortem.rootCause || postmortem.resolution) && (
        <Card className="bg-gradient-to-br from-white to-slate-50 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Analysis</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {postmortem.rootCause && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Root Cause</h3>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {postmortem.rootCause}
                </p>
              </div>
            )}
            {postmortem.resolution && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Resolution</h3>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {postmortem.resolution}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {actionItems.length > 0 && (
        <Card className="bg-gradient-to-br from-white to-slate-50 shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Action Items</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {completedActions}/{totalActions} completed
                </span>
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      completionRate === 100 ? 'bg-green-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {actionItems.map(item => {
              const owner = users.find(u => u.id === item.owner);
              const isOverdue =
                item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'COMPLETED';
              const statusCfg = ACTION_STATUS_CONFIG[item.status];
              const priorityCfg = PRIORITY_CONFIG[item.priority];

              return (
                <div
                  key={item.id}
                  className={cn('p-4 bg-white rounded-md border-2 border-l-4', statusCfg.border)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-semibold',
                            statusCfg.bg,
                            statusCfg.color
                          )}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-semibold',
                            priorityCfg.bg,
                            priorityCfg.color
                          )}
                        >
                          {item.priority} Priority
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-500">
                            Overdue
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-semibold mb-1">{item.title}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
                      )}
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {owner && (
                          <span className="flex items-center gap-1">
                            <UserAvatar
                              userId={owner.id}
                              name={owner.name}
                              gender={owner.gender}
                              size="xs"
                            />
                            {owner.name}
                          </span>
                        )}
                        {item.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due: {formatDateTime(item.dueDate, userTimeZone, { format: 'date' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Lessons Learned */}
      {postmortem.lessons && (
        <Card className="bg-gradient-to-br from-white to-slate-50 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Lessons Learned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {postmortem.lessons}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

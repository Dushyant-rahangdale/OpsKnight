'use client';

import { useState, useTransition } from 'react';
import { upsertPostmortem, type PostmortemData } from '@/app/(app)/postmortems/actions';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { Label } from '@/components/ui/shadcn/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import { useRouter } from 'next/navigation';
import PostmortemTimelineBuilder, {
  type TimelineEvent,
} from './postmortem/PostmortemTimelineBuilder';
import PostmortemImpactInput, { type ImpactMetrics } from './postmortem/PostmortemImpactInput';
import PostmortemActionItems, { type ActionItem } from './postmortem/PostmortemActionItems';
import { useTimezone } from '@/contexts/TimezoneContext';
import { formatDateTime } from '@/lib/timezone';
import { AlertCircle, Loader2 } from 'lucide-react';

type PostmortemFormProps = {
  incidentId: string;
  initialData?: {
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
    isPublic?: boolean | null;
  };
  users?: Array<{ id: string; name: string; email: string }>;
  resolvedIncidents?: Array<{
    id: string;
    title: string;
    resolvedAt: Date | null;
    service: {
      name: string;
    };
  }>;
};

export default function PostmortemForm({
  incidentId,
  initialData,
  users = [],
  resolvedIncidents = [],
}: PostmortemFormProps) {
  const router = useRouter();
  const { userTimeZone } = useTimezone();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidentId || '');

  // Parse initial data with proper types
  const parseTimeline = (timeline: any): TimelineEvent[] => {
    if (!timeline || !Array.isArray(timeline)) return [];
    return timeline.map((e: any) => ({
      id: e.id || `event-${Date.now()}-${Math.random()}`,
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
      id: item.id || `action-${Date.now()}-${Math.random()}`,
      title: item.title || '',
      description: item.description || '',
      owner: item.owner,
      dueDate: item.dueDate,
      status: item.status || 'OPEN',
      priority: item.priority || 'MEDIUM',
    }));
  };

  const [formData, setFormData] = useState<PostmortemData>({
    title: initialData?.title || '',
    summary: initialData?.summary || '',
    rootCause: initialData?.rootCause || '',
    resolution: initialData?.resolution || '',
    lessons: initialData?.lessons || '',
    status: (initialData?.status as any) || 'DRAFT', // eslint-disable-line @typescript-eslint/no-explicit-any
    isPublic: initialData?.isPublic ?? true,
    timeline: initialData?.timeline || [],
    impact: initialData?.impact || {},
    actionItems: initialData?.actionItems || [],
  });

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(
    parseTimeline(initialData?.timeline)
  );
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics>(
    parseImpact(initialData?.impact)
  );
  const [actionItems, setActionItems] = useState<ActionItem[]>(
    parseActionItems(initialData?.actionItems)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetIncidentId = selectedIncidentId || incidentId;

    if (!targetIncidentId) {
      setError('Please select an incident');
      return;
    }

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    // Combine all data before submitting
    const submitData: PostmortemData = {
      ...formData,
      timeline: timelineEvents,
      impact: impactMetrics,
      actionItems: actionItems,
    };

    startTransition(async () => {
      try {
        const result = await upsertPostmortem(targetIncidentId, submitData);
        if (result.success) {
          router.push(`/postmortems/${targetIncidentId}`);
          router.refresh();
        } else {
          setError('Failed to save postmortem');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to save postmortem');
      }
    });
  };

  const selectedIncident = resolvedIncidents.find(inc => inc.id === selectedIncidentId);

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-6">
        {/* Incident Selection - Only show if no incidentId provided and we have resolved incidents */}
        {!incidentId && resolvedIncidents.length > 0 && (
          <Card className="bg-gradient-to-br from-white to-slate-50 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Select Incident</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label>Resolved Incident</Label>
                <Select value={selectedIncidentId} onValueChange={setSelectedIncidentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resolved incident..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resolvedIncidents.map(incident => (
                      <SelectItem key={incident.id} value={incident.id}>
                        {incident.title} ({incident.service.name}) - Resolved{' '}
                        {incident.resolvedAt
                          ? formatDateTime(incident.resolvedAt, userTimeZone, { format: 'date' })
                          : 'N/A'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the incident for which you want to create a postmortem
                </p>
              </div>
              {selectedIncident && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/40 rounded-md">
                  <div className="text-sm text-muted-foreground">
                    <strong>Selected:</strong> {selectedIncident.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Service: {selectedIncident.service.name} • Resolved:{' '}
                    {selectedIncident.resolvedAt
                      ? formatDateTime(selectedIncident.resolvedAt, userTimeZone, {
                          format: 'date',
                        })
                      : 'N/A'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Basic Information */}
        <Card className="bg-gradient-to-br from-white to-slate-50 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Database Connection Pool Exhaustion"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Executive Summary</Label>
              <Textarea
                rows={4}
                value={formData.summary || ''}
                onChange={e => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Provide a high-level summary for stakeholders..."
              />
              <p className="text-xs text-muted-foreground">
                Brief overview of the incident and its impact
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={formData.status || 'DRAFT'}
                  onValueChange={value => setFormData({ ...formData, status: value as any })} // eslint-disable-line @typescript-eslint/no-explicit-any
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Visibility</Label>
                <Select
                  value={formData.isPublic ? 'public' : 'private'}
                  onValueChange={value =>
                    setFormData({ ...formData, isPublic: value === 'public' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (shown on status page)</SelectItem>
                    <SelectItem value="private">Private (internal only)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Private postmortems are not shown on the public status page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="bg-gradient-to-br from-white to-slate-50 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Incident Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <PostmortemTimelineBuilder events={timelineEvents} onChange={setTimelineEvents} />
          </CardContent>
        </Card>

        {/* Impact Metrics */}
        <PostmortemImpactInput metrics={impactMetrics} onChange={setImpactMetrics} />

        {/* Root Cause & Resolution */}
        <Card className="bg-gradient-to-br from-white to-slate-50 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Analysis</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>Root Cause Analysis</Label>
              <Textarea
                rows={6}
                value={formData.rootCause || ''}
                onChange={e => setFormData({ ...formData, rootCause: e.target.value })}
                placeholder="Describe the root cause in detail..."
              />
              <p className="text-xs text-muted-foreground">
                What was the underlying cause of this incident?
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Resolution</Label>
              <Textarea
                rows={4}
                value={formData.resolution || ''}
                onChange={e => setFormData({ ...formData, resolution: e.target.value })}
                placeholder="Describe the steps taken to resolve the incident..."
              />
              <p className="text-xs text-muted-foreground">How was the incident resolved?</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        <PostmortemActionItems actionItems={actionItems} onChange={setActionItems} users={users} />

        {/* Lessons Learned */}
        <Card className="bg-gradient-to-br from-white to-slate-50 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Lessons Learned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label>Lessons Learned</Label>
              <Textarea
                rows={6}
                value={formData.lessons || ''}
                onChange={e => setFormData({ ...formData, lessons: e.target.value })}
                placeholder="Document key learnings and preventive measures..."
              />
              <p className="text-xs text-muted-foreground">
                What did we learn? How can we prevent this in the future?
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {initialData ? 'Update' : 'Create'} Postmortem
          </Button>
        </div>
      </div>
    </form>
  );
}

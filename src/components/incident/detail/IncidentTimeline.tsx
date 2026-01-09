'use client';

import _TimelineEvent from '../TimelineEvent';
import { useTimezone } from '@/contexts/TimezoneContext';
import { formatDateTime } from '@/lib/timezone';
import { Clock, AlertCircle, CheckCircle2, Target, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type Event = {
  id: string;
  message: string;
  createdAt: Date;
};

type IncidentTimelineProps = {
  events: Event[];
  incidentCreatedAt?: Date;
  incidentAcknowledgedAt?: Date | null;
  incidentResolvedAt?: Date | null;
};

export default function IncidentTimeline({
  events,
  incidentCreatedAt,
  incidentAcknowledgedAt,
  incidentResolvedAt,
}: IncidentTimelineProps) {
  const { userTimeZone } = useTimezone();

  const formatEscalationMessage = (message: string) => {
    const match = message.match(/\[\[scheduledAt=([^\]]+)\]\]/);
    if (!match) {
      return message;
    }

    const scheduledAtRaw = match[1];
    const scheduledAt = new Date(scheduledAtRaw);
    if (Number.isNaN(scheduledAt.getTime())) {
      return message.replace(match[0], scheduledAtRaw);
    }

    const formatted = formatDateTime(scheduledAt, userTimeZone, { format: 'datetime' });
    return message.replace(match[0], formatted);
  };

  // Create a comprehensive timeline with incident lifecycle events
  const timelineEvents: Array<{
    id: string;
    message: string;
    createdAt: Date;
    type: 'CREATED' | 'ACKNOWLEDGED' | 'RESOLVED' | 'EVENT';
  }> = [];

  // Add incident creation
  if (incidentCreatedAt) {
    timelineEvents.push({
      id: 'incident-created',
      message: 'Incident triggered and created',
      createdAt: incidentCreatedAt,
      type: 'CREATED',
    });
  }

  // Add acknowledgment
  if (incidentAcknowledgedAt) {
    timelineEvents.push({
      id: 'incident-acknowledged',
      message: 'Incident acknowledged by responder',
      createdAt: incidentAcknowledgedAt,
      type: 'ACKNOWLEDGED',
    });
  }

  // Add resolution
  if (incidentResolvedAt) {
    timelineEvents.push({
      id: 'incident-resolved',
      message: 'Incident marked as resolved',
      createdAt: incidentResolvedAt,
      type: 'RESOLVED',
    });
  }

  // Add regular events
  events.forEach(event => {
    timelineEvents.push({
      ...event,
      type: 'EVENT',
    });
  });

  // Sort by date (oldest first for timeline)
  timelineEvents.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const getEventConfig = (type: string) => {
    switch (type) {
      case 'CREATED':
        return {
          iconBg: 'bg-gradient-to-br from-rose-500 to-red-600',
          cardBg: 'bg-gradient-to-br from-rose-50 to-red-50',
          border: 'border-rose-200',
          textColor: 'text-rose-700',
          icon: <AlertCircle className="h-4 w-4 text-white" />,
          label: 'Created',
        };
      case 'ACKNOWLEDGED':
        return {
          iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
          cardBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
          border: 'border-amber-200',
          textColor: 'text-amber-700',
          icon: <CheckCircle2 className="h-4 w-4 text-white" />,
          label: 'Acknowledged',
        };
      case 'RESOLVED':
        return {
          iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
          cardBg: 'bg-gradient-to-br from-emerald-50 to-green-50',
          border: 'border-emerald-200',
          textColor: 'text-emerald-700',
          icon: <Target className="h-4 w-4 text-white" />,
          label: 'Resolved',
        };
      default:
        return {
          iconBg: 'bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary)]',
          cardBg: 'bg-gradient-to-br from-white to-[var(--color-neutral-50)]',
          border: 'border-[var(--border)]',
          textColor: 'text-[var(--text-primary)]',
          icon: <Activity className="h-4 w-4 text-white" />,
          label: 'Event',
        };
    }
  };

  if (timelineEvents.length === 0) {
    return (
      <div className="py-12 px-8 text-center bg-gradient-to-br from-white to-[var(--color-neutral-50)] border border-[var(--border)] rounded-[var(--radius-lg)]">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--color-neutral-100)] flex items-center justify-center">
          <Clock className="h-6 w-6 text-[var(--text-muted)]" />
        </div>
        <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">
          No timeline events yet
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Events will appear here as the incident progresses.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      {/* Timeline Line */}
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-rose-400 via-amber-400 to-emerald-400 rounded-full" />

      <div className="space-y-4">
        {timelineEvents.map((event, index) => {
          const config = getEventConfig(event.type);
          const isLast = index === timelineEvents.length - 1;

          return (
            <div key={event.id} className="relative">
              {/* Timeline Dot */}
              <div
                className={cn(
                  'absolute -left-5 top-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10',
                  config.iconBg
                )}
              >
                {config.icon}
              </div>

              {/* Event Card */}
              <div
                className={cn(
                  'rounded-[var(--radius-md)] border p-4 transition-all hover:shadow-[var(--shadow-md)]',
                  config.cardBg,
                  config.border
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                      config.iconBg,
                      'text-white'
                    )}
                  >
                    {config.label}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] tabular-nums font-medium">
                    {formatDateTime(event.createdAt, userTimeZone, { format: 'datetime' })}
                  </span>
                </div>

                {/* Message */}
                <p className={cn('text-sm leading-relaxed font-medium', config.textColor)}>
                  {formatEscalationMessage(event.message)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

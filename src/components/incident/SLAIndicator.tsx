'use client';

import { memo, useMemo } from 'react';
import { calculateMTTA, calculateMTTR, checkAckSLA, checkResolveSLA } from '@/lib/sla';
import { formatTimeMinutesMs } from '@/lib/time-format';
import {
  getPrioritySLATarget,
  checkPriorityAckSLA,
  checkPriorityResolveSLA,
} from '@/lib/sla-priority';
import { Incident, Service } from '@prisma/client';
import { CheckCircle2, XCircle, Timer, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type SLAIndicatorProps = {
  incident: Incident;
  service: Service;
  showDetails?: boolean;
};

function SLAIndicator({ incident, service, showDetails = false }: SLAIndicatorProps) {
  const {
    mtta,
    mttr,
    ackSlaMet,
    resolveSlaMet,
    ackTimeRemaining,
    resolveTimeRemaining,
    targetAckMinutes,
    targetResolveMinutes,
  } = useMemo(() => {
    const mtta = calculateMTTA(incident);
    const mttr = calculateMTTR(incident);

    const priorityTarget = getPrioritySLATarget(incident.priority, service);
    const ackSlaMet = incident.acknowledgedAt
      ? incident.priority
        ? checkPriorityAckSLA(incident, service)
        : checkAckSLA(incident, service)
      : null;
    const resolveSlaMet = incident.resolvedAt
      ? incident.priority
        ? checkPriorityResolveSLA(incident, service)
        : checkResolveSLA(incident, service)
      : null;

    const targetAckMinutes = priorityTarget.ack;
    const targetResolveMinutes = priorityTarget.resolve;

    const now = new Date();
    const timeSinceCreation = (now.getTime() - incident.createdAt.getTime()) / (1000 * 60);
    const ackTimeRemaining =
      incident.status === 'OPEN' && !incident.acknowledgedAt
        ? targetAckMinutes - timeSinceCreation
        : null;
    const resolveTimeRemaining =
      incident.status !== 'RESOLVED' && !incident.resolvedAt
        ? targetResolveMinutes - timeSinceCreation
        : null;

    return {
      mtta,
      mttr,
      ackSlaMet,
      resolveSlaMet,
      ackTimeRemaining,
      resolveTimeRemaining,
      targetAckMinutes,
      targetResolveMinutes,
    };
  }, [incident, service]);

  // Compact mode for inline usage
  if (!showDetails) {
    return (
      <div className="flex gap-2 flex-wrap">
        {incident.acknowledgedAt && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
              ackSlaMet
                ? 'bg-[var(--badge-success-bg)] text-[var(--badge-success-text)]'
                : 'bg-[var(--badge-error-bg)] text-[var(--badge-error-text)]'
            )}
          >
            {ackSlaMet ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            Ack {ackSlaMet ? 'Met' : 'Breached'}
          </span>
        )}
        {incident.resolvedAt && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
              resolveSlaMet
                ? 'bg-[var(--badge-success-bg)] text-[var(--badge-success-text)]'
                : 'bg-[var(--badge-error-bg)] text-[var(--badge-error-text)]'
            )}
          >
            {resolveSlaMet ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            Resolve {resolveSlaMet ? 'Met' : 'Breached'}
          </span>
        )}
        {!incident.acknowledgedAt && !incident.resolvedAt && (
          <span className="text-sm text-[var(--text-muted)]">
            {ackTimeRemaining && ackTimeRemaining > 0
              ? `${Math.round(ackTimeRemaining)}m to acknowledge`
              : 'SLA breached'}
          </span>
        )}
      </div>
    );
  }

  // Detailed mode
  return (
    <div className="space-y-4">
      {/* Acknowledgement SLA */}
      <div className="p-4 bg-gradient-to-br from-white to-[var(--color-neutral-50)] border border-[var(--border)] rounded-[var(--radius-md)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Acknowledgement</span>
          {incident.acknowledgedAt ? (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                ackSlaMet
                  ? 'bg-[var(--badge-success-bg)] text-[var(--badge-success-text)]'
                  : 'bg-[var(--badge-error-bg)] text-[var(--badge-error-text)]'
              )}
            >
              {ackSlaMet ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {ackSlaMet ? 'Met' : 'Breached'}
            </span>
          ) : (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                ackTimeRemaining && ackTimeRemaining > 0
                  ? 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-text)]'
                  : 'bg-[var(--badge-error-bg)] text-[var(--badge-error-text)]'
              )}
            >
              {ackTimeRemaining && ackTimeRemaining > 0 ? (
                <>
                  <Timer className="h-3 w-3" />
                  {Math.round(ackTimeRemaining)}m left
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Breached
                </>
              )}
            </span>
          )}
        </div>
        {mtta !== null && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <TrendingUp className="h-3 w-3" />
            <span>
              Time: {formatTimeMinutesMs(mtta)} / Target: {targetAckMinutes}m
            </span>
          </div>
        )}
      </div>

      {/* Resolution SLA */}
      <div className="p-4 bg-gradient-to-br from-white to-[var(--color-neutral-50)] border border-[var(--border)] rounded-[var(--radius-md)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Resolution</span>
          {incident.resolvedAt ? (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                resolveSlaMet
                  ? 'bg-[var(--badge-success-bg)] text-[var(--badge-success-text)]'
                  : 'bg-[var(--badge-error-bg)] text-[var(--badge-error-text)]'
              )}
            >
              {resolveSlaMet ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {resolveSlaMet ? 'Met' : 'Breached'}
            </span>
          ) : (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                resolveTimeRemaining && resolveTimeRemaining > 0
                  ? 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-text)]'
                  : 'bg-[var(--badge-error-bg)] text-[var(--badge-error-text)]'
              )}
            >
              {resolveTimeRemaining && resolveTimeRemaining > 0 ? (
                <>
                  <Timer className="h-3 w-3" />
                  {Math.round(resolveTimeRemaining)}m left
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Breached
                </>
              )}
            </span>
          )}
        </div>
        {mttr !== null && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <TrendingUp className="h-3 w-3" />
            <span>
              Time: {formatTimeMinutesMs(mttr)} / Target: {targetResolveMinutes}m
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(SLAIndicator, (prevProps, nextProps) => {
  return (
    prevProps.incident.id === nextProps.incident.id &&
    prevProps.incident.status === nextProps.incident.status &&
    prevProps.incident.acknowledgedAt?.getTime() === nextProps.incident.acknowledgedAt?.getTime() &&
    prevProps.incident.resolvedAt?.getTime() === nextProps.incident.resolvedAt?.getTime() &&
    prevProps.incident.priority === nextProps.incident.priority &&
    prevProps.service.id === nextProps.service.id &&
    prevProps.showDetails === nextProps.showDetails
  );
});

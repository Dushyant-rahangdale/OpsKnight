'use client';

import { useState } from 'react';
import { IncidentStatus } from '@prisma/client';
import SnoozeDurationDialog from './SnoozeDurationDialog';
import { snoozeIncidentWithDuration } from '@/app/(app)/incidents/snooze-actions';
import { Button } from '@/components/ui/shadcn/button';
import { Check, X, Clock, BellOff, Bell, Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type IncidentStatusActionsProps = {
  incidentId: string;
  currentStatus: IncidentStatus;
  onAcknowledge: () => void;
  onUnacknowledge: () => void;
  onSnooze: () => void;
  onUnsnooze: () => void;
  onSuppress: () => void;
  onUnsuppress: () => void;
  canManage: boolean;
};

export default function IncidentStatusActions({
  incidentId,
  currentStatus,
  onAcknowledge,
  onUnacknowledge,
  onSnooze: _onSnooze,
  onUnsnooze,
  onSuppress,
  onUnsuppress,
  canManage,
}: IncidentStatusActionsProps) {
  const [showSnoozeDialog, setShowSnoozeDialog] = useState(false);

  if (!canManage) {
    return (
      <div className="p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 rounded-[var(--radius-md)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-warning)]/20 flex items-center justify-center shrink-0">
            <Lock className="h-4 w-4 text-[var(--color-warning)]" />
          </div>
          <p className="text-sm text-[var(--color-warning-dark)] font-medium">
            Responder role required to manage this incident
          </p>
        </div>
      </div>
    );
  }

  const isResolved = currentStatus === 'RESOLVED';
  const isSnoozed = currentStatus === 'SNOOZED';
  const isSuppressed = currentStatus === 'SUPPRESSED';
  const isAcknowledged = currentStatus === 'ACKNOWLEDGED';

  return (
    <div className="space-y-3">
      {/* Primary Action */}
      {isAcknowledged ? (
        <form action={onUnacknowledge}>
          <Button
            type="submit"
            variant="outline"
            className="w-full justify-center h-11 font-semibold text-[var(--color-error)] border-[var(--color-error)]/30 bg-[var(--color-error)]/5 hover:bg-[var(--color-error)]/10 hover:border-[var(--color-error)]/50"
          >
            <X className="h-4 w-4 mr-2" />
            Unacknowledge Incident
          </Button>
        </form>
      ) : (
        !isSuppressed &&
        !isResolved &&
        !isSnoozed && (
          <form action={onAcknowledge}>
            <Button
              type="submit"
              className="w-full justify-center h-11 font-semibold bg-gradient-to-r from-[var(--color-warning)] to-amber-500 hover:from-amber-500 hover:to-[var(--color-warning)] text-white shadow-[var(--shadow-primary)]"
            >
              <Check className="h-4 w-4 mr-2" />
              Acknowledge Incident
            </Button>
          </form>
        )
      )}

      {isSnoozed && (
        <form action={onAcknowledge}>
          <Button
            type="submit"
            className="w-full justify-center h-11 font-semibold bg-gradient-to-r from-[var(--color-warning)] to-amber-500 hover:from-amber-500 hover:to-[var(--color-warning)] text-white shadow-[var(--shadow-primary)]"
          >
            <Check className="h-4 w-4 mr-2" />
            Acknowledge Incident
          </Button>
        </form>
      )}

      {/* Secondary Actions */}
      {!isResolved && (
        <div className="grid grid-cols-2 gap-2">
          {isSnoozed ? (
            <form action={onUnsnooze} className="col-span-1">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs font-semibold"
              >
                <Bell className="h-3.5 w-3.5 mr-1.5" />
                Unsnooze
              </Button>
            </form>
          ) : (
            !isSuppressed && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs font-semibold"
                onClick={() => setShowSnoozeDialog(true)}
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Snooze
              </Button>
            )
          )}

          {isSuppressed ? (
            <form action={onUnsuppress} className="col-span-1">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs font-semibold"
              >
                <Bell className="h-3.5 w-3.5 mr-1.5" />
                Unsuppress
              </Button>
            </form>
          ) : (
            !isSnoozed && (
              <form action={onSuppress} className="col-span-1">
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs font-semibold"
                >
                  <BellOff className="h-3.5 w-3.5 mr-1.5" />
                  Suppress
                </Button>
              </form>
            )
          )}
        </div>
      )}

      {showSnoozeDialog && (
        <SnoozeDurationDialog
          incidentId={incidentId}
          onClose={() => setShowSnoozeDialog(false)}
          onSnooze={snoozeIncidentWithDuration}
        />
      )}
    </div>
  );
}

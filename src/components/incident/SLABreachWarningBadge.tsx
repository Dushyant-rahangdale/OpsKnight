'use client';

import { memo, useMemo } from 'react';
import { Incident, Service } from '@prisma/client';
import { getPrioritySLATarget } from '@/lib/sla-priority';

/**
 * SLA Breach Warning Badge
 * 
 * Displays a prominent warning indicator for incidents nearing SLA breach.
 * Shows pulsing animation for critical warnings.
 */

type SLABreachWarningBadgeProps = {
    incident: Incident;
    service: Service;
    /** Warning threshold in minutes before breach */
    ackWarningMinutes?: number;
    resolveWarningMinutes?: number;
};

type BreachStatus = 'none' | 'ack-warning' | 'resolve-warning' | 'ack-breached' | 'resolve-breached';

function SLABreachWarningBadge({
    incident,
    service,
    ackWarningMinutes = 5,
    resolveWarningMinutes = 15
}: SLABreachWarningBadgeProps) {
    const { status, timeRemainingMinutes, targetType } = useMemo(() => {
        // Get priority-based or default SLA targets
        const priorityTarget = getPrioritySLATarget(incident.priority, service);
        const targetAckMs = priorityTarget.ack * 60 * 1000;
        const targetResolveMs = priorityTarget.resolve * 60 * 1000;

        // Check if already resolved
        if (incident.status === 'RESOLVED') {
            return { status: 'none' as BreachStatus, timeRemainingMinutes: 0, targetType: null };
        }

        const createdAt = new Date(incident.createdAt);
        const acknowledgedAt = incident.acknowledgedAt ? new Date(incident.acknowledgedAt) : null;

        const now = new Date();
        const elapsedMs = now.getTime() - createdAt.getTime();

        // Check ack SLA first (only if not acknowledged)
        if (!incident.acknowledgedAt) {
            const ackRemainingMs = targetAckMs - elapsedMs;
            const ackRemainingMinutes = ackRemainingMs / (60 * 1000);

            if (ackRemainingMs <= 0) {
                return { status: 'ack-breached' as BreachStatus, timeRemainingMinutes: 0, targetType: 'ack' };
            }
            if (ackRemainingMinutes <= ackWarningMinutes) {
                return { status: 'ack-warning' as BreachStatus, timeRemainingMinutes: Math.round(ackRemainingMinutes), targetType: 'ack' };
            }
        }

        // Check resolve SLA
        const resolveRemainingMs = targetResolveMs - elapsedMs;
        const resolveRemainingMinutes = resolveRemainingMs / (60 * 1000);

        if (resolveRemainingMs <= 0) {
            return { status: 'resolve-breached' as BreachStatus, timeRemainingMinutes: 0, targetType: 'resolve' };
        }
        if (resolveRemainingMinutes <= resolveWarningMinutes) {
            return { status: 'resolve-warning' as BreachStatus, timeRemainingMinutes: Math.round(resolveRemainingMinutes), targetType: 'resolve' };
        }

        return { status: 'none' as BreachStatus, timeRemainingMinutes: 0, targetType: null };
    }, [incident, service, ackWarningMinutes, resolveWarningMinutes]);

    // Don't render if no warning
    if (status === 'none') {
        return null;
    }

    const isBreached = status.includes('breached');
    const isWarning = status.includes('warning');
    const typeLabel = targetType === 'ack' ? 'ACK' : 'RESOLVE';

    const styles = {
        container: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '0px',
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            animation: isBreached ? 'pulse 1.5s ease-in-out infinite' : isWarning ? 'pulse-slow 2s ease-in-out infinite' : 'none',
            background: isBreached ? '#dc2626' : '#f59e0b',
            color: '#ffffff',
            border: `1px solid ${isBreached ? '#b91c1c' : '#d97706'}`,
        },
        icon: {
            fontSize: '0.8rem',
        }
    };

    // Add keyframe styles via inline style tag
    const keyframes = `
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.02); }
        }
        @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.85; }
        }
    `;

    return (
        <>
            <style>{keyframes}</style>
            <span style={styles.container} title={`SLA ${typeLabel} ${isBreached ? 'BREACHED' : 'warning'}`}>
                <span style={styles.icon}>{isBreached ? '⚠️' : '⏰'}</span>
                {isBreached ? (
                    <span>{typeLabel} BREACHED</span>
                ) : (
                    <span>{timeRemainingMinutes}m to {typeLabel}</span>
                )}
            </span>
        </>
    );
}

export default memo(SLABreachWarningBadge, (prevProps, nextProps) => {
    return (
        prevProps.incident.id === nextProps.incident.id &&
        prevProps.incident.status === nextProps.incident.status &&
        prevProps.incident.acknowledgedAt?.getTime() === nextProps.incident.acknowledgedAt?.getTime() &&
        prevProps.incident.createdAt.getTime() === nextProps.incident.createdAt.getTime() &&
        prevProps.service.id === nextProps.service.id
    );
});

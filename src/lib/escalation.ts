import prisma from './prisma';
import { sendNotification, NotificationChannel } from './notifications';
import { buildScheduleBlocks } from './oncall';

/**
 * Get the current on-call user for a schedule at a given time
 */
async function getOnCallUserForSchedule(scheduleId: string, atTime: Date): Promise<string | null> {
    const schedule = await prisma.onCallSchedule.findUnique({
        where: { id: scheduleId },
        include: {
            layers: {
                include: {
                    users: {
                        include: { user: true },
                        orderBy: { position: 'asc' }
                    }
                }
            },
            overrides: {
                where: {
                    start: { lte: atTime },
                    end: { gt: atTime }
                },
                include: {
                    user: true
                }
            }
        }
    });

    if (!schedule || schedule.layers.length === 0) {
        return null;
    }

    // Build schedule blocks to find who's on-call
    const windowStart = new Date(atTime);
    windowStart.setHours(0, 0, 0, 0);
    const windowEnd = new Date(atTime);
    windowEnd.setHours(23, 59, 59, 999);

    const blocks = buildScheduleBlocks(
        schedule.layers.map(layer => ({
            id: layer.id,
            name: layer.name,
            start: layer.start,
            end: layer.end,
            rotationLengthHours: layer.rotationLengthHours,
            users: layer.users.map(lu => ({
                userId: lu.userId,
                user: { name: lu.user.name },
                position: lu.position
            }))
        })),
        schedule.overrides.map(override => ({
            id: override.id,
            userId: override.userId,
            user: { name: override.user.name },
            start: override.start,
            end: override.end,
            replacesUserId: override.replacesUserId
        })),
        windowStart,
        windowEnd
    );

    // Find the block that covers the current time
    const activeBlock = blocks.find(block => 
        block.start.getTime() <= atTime.getTime() && 
        block.end.getTime() > atTime.getTime()
    );

    return activeBlock?.userId || null;
}

/**
 * Get all users in a team
 */
async function getTeamUsers(teamId: string): Promise<string[]> {
    const members = await prisma.teamMember.findMany({
        where: { teamId },
        select: { userId: true }
    });
    return members.map(m => m.userId);
}

/**
 * Resolve escalation target to a list of user IDs
 * Currently supports: User (direct), Team (all members), Schedule (on-call user)
 * Future: Could support Schedule (all on-call users across layers)
 */
export async function resolveEscalationTarget(
    targetType: 'USER' | 'TEAM' | 'SCHEDULE',
    targetId: string,
    atTime: Date = new Date()
): Promise<string[]> {
    switch (targetType) {
        case 'USER':
            return [targetId];
        
        case 'TEAM':
            return await getTeamUsers(targetId);
        
        case 'SCHEDULE':
            const onCallUserId = await getOnCallUserForSchedule(targetId, atTime);
            return onCallUserId ? [onCallUserId] : [];
        
        default:
            return [];
    }
}

/**
 * Execute escalation policy for an incident.
 * Handles multiple steps with delays and different target types.
 */
export async function executeEscalation(incidentId: string, stepIndex?: number) {
    const incident = await prisma.incident.findUnique({
        where: { id: incidentId },
        include: {
            service: {
                include: {
                    policy: {
                        include: {
                            steps: {
                                include: { 
                                    targetUser: true,
                                    targetTeam: true,
                                    targetSchedule: true
                                },
                                orderBy: { stepOrder: 'asc' }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!incident?.service?.policy?.steps?.length) {
        // Clear escalation status if no policy
        await prisma.incident.update({
            where: { id: incidentId },
            data: {
                escalationStatus: null,
                nextEscalationAt: null,
                currentEscalationStep: null
            }
        });
        return { escalated: false, reason: 'No escalation policy configured' };
    }

    // Use provided stepIndex, or currentEscalationStep from DB, or default to 0
    const currentStepIndex = stepIndex ?? incident.currentEscalationStep ?? 0;

    if (currentStepIndex >= incident.service.policy.steps.length) {
        // Mark escalation as completed
        await prisma.incident.update({
            where: { id: incidentId },
            data: {
                escalationStatus: 'COMPLETED',
                nextEscalationAt: null,
                currentEscalationStep: null
            }
        });
        return { escalated: false, reason: 'All escalation steps exhausted' };
    }

    const step = incident.service.policy.steps[currentStepIndex];
    
    // Resolve target based on target type
    let targetId: string | null = null;
    let targetName: string = 'Unknown';
    
    switch (step.targetType) {
        case 'USER':
            targetId = step.targetUserId || null;
            targetName = step.targetUser?.name || 'Unknown User';
            break;
        case 'TEAM':
            targetId = step.targetTeamId || null;
            targetName = step.targetTeam?.name || 'Unknown Team';
            break;
        case 'SCHEDULE':
            targetId = step.targetScheduleId || null;
            targetName = step.targetSchedule?.name || 'Unknown Schedule';
            break;
    }

    // Initialize escalation status if this is the first step
    if (currentStepIndex === 0 && !incident.escalationStatus) {
        await prisma.incident.update({
            where: { id: incidentId },
            data: {
                escalationStatus: 'ESCALATING',
                currentEscalationStep: 0
            }
        });
    }

    if (!targetId) {
        await prisma.incidentEvent.create({
            data: {
                incidentId,
                message: `Escalation step ${currentStepIndex + 1} has invalid target configuration. Skipping.`
            }
        });
        // Try next step
        if (currentStepIndex < incident.service.policy.steps.length - 1) {
            return executeEscalation(incidentId, currentStepIndex + 1);
        }
        return { escalated: false, reason: 'Invalid target configuration' };
    }

    // Resolve to user IDs using resolveEscalationTarget
    const targetUserIds = await resolveEscalationTarget(
        step.targetType,
        targetId,
        new Date()
    );

    if (targetUserIds.length === 0) {
        await prisma.incidentEvent.create({
            data: {
                incidentId,
                message: `Escalation step ${currentStepIndex + 1} (${step.targetType}: ${targetName}) resolved to no users. Skipping.`
            }
        });
        // Try next step
        if (currentStepIndex < incident.service.policy.steps.length - 1) {
            return executeEscalation(incidentId, currentStepIndex + 1);
        }
        return { escalated: false, reason: 'No users to notify' };
    }

    // Send notifications to all resolved users
    const notificationsSent = [];
    for (const userId of targetUserIds) {
        const result = await sendNotification(
            incidentId,
            userId,
            'EMAIL',
            `[OpsGuard] Incident: ${incident.title}${currentStepIndex > 0 ? ` (Escalation Level ${currentStepIndex + 1})` : ''}`
        );
        notificationsSent.push({ userId, result });
    }

    // Assign incident to first user (only on first step)
    if (currentStepIndex === 0 && targetUserIds.length > 0) {
        await prisma.incident.update({
            where: { id: incidentId },
            data: { assigneeId: targetUserIds[0] }
        });
    }

    // Create event message
    const targetDescription = step.targetType === 'USER' 
        ? targetName
        : `${step.targetType}: ${targetName} (${targetUserIds.length} user${targetUserIds.length !== 1 ? 's' : ''})`;

    await prisma.incidentEvent.create({
        data: {
            incidentId,
            message: `Escalated to ${targetDescription} (Level ${currentStepIndex + 1}${step.delayMinutes > 0 ? `, after ${step.delayMinutes} minute delay` : ''})`
        }
    });

    // Determine next escalation step and schedule it
    const nextStepIndex = currentStepIndex + 1;
    let nextEscalationAt: Date | null = null;
    let escalationStatus: string = 'COMPLETED';

    if (nextStepIndex < incident.service.policy.steps.length) {
        const nextStep = incident.service.policy.steps[nextStepIndex];
        const delayMs = nextStep.delayMinutes * 60 * 1000;
        nextEscalationAt = new Date(Date.now() + delayMs);
        escalationStatus = 'ESCALATING';

        await prisma.incidentEvent.create({
            data: {
                incidentId,
                message: `Next escalation step scheduled for ${nextEscalationAt.toLocaleString()} (${nextStep.delayMinutes} minute delay)`
            }
        });
    }

    // Update incident with escalation state
    await prisma.incident.update({
        where: { id: incidentId },
        data: {
            currentEscalationStep: nextStepIndex < incident.service.policy.steps.length ? nextStepIndex : null,
            nextEscalationAt,
            escalationStatus: escalationStatus as any
        }
    });

    return { 
        escalated: true, 
        targetName,
        targetType: step.targetType,
        targetCount: targetUserIds.length,
        stepIndex: currentStepIndex,
        notifications: notificationsSent,
        nextStepScheduled: nextStepIndex < incident.service.policy.steps.length
    };
}

/**
 * Check and execute pending escalations
 * This should be called periodically (e.g., via cron job) to process delayed escalations
 */
export async function processPendingEscalations() {
    const now = new Date();
    
    // Find incidents that need escalation (nextEscalationAt is in the past, still open/unacknowledged)
    const incidentsToEscalate = await prisma.incident.findMany({
        where: {
            nextEscalationAt: {
                lte: now
            },
            escalationStatus: 'ESCALATING',
            status: {
                in: ['OPEN', 'SNOOZED'] // Only escalate if still open or snoozed
            }
        },
        include: {
            service: {
                include: {
                    policy: {
                        include: {
                            steps: {
                                include: {
                                    targetUser: true,
                                    targetTeam: true,
                                    targetSchedule: true
                                },
                                orderBy: { stepOrder: 'asc' }
                            }
                        }
                    }
                }
            }
        }
    });

    let processed = 0;
    const errors: string[] = [];

    for (const incident of incidentsToEscalate) {
        try {
            // Get the current step index (default to 0 if not set)
            const currentStepIndex = incident.currentEscalationStep ?? 0;

            // Execute the next escalation step
            const result = await executeEscalation(incident.id, currentStepIndex);

            if (result.escalated) {
                processed++;
            } else {
                // If escalation failed or completed, update status
                await prisma.incident.update({
                    where: { id: incident.id },
                    data: {
                        escalationStatus: result.reason?.includes('exhausted') || result.reason?.includes('completed') ? 'COMPLETED' : 'ESCALATING',
                        nextEscalationAt: null
                    }
                });
            }
        } catch (error) {
            console.error(`Error processing escalation for incident ${incident.id}:`, error);
            errors.push(`Incident ${incident.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            // Update incident to prevent infinite retries on same error
            await prisma.incident.update({
                where: { id: incident.id },
                data: {
                    escalationStatus: 'COMPLETED',
                    nextEscalationAt: null
                }
            }).catch(() => {
                // Ignore update errors
            });
        }
    }

    return {
        processed,
        total: incidentsToEscalate.length,
        errors: errors.length > 0 ? errors : undefined
    };
}


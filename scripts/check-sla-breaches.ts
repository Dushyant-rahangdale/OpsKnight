#!/usr/bin/env ts-node
/**
 * SLA Breach Check Scheduled Job
 *
 * Checks for incidents nearing SLA breach and sends notifications.
 *
 * Schedule: Run every 5 minutes via cron or task scheduler
 * Example cron: 0/5 * * * * npx ts-node scripts/check-sla-breaches.ts
 *
 * Exit codes:
 *   0 - Success
 *   1 - Error during execution
 */

import { checkSLABreaches } from '../src/lib/sla-breach-monitor';

async function main(): Promise<void> {
    console.log('[SLA Breach Check] Starting breach check...');
    const startTime = Date.now();

    try {
        const result = await checkSLABreaches({
            notifySlack: true,
            notifyEmail: true,
            alertEmail: process.env.SLA_ALERT_EMAIL,
        });

        const duration = Date.now() - startTime;

        console.log('[SLA Breach Check] Complete', {
            activeIncidents: result.activeIncidentCount,
            warnings: result.warningCount,
            duration: `${duration}ms`,
            checkedAt: result.checkedAt.toISOString(),
        });

        if (result.warnings.length > 0) {
            console.log('[SLA Breach Check] Warnings:');
            for (const warning of result.warnings) {
                const remainingMin = Math.round(warning.timeRemainingMs / 60000);
                console.log(`  - ${warning.breachType.toUpperCase()}: ${warning.title} (${remainingMin}m remaining)`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('[SLA Breach Check] Error during execution:', error);
        process.exit(1);
    }
}

main();

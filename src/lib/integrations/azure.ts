/**
 * Azure Monitor Integration Handler
 * Transforms Azure Monitor alert webhooks to standard event format
 */

export type AzureAlertData = {
    schemaId?: string;
    data?: {
        essentials?: {
            alertId?: string;
            alertRule?: string;
            severity?: string;
            signalType?: string;
            monitorCondition?: string;
            monitorService?: string;
            firedDateTime?: string;
            description?: string;
        };
        alertContext?: any;
        context?: {
            id?: string;
            name?: string;
            description?: string;
            conditionType?: string;
            condition?: {
                windowSize?: string;
                allOf?: Array<{
                    metricName?: string;
                    threshold?: number;
                }>;
            };
        };
        properties?: any;
    };
};

export function transformAzureToEvent(data: AzureAlertData): {
    event_action: 'trigger' | 'resolve';
    dedup_key: string;
    payload: {
        summary: string;
        source: string;
        severity: 'critical' | 'error' | 'warning' | 'info';
        custom_details: any;
    };
} {
    const essentials = data.data?.essentials;
    const context = data.data?.context;
    
    const alertId = essentials?.alertId || context?.id || 'unknown';
    const alertName = essentials?.alertRule || context?.name || 'Azure Alert';
    const description = essentials?.description || context?.description || '';
    const severity = essentials?.severity || 'Sev3';
    const monitorCondition = essentials?.monitorCondition || 'Fired';
    
    const isFired = monitorCondition === 'Fired' || monitorCondition === 'Activated';
    const dedupKey = `azure-${alertId}`;

    // Map Azure severity to our severity
    let mappedSeverity: 'critical' | 'error' | 'warning' | 'info' = 'warning';
    if (severity.includes('Sev0') || severity.includes('Critical')) {
        mappedSeverity = 'critical';
    } else if (severity.includes('Sev1') || severity.includes('Error')) {
        mappedSeverity = 'error';
    } else if (severity.includes('Sev2') || severity.includes('Warning')) {
        mappedSeverity = 'warning';
    }

    return {
        event_action: isFired ? 'trigger' : 'resolve',
        dedup_key: dedupKey,
        payload: {
            summary: alertName,
            source: `Azure Monitor (${essentials?.monitorService || 'Unknown'})`,
            severity: mappedSeverity,
            custom_details: {
                alertId,
                alertName,
                description,
                severity,
                monitorCondition,
                monitorService: essentials?.monitorService,
                firedDateTime: essentials?.firedDateTime,
                alertContext: data.data?.alertContext,
                context: context,
                properties: data.data?.properties
            }
        }
    };
}


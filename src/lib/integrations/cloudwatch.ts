/**
 * AWS CloudWatch Integration Handler
 * Transforms CloudWatch alarm webhooks to standard event format
 */

export type CloudWatchAlarmMessage = {
  AlarmName: string;
  AlarmDescription?: string;
  NewStateValue: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
  NewStateReason: string;
  StateChangeTime: string;
  Region: string;
  Trigger?: {
    MetricName?: string;
    Namespace?: string;
    Statistic?: string;
    Threshold?: number;
  };
};

export function transformCloudWatchToEvent(message: CloudWatchAlarmMessage): {
  event_action: 'trigger' | 'resolve';
  dedup_key: string;
  payload: {
    summary: string;
    source: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    custom_details: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
} {
  const isAlarm = message.NewStateValue === 'ALARM';
  const dedupKey = `cloudwatch-${message.Region}-${message.AlarmName}`;

  return {
    event_action: isAlarm ? 'trigger' : 'resolve',
    dedup_key: dedupKey,
    payload: {
      summary: message.AlarmName,
      source: `AWS CloudWatch (${message.Region})`,
      severity: (() => {
        if (!isAlarm) return 'info';
        const desc = (message.AlarmDescription || '').toUpperCase();
        if (desc.includes('CRITICAL') || desc.includes('HIGH')) return 'critical';
        if (desc.includes('WARNING') || desc.includes('MEDIUM') || desc.includes('ERROR'))
          return 'error';
        if (desc.includes('INFO') || desc.includes('LOW')) return 'info';
        return 'critical'; // Default to critical for alarms
      })(),
      custom_details: {
        alarmName: message.AlarmName,
        alarmDescription: message.AlarmDescription,
        state: message.NewStateValue,
        reason: message.NewStateReason,
        region: message.Region,
        trigger: message.Trigger,
        stateChangeTime: message.StateChangeTime,
      },
    },
  };
}

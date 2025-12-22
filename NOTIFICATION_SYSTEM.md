# Notification System Architecture

## Overview

The notification system in OpsGuard operates at two levels:

1. **Service-Level Notifications** - Sent when incidents are created, updated, acknowledged, or resolved
2. **Escalation Policy Notifications** - Sent when escalation policy steps execute

## Notification Flow

### 1. Service-Level Notifications

**Triggered when:**
- Incident is created (via API or UI)
- Incident status changes (acknowledged, resolved, updated)
- Incident is manually created

**Configuration:**
- Set in **Service Settings** (`/services/[id]/settings`)
- Field: `Service.notificationChannels` (array: EMAIL, SLACK, SMS, PUSH)
- Default: `['EMAIL', 'SLACK']`

**Recipients:**
- Service team members
- Incident assignee (if assigned)

**Channels:**
- **EMAIL**: Sent via `sendIncidentEmail()` to each recipient
- **SLACK**: Sent via service's `slackWebhookUrl` (single notification to channel)
- **SMS**: Not yet implemented
- **PUSH**: Not yet implemented

**Implementation:**
```typescript
// src/lib/service-notifications.ts
sendServiceNotifications(incidentId, eventType)
```

### 2. Escalation Policy Notifications

**Triggered when:**
- Escalation policy step executes (based on delay)
- Incident is created and escalation starts
- Escalation timer reaches next step

**Configuration:**
- Set per **Escalation Policy Step** (`/policies/[id]`)
- Field: `EscalationRule.notificationChannels` (array: EMAIL, SMS, PUSH)
- Default: `['EMAIL']`
- Note: SLACK is handled at service level, not per step

**Recipients:**
- Users/Teams/Schedules defined in the escalation step
- Resolved via `resolveEscalationTarget()`

**Channels:**
- **EMAIL**: Sent via `sendNotification()` to each resolved user
- **SMS**: Not yet implemented
- **PUSH**: Not yet implemented

**Implementation:**
```typescript
// src/lib/escalation.ts
executeEscalation(incidentId, stepIndex)
```

## Database Schema

### Service
```prisma
model Service {
  notificationChannels String[] @default(["EMAIL", "SLACK"])
  slackWebhookUrl      String?
}
```

### EscalationRule
```prisma
model EscalationRule {
  notificationChannels String[] @default(["EMAIL"])
}
```

## Notification Channels

### EMAIL
- **Implementation**: `src/lib/email.ts`
- **Function**: `sendIncidentEmail(userId, incidentId, eventType)`
- **Status**: ✅ Implemented (ready for Resend/SendGrid integration)
- **Template**: HTML email with incident details

### SLACK
- **Implementation**: `src/lib/slack.ts`
- **Function**: `notifySlackForIncident(incidentId, eventType)`
- **Status**: ✅ Implemented
- **Configuration**: Service-level webhook URL

### SMS
- **Status**: ⏳ Not yet implemented
- **Planned**: Twilio, AWS SNS integration

### PUSH
- **Status**: ⏳ Not yet implemented
- **Planned**: Firebase, OneSignal integration

### WEBHOOK
- **Status**: ⏳ Not yet implemented
- **Planned**: Generic webhook notifications

## How It Works Together

### Example: New Incident Created

1. **Incident Created** (via API or UI)
   ```
   → processEvent() or createIncident()
   ```

2. **Service-Level Notifications Sent**
   ```
   → sendServiceNotifications(incidentId, 'triggered')
   → Sends to: Service team members + assignee
   → Channels: Service.notificationChannels (e.g., EMAIL, SLACK)
   ```

3. **Escalation Policy Starts**
   ```
   → executeEscalation(incidentId, 0)
   → Step 0 executes immediately
   → Sends to: Step 0 targets (USER/TEAM/SCHEDULE)
   → Channels: Step.notificationChannels (e.g., EMAIL)
   ```

4. **Escalation Continues** (if not acknowledged)
   ```
   → After delayMinutes, next step executes
   → executeEscalation(incidentId, 1)
   → Sends to: Step 1 targets
   → Channels: Step.notificationChannels
   ```

## Configuration UI

### Service Settings
- **Location**: `/services/[id]/settings`
- **Section**: "Notification Settings"
- **Options**: Checkboxes for EMAIL, SLACK, SMS, PUSH
- **Slack Webhook**: Text input for webhook URL

### Escalation Policy Steps
- **Location**: `/policies/[id]`
- **When Creating Step**: Checkboxes for EMAIL, SMS, PUSH
- **When Editing Step**: Checkboxes for EMAIL, SMS, PUSH
- **Display**: Shows selected channels in step card

## Migration

To add notification channels to existing database:

```sql
-- Add notification channels to EscalationRule
ALTER TABLE "EscalationRule" 
ADD COLUMN "notificationChannels" TEXT[] DEFAULT ARRAY['EMAIL']::TEXT[];

-- Add notification channels to Service
ALTER TABLE "Service" 
ADD COLUMN "notificationChannels" TEXT[] DEFAULT ARRAY['EMAIL', 'SLACK']::TEXT[];
```

## Future Enhancements

1. **User Notification Preferences**
   - Allow users to opt-in/opt-out of channels
   - Per-user notification settings

2. **Notification Templates**
   - Customizable email templates
   - Customizable Slack message formats

3. **Notification History**
   - View all notifications sent for an incident
   - Track delivery status

4. **Rate Limiting**
   - Prevent notification spam
   - Cooldown periods

5. **Notification Rules**
   - Conditional notifications based on incident properties
   - Time-based notification rules (e.g., no notifications during off-hours)





# Notification Configuration Guide

## Where to Configure Notifications

### 1. Service-Level Notifications

**Location:** Service Settings Page
- Navigate to: `/services/[service-id]/settings`
- Or: Go to Services → Click on a service → Click "Settings" tab

**What to Configure:**
1. **Notification Channels** - Select which channels to use:
   - ✅ EMAIL (default: enabled)
   - ✅ SLACK (default: enabled)
   - ⬜ SMS (not yet implemented)
   - ⬜ PUSH (not yet implemented)

2. **Slack Webhook URL** - Enter your Slack webhook URL for Slack notifications

**How It Works:**
- When an incident is created/updated/acknowledged/resolved
- Notifications are sent to:
  - Service team members
  - Incident assignee (if assigned)
- Via the selected channels

**Default Behavior:**
- If not configured, defaults to: `['EMAIL', 'SLACK']`
- You MUST save the settings form for changes to take effect

### 2. Escalation Policy Notifications

**Location:** Escalation Policy Page
- Navigate to: `/policies/[policy-id]`
- Or: Go to Policies → Click on a policy

**What to Configure:**
- When creating or editing an escalation step:
  - Select notification channels for that step
  - Default: `['EMAIL']` if not specified

**How It Works:**
- When escalation policy steps execute
- Notifications are sent to:
  - Users/Teams/Schedules defined in the step
- Via the channels configured for that step

**Default Behavior:**
- If not configured, defaults to: `['EMAIL']`
- Each step can have different channels

## Step-by-Step Configuration

### Configure Service Notifications:

1. **Go to Service Settings:**
   ```
   Services → [Select Service] → Settings Tab
   ```

2. **Find "Notification Settings" Section**

3. **Select Notification Channels:**
   - Check the boxes for EMAIL, SLACK, etc.
   - At least one channel should be selected

4. **Enter Slack Webhook (if using SLACK):**
   - Get webhook URL from Slack: https://api.slack.com/messaging/webhooks
   - Paste it in the "Slack Webhook URL" field

5. **Click "Save Changes" button** (at the bottom of the form)

6. **Verify:**
   - The form should show a success message
   - Settings are now saved to the database

### Configure Escalation Policy Notifications:

1. **Go to Policy Page:**
   ```
   Policies → [Select Policy]
   ```

2. **Add or Edit an Escalation Step:**
   - Click "+ Add Escalation Step"
   - Or click "Edit" on an existing step

3. **Select Notification Channels:**
   - Check boxes for EMAIL, SMS, PUSH
   - Note: SLACK is handled at service level, not per step

4. **Save the Step**

## Important Notes

### Defaults Work Without Configuration
- **Service notifications:** Default to `['EMAIL', 'SLACK']` if not configured
- **Policy step notifications:** Default to `['EMAIL']` if not configured
- **You can send notifications without explicit configuration**

### But You Should Configure:
1. **To customize channels** - Choose which channels to use
2. **To add Slack webhook** - SLACK won't work without webhook URL
3. **To disable channels** - Uncheck channels you don't want to use

### Current Implementation Status:
- ✅ **EMAIL** - Fully implemented (ready for Resend/SendGrid)
- ✅ **SLACK** - Fully implemented (requires webhook URL)
- ⏳ **SMS** - Not yet implemented
- ⏳ **PUSH** - Not yet implemented

## Troubleshooting

### Notifications Not Sending?

1. **Check Service Settings:**
   - Go to `/services/[id]/settings`
   - Verify notification channels are selected
   - Verify Slack webhook is entered (if using SLACK)
   - Make sure you clicked "Save Changes"

2. **Check Escalation Policy:**
   - Go to `/policies/[id]`
   - Verify steps have notification channels configured
   - Verify steps have valid targets (users/teams/schedules)

3. **Check Service Team:**
   - Service must have a team assigned
   - Team must have members
   - For service-level notifications to work

4. **Check Logs:**
   - Check browser console for errors
   - Check server logs for notification errors

## Quick Reference

| Notification Type | Configuration Location | Default Channels |
|------------------|----------------------|------------------|
| Service-Level | `/services/[id]/settings` | EMAIL, SLACK |
| Escalation Step | `/policies/[id]` (when creating/editing step) | EMAIL |





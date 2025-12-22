# Quick Start: Configuring Notifications

## Where to Configure

### Service-Level Notifications

**Step 1:** Navigate to Service Settings
- Go to **Services** page
- Click on any service
- Click the **"Settings"** tab (or go to `/services/[service-id]/settings`)

**Step 2:** Find "Notification Settings" Section
- Scroll down to find the "Notification Settings" section
- You'll see checkboxes for: EMAIL, SLACK, SMS, PUSH

**Step 3:** Select Your Channels
- ✅ Check the boxes for channels you want to use
- Default: EMAIL and SLACK are selected by default
- You can uncheck channels you don't want

**Step 4:** Configure Slack Webhook (if using SLACK)
- Enter your Slack webhook URL in the "Slack Webhook URL" field
- Get webhook from: https://api.slack.com/messaging/webhooks

**Step 5:** Save Your Changes
- **IMPORTANT:** Scroll to the bottom of the page
- Click the **"Save Changes"** button
- You should see a success message

### Escalation Policy Notifications

**Step 1:** Navigate to Policy Page
- Go to **Policies** page
- Click on any policy

**Step 2:** Add or Edit a Step
- Click **"+ Add Escalation Step"** to create new
- Or click **"Edit"** (✏️) on an existing step

**Step 3:** Select Notification Channels
- In the step form, you'll see "Notification Channels" section
- Check boxes for: EMAIL, SMS, PUSH
- Default: EMAIL is selected by default

**Step 4:** Save the Step
- Click "Add Step" or "Save" button

## Default Behavior (Works Without Configuration)

### ✅ You DON'T Need to Configure to Send Notifications!

**Service Notifications:**
- **Default:** `['EMAIL', 'SLACK']` 
- Works automatically when incidents are created/updated
- Only requires Slack webhook URL if you want SLACK notifications

**Escalation Policy Notifications:**
- **Default:** `['EMAIL']`
- Works automatically when escalation steps execute
- Each step uses EMAIL by default

## Why Configure Then?

You should configure to:
1. **Customize channels** - Choose which channels to use per service/step
2. **Enable Slack** - Add webhook URL for Slack notifications
3. **Disable channels** - Turn off channels you don't want (e.g., disable SLACK if no webhook)

## Quick Checklist

- [ ] Go to `/services/[id]/settings`
- [ ] Find "Notification Settings" section
- [ ] Select notification channels (or leave defaults)
- [ ] Enter Slack webhook URL (if using SLACK)
- [ ] **Click "Save Changes" button at bottom of page**
- [ ] Verify success message appears

## Troubleshooting

**"Notifications not sending?"**
1. Did you click "Save Changes"? ⚠️ Most common issue!
2. Is the service assigned to a team?
3. Does the team have members?
4. For SLACK: Is the webhook URL correct?

**"Can't find the settings?"**
- Make sure you're on the **Settings** tab (not Overview or Integrations)
- URL should be: `/services/[id]/settings`

**"Defaults not working?"**
- Check browser console for errors
- Verify service has a team assigned
- Check server logs for notification errors





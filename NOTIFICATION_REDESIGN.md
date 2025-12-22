# Notification System Redesign (PagerDuty-style)

## Architecture Overview

The notification system has been completely redesigned to follow PagerDuty's model:

### ✅ **Service-Level Configuration**
- **Slack Webhook URL** - Configured per service
- Location: `/services/[id]/settings`
- Only notification config at service level

### ✅ **User-Level Configuration** (NEW)
- **Email, SMS, Push preferences** - Configured per user
- Location: `/settings/preferences` → "Notification Preferences" section
- Each user chooses how they want to be notified
- Phone number required for SMS

### ✅ **System-Level Configuration** (NEW)
- **Provider settings** - Configured via environment variables
- Twilio (SMS): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- Email (Resend): `RESEND_API_KEY`, `EMAIL_FROM`
- Email (SendGrid): `SENDGRID_API_KEY`, `EMAIL_FROM`
- Email (SMTP): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- Push (Firebase): `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- Push (OneSignal): `ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY`

## How It Works

### When an Incident is Created/Updated:

1. **Service-Level Slack Notification**
   - Sent to service's Slack webhook (if configured)
   - Single notification to the channel

2. **User Notifications** (based on user preferences)
   - System checks each recipient's preferences
   - Sends via enabled channels:
     - Email (if user enabled + SMTP/Resend configured)
     - SMS (if user enabled + phone number + Twilio configured)
     - Push (if user enabled + Firebase/OneSignal configured)

### When Escalation Policy Executes:

1. **Resolve targets** (users/teams/schedules)
2. **For each user:**
   - Check their notification preferences
   - Send via their enabled channels
   - Respect system provider availability

## Database Changes

### Added to User Model:
- `emailNotificationsEnabled` (Boolean, default: true)
- `smsNotificationsEnabled` (Boolean, default: false)
- `pushNotificationsEnabled` (Boolean, default: false)
- `phoneNumber` (String?, for SMS)

### Removed:
- `Service.notificationChannels` ❌
- `EscalationRule.notificationChannels` ❌

## Configuration Guide

### 1. Configure System Providers (Environment Variables)

Add to `.env`:

```bash
# Email (choose one)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@opsguard.com

# OR SendGrid
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@opsguard.com

# OR SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password
EMAIL_FROM=noreply@opsguard.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+1234567890

# Push (choose one)
# Firebase
FIREBASE_PROJECT_ID=xxxxx
FIREBASE_PRIVATE_KEY=xxxxx
FIREBASE_CLIENT_EMAIL=xxxxx

# OR OneSignal
ONESIGNAL_APP_ID=xxxxx
ONESIGNAL_API_KEY=xxxxx
```

### 2. Configure User Preferences

Users go to: **Settings → Preferences → Notification Preferences**

- ✅ Enable/disable email notifications
- ✅ Enable/disable SMS notifications (requires phone number)
- ✅ Enable/disable push notifications

### 3. Configure Service Slack Webhook

Admins go to: **Services → [Service] → Settings**

- Enter Slack webhook URL
- This is the only notification config at service level

## Benefits

1. **User Control** - Each user chooses their preferred notification methods
2. **Provider Flexibility** - System admins configure providers once
3. **Scalability** - Easy to add new providers without changing user settings
4. **PagerDuty-like** - Familiar model for users coming from PagerDuty
5. **No Redundancy** - No need to configure channels at service/policy level

## Migration Notes

- Existing `notificationChannels` data in Service/EscalationRule was removed
- Users need to configure their preferences in Settings
- Default: Email enabled, SMS/Push disabled
- System providers need to be configured in `.env`





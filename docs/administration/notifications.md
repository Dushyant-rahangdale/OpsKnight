# Notifications

Configure how OpsSentinal alerts users about incidents.

## Notification Channels

| Channel  | Use Case            |
| -------- | ------------------- |
| Email    | All users           |
| SMS      | Critical alerts     |
| Push     | Mobile PWA users    |
| WhatsApp | International teams |
| Slack    | Team notifications  |

## Configuring Providers

Navigate to **Settings → Notifications** to configure.

---

## Email (SMTP)

### Configuration

| Field        | Example             |
| ------------ | ------------------- |
| SMTP Host    | smtp.gmail.com      |
| SMTP Port    | 587                 |
| Username     | alerts@company.com  |
| Password     | •••••••••           |
| From Address | noreply@company.com |

### Providers

- Gmail / Google Workspace
- Microsoft 365
- SendGrid
- Amazon SES
- Resend

---

## SMS (Twilio)

### Configuration

| Field        | Description                 |
| ------------ | --------------------------- |
| Account SID  | Twilio account identifier   |
| Auth Token   | Twilio auth token           |
| Phone Number | Twilio phone number (+1...) |

### Setup Steps

1. Create Twilio account at twilio.com
2. Get Account SID and Auth Token
3. Purchase a phone number
4. Enter credentials in Settings

### User Phone Numbers

Users must add their phone number:

1. Go to **Profile**
2. Add **Phone Number**
3. Verify via SMS code

---

## Push Notifications (Firebase/OneSignal)

### Firebase Cloud Messaging

| Field      | Description    |
| ---------- | -------------- |
| Server Key | FCM server key |
| Sender ID  | FCM sender ID  |

### OneSignal

| Field        | Description       |
| ------------ | ----------------- |
| App ID       | OneSignal App ID  |
| REST API Key | OneSignal API key |

### User Enablement

Users enable push via the PWA:

1. Open app in browser
2. Accept notification permission
3. Push enabled automatically

---

## WhatsApp (Twilio)

### Configuration

Same as SMS, plus WhatsApp-enabled number:

1. Enable WhatsApp in Twilio console
2. Connect WhatsApp Business
3. Use WhatsApp number in Settings

---

## AWS SNS

For high-volume SMS:

| Field             | Description            |
| ----------------- | ---------------------- |
| Region            | AWS region (us-east-1) |
| Access Key ID     | AWS access key         |
| Secret Access Key | AWS secret key         |

---

## Notification Preferences

### User Level

Each user configures their preferences:

- Which channels to use
- Quiet hours
- Digest frequency

### Service Level

Per-service notification settings:

- Notify on trigger
- Notify on acknowledge
- Notify on resolve
- Notify on SLA breach

## Testing Notifications

1. Go to **Settings → Notifications**
2. Click **Send Test**
3. Verify receipt

## Best Practices

- ✅ Configure multiple channels
- ✅ Use SMS for critical alerts only
- ✅ Test notifications after setup
- ✅ Respect quiet hours
- ✅ Monitor delivery status

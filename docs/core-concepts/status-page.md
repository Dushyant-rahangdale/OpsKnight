# Status Page

Communicate service status to customers and stakeholders with a public status page.

## What is the Status Page?

The status page provides:

- Real-time service status
- Incident history
- Scheduled maintenance
- Uptime metrics

## Accessing Your Status Page

Default URL: `https://your-ops.com/status`

## Configuring the Status Page

1. Go to **Settings → Status Page**
2. Configure branding and services

### Branding Options

| Setting       | Description            |
| ------------- | ---------------------- |
| Logo          | Your company logo      |
| Primary Color | Brand color            |
| Company Name  | Display name           |
| Custom Domain | status.yourcompany.com |

### Displayed Services

Select which services appear on the status page:

- Choose services to display
- Set display order
- Group by category

## Service Statuses

| Status       | Display | Meaning            |
| ------------ | ------- | ------------------ |
| Operational  | 🟢      | All systems normal |
| Degraded     | 🟡      | Partial outage     |
| Major Outage | 🔴      | Complete outage    |
| Maintenance  | 🔵      | Planned downtime   |

## Incident Updates

When incidents occur:

1. Status page automatically reflects service status
2. Add manual updates for context:
   - **Investigating** - Aware of issue
   - **Identified** - Found root cause
   - **Monitoring** - Fix deployed
   - **Resolved** - Issue fixed

### Adding Updates

1. Open the incident
2. Click **Add Status Update**
3. Write customer-friendly message
4. Publish

## Scheduled Maintenance

Notify users of planned downtime:

1. Go to **Status Page → Maintenance**
2. Click **Schedule Maintenance**
3. Fill in:
   - Affected services
   - Start/end time
   - Description

## Subscriber Notifications

Users can subscribe to updates:

- Email notifications
- Webhook notifications
- RSS feed

### Managing Subscribers

View and manage subscribers in **Settings → Status Page → Subscribers**

## Uptime Display

The status page shows:

- 90-day uptime percentage
- Historical uptime graph
- Incident history

## Best Practices

- ✅ Update status promptly
- ✅ Use customer-friendly language
- ✅ Provide regular updates during incidents
- ✅ Post postmortems for major incidents
- ✅ Schedule maintenance during low-traffic periods

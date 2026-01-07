# Data Retention

Manage data storage and automatic cleanup policies.

## Overview

Data retention policies automatically clean up old data to:

- Reduce storage costs
- Improve query performance
- Comply with data policies

## Configuring Retention

1. Go to **Settings → System → Data Retention**
2. Set retention periods
3. Save changes

## Retention Settings

| Data Type            | Default  | Recommended |
| -------------------- | -------- | ----------- |
| Resolved Incidents   | 90 days  | 90-365 days |
| Event Logs           | 30 days  | 30-90 days  |
| Notification History | 30 days  | 30-60 days  |
| Audit Logs           | 365 days | 365+ days   |

## How Cleanup Works

The cleanup job runs automatically:

- **Frequency**: Daily (via internal cron)
- **Time**: Off-peak hours
- **Method**: Soft delete, then purge

### Cleanup Process

1. Identify data older than retention period
2. Mark for deletion
3. Delete in batches
4. Log cleanup results

## Previewing Cleanup

Before running cleanup:

1. Go to **Data Retention**
2. Click **Preview Cleanup**
3. Review what would be deleted
4. Confirm or adjust settings

## Manual Cleanup

Force immediate cleanup:

```bash
# Via API (Admin only)
curl -X POST https://your-ops.com/api/settings/retention/cleanup \
  -H "Authorization: Bearer ADMIN_API_KEY" \
  -H "X-Cron-Secret: YOUR_CRON_SECRET"
```

## Storage Monitoring

Monitor storage usage:

- Dashboard widgets show storage
- Alerts when approaching limits
- Trending data available

## Data Export

Before data is deleted, export if needed:

1. Go to **Analytics**
2. Filter by date range
3. Click **Export**
4. Download CSV/JSON

## Compliance

For regulated industries:

- Audit logs have extended retention
- Some data may be excluded from cleanup
- Export before deletion

## Best Practices

- ✅ Set appropriate retention periods
- ✅ Preview before first cleanup
- ✅ Export critical data before expiry
- ✅ Keep audit logs longer
- ✅ Monitor storage trends

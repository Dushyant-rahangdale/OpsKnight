# PostgreSQL-Based Job Queue System

## 🎯 Overview

OpsGuard uses a **PostgreSQL-based job queue** instead of Redis/BullMQ. This eliminates the need for additional infrastructure while providing reliable background job processing.

## ✅ Benefits

- **No Redis needed** - Uses existing PostgreSQL database
- **ACID transactions** - Jobs are part of database transactions
- **Easy monitoring** - Query jobs directly from database
- **Backup included** - Jobs are backed up with database
- **Simple setup** - No additional services to configure

## 📊 Architecture

### BackgroundJob Table

Jobs are stored in the `BackgroundJob` table with:
- **Type**: ESCALATION, NOTIFICATION, AUTO_UNSNOOZE, SCHEDULED_TASK
- **Status**: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
- **Scheduled At**: When to execute the job
- **Payload**: Job-specific data (JSON)
- **Retry Logic**: Automatic retry with exponential backoff

### Processing Flow

1. **Job Creation**: Jobs are created when needed (escalations, notifications, etc.)
2. **Cron Processing**: Cron endpoint (`/api/cron/process-escalations`) runs every 5 minutes
3. **Job Execution**: Pending jobs are fetched and processed
4. **Retry Logic**: Failed jobs are automatically retried (up to 3 attempts)
5. **Cleanup**: Old completed jobs are cleaned up periodically

## 🚀 Setup

### 1. Run Migration

```bash
npx prisma migrate dev
```

This will create the `BackgroundJob` table with proper indexes.

### 2. Verify Cron Job

The cron job is already configured in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-escalations",
    "schedule": "*/5 * * * *"
  }]
}
```

### 3. Test Endpoint

```bash
curl http://localhost:3000/api/cron/process-escalations
```

## 📝 Usage

### Schedule an Escalation

```typescript
import { scheduleEscalation } from '@/lib/jobs/queue';

// Schedule escalation for 15 minutes from now
await scheduleEscalation(incidentId, stepIndex, 15 * 60 * 1000);
```

### Schedule a Notification

```typescript
import { scheduleNotification } from '@/lib/jobs/queue';

// Schedule notification immediately (delay = 0)
await scheduleNotification(incidentId, userId, 'EMAIL', 'Message', 0);
```

### Schedule Auto-Unsnooze

```typescript
import { scheduleAutoUnsnooze } from '@/lib/jobs/queue';

// Schedule auto-unsnooze for when snooze expires
await scheduleAutoUnsnooze(incidentId, snoozedUntil);
```

## 🔍 Monitoring

### Get Job Statistics

```typescript
import { getJobStats } from '@/lib/jobs/queue';

const stats = await getJobStats();
console.log(stats);
// { pending: 5, processing: 2, completed: 100, failed: 3 }
```

### Query Jobs Directly

```sql
-- Pending jobs
SELECT * FROM "BackgroundJob" 
WHERE status = 'PENDING' 
AND "scheduledAt" <= NOW()
ORDER BY "scheduledAt" ASC;

-- Failed jobs
SELECT * FROM "BackgroundJob" 
WHERE status = 'FAILED'
ORDER BY "failedAt" DESC;

-- Job statistics
SELECT 
  type,
  status,
  COUNT(*) as count
FROM "BackgroundJob"
GROUP BY type, status;
```

## 🔧 Configuration

### Job Processing Limits

Default: 50 jobs per cron run
- Configurable in `processPendingJobs(limit)`
- Adjust based on your needs

### Retry Configuration

- **Max Attempts**: 3 (default)
- **Backoff**: Exponential (5s, 10s, 20s)
- **Configurable**: Per job via `maxAttempts` parameter

### Cleanup

Old completed jobs are cleaned up:
- **Default**: Jobs older than 7 days
- **Configurable**: `cleanupOldJobs(days)`

## 🎯 Job Types

### ESCALATION
- Processes escalation steps for incidents
- Scheduled when escalation policy has delays
- Automatically retries on failure

### NOTIFICATION
- Sends notifications (email, SMS, push)
- Can be scheduled with delay
- Retries on delivery failure

### AUTO_UNSNOOZE
- Automatically unsnoozes incidents
- Scheduled when incident is snoozed
- Cancelled if incident is manually unsnoozed

### SCHEDULED_TASK
- For future custom scheduled tasks
- Extensible for your needs

## 🔄 Integration Points

### Escalations
- Jobs are automatically scheduled in `executeEscalation()`
- Next step is scheduled based on `delayMinutes`

### Snooze
- Jobs are scheduled in `snoozeIncidentWithDuration()`
- Auto-unsnooze happens when `snoozedUntil` expires

### Notifications
- Can be scheduled for delayed delivery
- Useful for quiet hours, rate limiting, etc.

## 🐛 Troubleshooting

### Jobs Not Processing

1. **Check cron endpoint**: Verify `/api/cron/process-escalations` is being called
2. **Check job status**: Query `BackgroundJob` table for pending jobs
3. **Check logs**: Look for errors in cron endpoint logs
4. **Verify indexes**: Ensure indexes are created for performance

### Jobs Failing

1. **Check error field**: `SELECT error FROM "BackgroundJob" WHERE status = 'FAILED'`
2. **Check retry count**: Jobs retry up to `maxAttempts`
3. **Check job payload**: Verify payload data is correct

### Performance Issues

1. **Limit batch size**: Reduce `limit` in `processPendingJobs()`
2. **Add more indexes**: If querying by specific fields
3. **Cleanup old jobs**: Run `cleanupOldJobs()` periodically

## 📈 Performance

- **Query Performance**: Indexed for fast lookups
- **Batch Processing**: Processes multiple jobs per run
- **Concurrent Safe**: Uses database transactions
- **Scalable**: Can handle thousands of jobs

## 🔐 Security

- **Cron Secret**: Optional authentication via `CRON_SECRET`
- **Database Security**: Jobs stored securely in PostgreSQL
- **Access Control**: Jobs respect existing RBAC

---

**Last Updated:** December 2024
**Status:** Production Ready


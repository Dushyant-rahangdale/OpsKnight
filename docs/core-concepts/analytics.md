# Analytics

Analytics provide insights into incident trends, response times, and team performance.

## Key Metrics

### MTTA (Mean Time to Acknowledge)

Average time from incident trigger to first acknowledgment.

| Rating               | MTTA         |
| -------------------- | ------------ |
| 🟢 Excellent         | < 5 minutes  |
| 🟡 Good              | 5-15 minutes |
| 🔴 Needs Improvement | > 15 minutes |

### MTTR (Mean Time to Resolve)

Average time from incident trigger to resolution.

| Rating               | MTTR          |
| -------------------- | ------------- |
| 🟢 Excellent         | < 30 minutes  |
| 🟡 Good              | 30-60 minutes |
| 🔴 Needs Improvement | > 60 minutes  |

### SLA Compliance

Percentage of incidents resolved within SLA targets.

## Dashboard Widgets

The analytics dashboard provides:

- **Incident Trends** - Volume over time
- **Response Times** - MTTA/MTTR charts
- **Team Performance** - By team breakdown
- **Service Health** - Uptime percentages
- **Escalation Metrics** - Step reached distribution

## Filtering

Filter analytics by:

- Time range (24h, 7d, 30d, custom)
- Services
- Teams
- Severity
- Priority

## Reports

### Executive Report

High-level summary for leadership:

- Total incidents
- SLA compliance
- Top affected services
- Trends vs. previous period

Access: **Insights → Executive Report**

### On-Call Report

Performance metrics for on-call teams:

- Response times by responder
- Incidents per shift
- Escalation frequency

## Exporting Data

Export analytics for external analysis:

1. Go to **Analytics**
2. Apply filters
3. Click **Export**
4. Choose format (CSV, JSON)

## Best Practices

- ✅ Review metrics weekly
- ✅ Set realistic SLA targets
- ✅ Track trends, not just numbers
- ✅ Share reports with stakeholders
- ✅ Use data to improve processes

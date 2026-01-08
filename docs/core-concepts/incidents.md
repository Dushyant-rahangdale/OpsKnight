# Incidents

Incidents are the core of OpsSentinal. They represent issues that require attention and tracking through resolution.

## Incident Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  TRIGGERED  │────▶│ACKNOWLEDGED │────▶│  RESOLVED   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   SNOOZED   │     │  ESCALATED  │
└─────────────┘     └─────────────┘
```

### Statuses

| Status           | Description                     |
| ---------------- | ------------------------------- |
| **Triggered**    | New incident, awaiting response |
| **Acknowledged** | Someone is working on it        |
| **Resolved**     | Issue has been fixed            |
| **Snoozed**      | Temporarily silenced            |
| **Suppressed**   | Matched a suppression rule      |

## Creating Incidents

### Via API

```bash
curl -X POST https://your-ops.com/api/events \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "SERVICE_ID",
    "event_action": "trigger",
    "dedup_key": "unique-id",
    "payload": {
      "summary": "CPU usage above 90%",
      "source": "prometheus",
      "severity": "warning"
    }
  }'
```

### Via UI

1. Navigate to **Incidents**
2. Click **+ New Incident**
3. Fill in details and submit

## Incident Priority

| Priority          | Response Time | Use Case             |
| ----------------- | ------------- | -------------------- |
| **P1 - Critical** | Immediate     | Production down      |
| **P2 - High**     | < 1 hour      | Major feature broken |
| **P3 - Medium**   | < 4 hours     | Degraded performance |
| **P4 - Low**      | < 24 hours    | Minor issues         |

## Deduplication

OpsSentinal uses `dedup_key` to group related alerts:

- Same `dedup_key` = Same incident
- Different `dedup_key` = New incident

This prevents alert storms from creating duplicate incidents.

## Incident Actions

### Acknowledge

Mark that you're working on an incident:

```bash
curl -X POST https://your-ops.com/api/events \
  -d '{
    "event_action": "acknowledge",
    "dedup_key": "existing-incident-key"
  }'
```

### Resolve

Mark the incident as fixed:

```bash
curl -X POST https://your-ops.com/api/events \
  -d '{
    "event_action": "resolve",
    "dedup_key": "existing-incident-key"
  }'
```

## Incident Timeline

Every incident maintains a complete timeline:

- When it was triggered
- Who acknowledged it
- Notes and comments
- Resolution details

## Best Practices

- ✅ Use meaningful `dedup_key` values
- ✅ Include context in `summary`
- ✅ Set appropriate severity
- ✅ Add notes when acknowledging
- ✅ Document resolution steps

# Events API

The Events API is the primary way to send alerts to OpsSentinal.

## Endpoint

```
POST /api/events
```

## Authentication

Requires API key with `events:write` scope.

## Request Body

```json
{
  "routing_key": "service_routing_key",
  "event_action": "trigger",
  "dedup_key": "unique-alert-id",
  "payload": {
    "summary": "Brief description of the issue",
    "source": "monitoring-system",
    "severity": "critical",
    "custom_details": {
      "key": "value"
    }
  }
}
```

## Fields

| Field                    | Type   | Required | Description                            |
| ------------------------ | ------ | -------- | -------------------------------------- |
| `routing_key`            | string | ✅       | Service integration key                |
| `service_id`             | string | ✅\*     | Alternative to routing_key             |
| `event_action`           | string | ✅       | `trigger`, `acknowledge`, `resolve`    |
| `dedup_key`              | string | ✅       | Deduplication key                      |
| `payload.summary`        | string | ✅       | Alert description                      |
| `payload.source`         | string | ✅       | Alert source                           |
| `payload.severity`       | string | ✅       | `critical`, `error`, `warning`, `info` |
| `payload.custom_details` | object | -        | Additional context                     |

## Event Actions

### Trigger

Create a new incident or add alert to existing:

```bash
curl -X POST https://your-ops.com/api/events \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "abc123",
    "event_action": "trigger",
    "dedup_key": "server-cpu-high",
    "payload": {
      "summary": "CPU usage above 90%",
      "source": "prometheus",
      "severity": "critical"
    }
  }'
```

### Acknowledge

Mark incident as being worked on:

```bash
curl -X POST https://your-ops.com/api/events \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "abc123",
    "event_action": "acknowledge",
    "dedup_key": "server-cpu-high"
  }'
```

### Resolve

Mark incident as resolved:

```bash
curl -X POST https://your-ops.com/api/events \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "abc123",
    "event_action": "resolve",
    "dedup_key": "server-cpu-high"
  }'
```

## Response

### Success

```json
{
  "status": "success",
  "message": "Event processed",
  "dedup_key": "server-cpu-high",
  "incident_key": "inc_xyz789"
}
```

### Error

```json
{
  "error": {
    "code": "INVALID_ROUTING_KEY",
    "message": "Routing key not found"
  }
}
```

## Deduplication

Events with the same `dedup_key` are grouped:

- First trigger → Creates incident
- Subsequent triggers → Adds to timeline
- Resolve → Closes the incident

## Best Practices

- ✅ Use meaningful `dedup_key` values
- ✅ Include context in `custom_details`
- ✅ Set appropriate severity
- ✅ Send resolve events when issues clear

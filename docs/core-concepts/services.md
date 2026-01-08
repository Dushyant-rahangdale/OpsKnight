# Services

Services are the foundation of OpsSentinal. They represent the systems, applications, or infrastructure components you want to monitor.

## What is a Service?

A Service in OpsSentinal represents any component that can have incidents:

- APIs and microservices
- Databases
- Infrastructure (servers, networking)
- Third-party dependencies
- Business processes

## Creating a Service

1. Navigate to **Services** in the sidebar
2. Click **+ New Service**
3. Fill in the details:

| Field             | Description                 | Required |
| ----------------- | --------------------------- | -------- |
| Name              | Unique service name         | ✅       |
| Description       | What this service does      | -        |
| Escalation Policy | How incidents are escalated | -        |

## Service Integrations

Each service can have multiple integrations to receive alerts:

### Event API Integration

The default integration for programmatic alerts:

```bash
curl -X POST https://your-ops.com/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "YOUR_SERVICE_ROUTING_KEY",
    "event_action": "trigger",
    "dedup_key": "unique-alert-id",
    "payload": {
      "summary": "Database connection timeout",
      "source": "monitoring",
      "severity": "critical"
    }
  }'
```

### Supported Severity Levels

| Severity   | Description       | Badge |
| ---------- | ----------------- | ----- |
| `critical` | Service is down   | 🔴    |
| `error`    | Significant issue | 🟠    |
| `warning`  | Potential problem | 🟡    |
| `info`     | Informational     | 🔵    |

## Service Health

Services display real-time health status:

| Status          | Meaning                   |
| --------------- | ------------------------- |
| 🟢 Operational  | No active incidents       |
| 🟡 Degraded     | Active warning incidents  |
| 🔴 Major Outage | Active critical incidents |

## Linking to Escalation Policies

Associate services with escalation policies to determine how incidents are routed:

1. Open the service
2. Go to **Settings** tab
3. Select an **Escalation Policy**
4. Save changes

## Best Practices

- ✅ Use descriptive, consistent naming (e.g., `api-gateway`, `user-service`)
- ✅ Add meaningful descriptions
- ✅ Assign appropriate escalation policies
- ✅ Group related services under teams

# Urgency & Severity Mapping

OpsKnight normalizes alerts from different monitoring tools into a standard **Severity** and **Urgency** model. This ensures consistent notification behavior regardless of whether the alert comes from AWS, Datadog, or GitHub.

## Core Concepts

### 1. Severity (Event Level)

Severity describes the technical impact of an event payload.

| Severity     | Description                                                             | Mapping                    |
| ------------ | ----------------------------------------------------------------------- | -------------------------- |
| **Critical** | System is down or unusable. Immediate action required.                  | Maps to **HIGH** Urgency   |
| **Error**    | Feature failure or significant degradation. Standard response required. | Maps to **MEDIUM** Urgency |
| **Warning**  | Approaching limits or minor issues. No immediate impact.                | Maps to **LOW** Urgency    |
| **Info**     | Normal operation, success messages, or informational logs.              | Maps to **LOW** Urgency    |

### 2. Urgency (Notification Level)

Urgency determines how the user is notified based on the incident created from the event.

| Urgency    | Behavior                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| **HIGH**   | **Paging**. Wakes up the on-call engineer immediately (SMS, Phone, Push).                                   |
| **MEDIUM** | **Standard**. Notifies via standard channels (Slack, Email) but may not page immediately unless configured. |
| **LOW**    | **Low Priority**. Logged for visibility; no active notification or low-priority notification only.          |

---

## Integration Mapping Tables

How specific tools map to OpsKnight Severity & Urgency.

### Cloud Providers

#### AWS CloudWatch & SNS

OpsKnight supports both direct CloudWatch Alarms and via **SNS** notifications.

| State/Type          | OpsKnight Severity            | Urgency |
| ------------------- | ----------------------------- | ------- |
| `ALARM`             | **Critical**                  | 🔴 HIGH |
| `OK`                | Info                          | 🟢 LOW  |
| `INSUFFICIENT_DATA` | Warning                       | 🟡 LOW  |
| SNS Notification    | Maps based on message content | Varies  |

#### Azure Monitor

| Azure Severity | OpsKnight Severity | Urgency   |
| -------------- | ------------------ | --------- |
| `Sev0`         | **Critical**       | 🔴 HIGH   |
| `Sev1`         | **Error**          | 🟠 MEDIUM |
| `Sev2`         | Warning            | 🟡 LOW    |
| `Sev3`         | Info               | 🟢 LOW    |
| `Sev4`         | Info               | 🟢 LOW    |

### Infrastructure Monitoring

#### Datadog

| Alert Type | OpsKnight Severity | Urgency |
| ---------- | ------------------ | ------- |
| `error`    | **Critical**       | 🔴 HIGH |
| `warning`  | Warning            | 🟡 LOW  |
| `info`     | Info               | 🟢 LOW  |
| `success`  | Info               | 🟢 LOW  |

#### Prometheus / Alertmanager

| Label (`severity`)   | OpsKnight Severity | Urgency   |
| -------------------- | ------------------ | --------- |
| `critical` OR `page` | **Critical**       | 🔴 HIGH   |
| `error`              | **Error**          | 🟠 MEDIUM |
| `warning`            | Warning            | 🟡 LOW    |
| _other_              | Warning            | 🟡 LOW    |

#### New Relic

| Severity   | OpsKnight Severity | Urgency |
| ---------- | ------------------ | ------- |
| `critical` | **Critical**       | 🔴 HIGH |
| `warning`  | Warning            | 🟡 LOW  |
| `info`     | Info               | 🟢 LOW  |

#### Grafana

| State      | OpsKnight Severity | Urgency |
| ---------- | ------------------ | ------- |
| `alerting` | **Critical**       | 🔴 HIGH |
| `no_data`  | Warning            | 🟡 LOW  |
| `pending`  | Info               | 🟢 LOW  |
| `ok`       | Info               | 🟢 LOW  |

### Error Tracking

#### Sentry

| Level            | OpsKnight Severity | Urgency   |
| ---------------- | ------------------ | --------- |
| `fatal`          | **Critical**       | 🔴 HIGH   |
| `error`          | **Error**          | 🟠 MEDIUM |
| `warning`        | Warning            | 🟡 LOW    |
| `info` / `debug` | Info               | 🟢 LOW    |

### CI/CD & Code

#### GitHub / GitLab

| Status                 | OpsKnight Severity      | Urgency   |
| ---------------------- | ----------------------- | --------- |
| `failure` (Workflow)   | **Error**               | 🟠 MEDIUM |
| `failure` (Deployment) | **Error**               | 🟠 MEDIUM |
| `success`              | Using 'resolved' action | 🟢 -      |

### Observability & APM

The following integrations map severity using standard keywords (`critical`, `error`, `warning`, `info`) or numeric priorities (P1–P5):

- Google Cloud Monitoring
- Splunk On-Call / Splunk Observability
- Dynatrace
- AppDynamics
- Elastic
- Honeycomb

### Uptime Monitoring

#### UptimeRobot / Pingdom / Better Uptime / Uptime Kuma

| Status            | OpsKnight Severity | Urgency |
| ----------------- | ------------------ | ------- |
| `down` / `open`   | **Critical**       | 🔴 HIGH |
| `up` / `resolved` | Info               | 🟢 LOW  |

### Custom Webhooks

You can control mapping directly in your JSON payload using standard fields.

| Field Value         | OpsKnight Severity | Urgency   |
| ------------------- | ------------------ | --------- |
| `critical`, `high`  | **Critical**       | 🔴 HIGH   |
| `error`             | **Error**          | 🟠 MEDIUM |
| `warning`, `medium` | Warning            | 🟡 LOW    |
| `info`, `low`       | Info               | 🟢 LOW    |

**Example Configurable Payload:**

```json
{
  "summary": "Database High CPU",
  "severity": "critical", // Maps to HIGH urgency
  "source": "Custom-Script"
}
```

---

## Overriding Urgency

You can override the calculated urgency using **Event Rules** service configuration settings (Future Feature).

Currently, mapping logic is hardcoded in the integration logic (`src/lib/integrations/*.ts`) and event processor (`src/lib/events.ts`).

---
order: 4
title: Integrations
description: Connect OpsKnight with 20+ monitoring tools, Slack, and custom webhooks
---

# Integrations

OpsKnight integrates with your entire monitoring and observability stack, routing alerts from any tool to the right people at the right time.

<!-- placeholder:integrations-overview -->
<!-- Add: Diagram showing various monitoring tools connecting to OpsKnight -->

---

## Why Integrations Matter

Your infrastructure is monitored by many tools — APM, uptime monitoring, error tracking, CI/CD pipelines, and more. Without integration:

- Alerts are scattered across multiple dashboards
- There's no unified view of what's happening
- On-call routing is inconsistent
- Response times suffer

OpsKnight integrations solve this by:

- **Centralizing all alerts** in one place
- **Normalizing formats** so every alert looks consistent
- **Routing intelligently** based on service and urgency
- **Deduplicating** to reduce noise

---

## Integration Categories

### Alert Sources (Inbound)

These tools send alerts TO OpsKnight:

| Category               | Tools                                                                      |
| ---------------------- | -------------------------------------------------------------------------- |
| **APM & Monitoring**   | Datadog, New Relic, Dynatrace, AppDynamics, Sentry, Honeycomb, Splunk      |
| **Infrastructure**     | AWS CloudWatch, Azure Monitor, Google Cloud Monitoring                     |
| **Metrics & Daemons**  | Prometheus/Alertmanager, Grafana, Zabbix, Nagios, Icinga 2                 |
| **CI/CD Pipelines**    | GitHub Actions, Bitbucket Pipelines, GitLab CI/CD, Vercel                  |
| **Uptime Monitoring**  | UptimeRobot, Pingdom, Better Uptime, Uptime Kuma                           |
| **Log Analysis**       | Splunk On-Call, Elastic/Kibana                                             |
| **Issue Tracking**     | [Jira Cloud](./issue-tracking/jira.md) (Bi-directional)                    |
| **Custom & Emulation** | Generic Webhooks, [PagerDuty Events v2](./custom/pagerduty-emulation.md)   |

### Notification Channels (Outbound)

These tools receive notifications FROM OpsKnight:

| Channel      | Purpose                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| **Slack**    | Team channels, interactive buttons, and per-incident war rooms             |
| **Jira**     | [Bi-directional issue tracking & sync](./integrations/issue-tracking/jira) |
| **Email**    | Direct inbox notifications                                                 |
| **SMS**      | Urgent alerts via text message                                             |
| **Push**     | Mobile app notifications                                                   |
| **WhatsApp** | Messaging alerts                                                           |
| **Webhooks** | Custom HTTP integrations                                                   |

---

## Quick Start: Connect Your First Tool

### Step 1: Choose Your Integration

1. Go to **Settings** → **Integrations**
2. Find your monitoring tool
3. Click **Add Integration**

### Step 2: Copy the Webhook URL

OpsKnight generates a unique webhook URL for each integration:

```
https://your-opsknight.com/api/integrations/datadog?key=int_abc123
```

### Step 3: Configure Your Monitoring Tool

Paste the webhook URL into your monitoring tool's notification settings.

### Step 4: Send a Test Alert

Trigger a test alert to verify the integration is working.

---

## Supported Integrations

### APM & Application Monitoring

#### [Datadog](./integrations/apm-monitoring/datadog)

Full-stack monitoring with APM, infrastructure metrics, and logs.

```
Endpoint: /api/integrations/datadog
Supports: Monitors, Synthetics, APM alerts
```

#### [New Relic](./integrations/apm-monitoring/new-relic)

Application performance monitoring and infrastructure.

```
Endpoint: /api/integrations/newrelic
Supports: Alert policies, incidents, synthetics
```

#### [Dynatrace](./integrations/apm-monitoring/dynatrace)

AI-powered full-stack observability.

```
Endpoint: /api/integrations/dynatrace
Supports: Problems, anomaly detection
```

#### [AppDynamics](./integrations/apm-monitoring/appdynamics)

Business-aware application performance management.

```
Endpoint: /api/integrations/appdynamics
Supports: Health rules, policy violations
```

#### [Grafana](./integrations/apm-monitoring/grafana)

Visualization and alerting platform.

```
Endpoint: /api/integrations/grafana
Supports: Alert notifications
```

#### [Honeycomb](./integrations/apm-monitoring/honeycomb)

Observability for distributed systems.

```
Endpoint: /api/integrations/honeycomb
Supports: Triggers
```

#### [Sentry](./integrations/apm-monitoring/sentry)

Error tracking and performance monitoring.

```
Endpoint: /api/integrations/sentry
Supports: Issues, errors, performance alerts
```

#### [Splunk Observability](./integrations/apm-monitoring/splunk-observability)

Splunk's observability platform.

```
Endpoint: /api/integrations/splunk-observability
Supports: Detectors, alerts
```

#### [Elastic / Kibana](./integrations/logs-events/elastic-kibana)

Elasticsearch and Kibana alerting.

```
Endpoint: /api/integrations/elastic
Supports: Watcher alerts, Kibana alerting
```

---

### Infrastructure & Cloud

#### [AWS CloudWatch](./integrations/cloud/aws-cloudwatch)

Native AWS monitoring and alerting.

```
Endpoint: /api/integrations/cloudwatch
Supports: CloudWatch Alarms via SNS
```

#### [Azure Monitor](./integrations/cloud/azure-monitor)

Microsoft Azure monitoring service.

```
Endpoint: /api/integrations/azure-monitor
Supports: Alerts, action groups
```

#### [Google Cloud Monitoring](./integrations/cloud/google-cloud-monitoring)

GCP native monitoring (formerly Stackdriver).

```
Endpoint: /api/integrations/gcp-monitoring
Supports: Alerting policies
```

---

### Metrics & Alerting

#### [Prometheus/Alertmanager](./integrations/metrics-alerting/prometheus)

Open-source metrics and alerting.

```
Endpoint: /api/integrations/prometheus
Supports: Alertmanager webhooks
```

---

### Uptime Monitoring

#### [UptimeRobot](./integrations/uptime/uptimerobot)

Website and API uptime monitoring.

```
Endpoint: /api/integrations/uptimerobot
Supports: Monitor alerts (down/up)
```

#### [Pingdom](./integrations/uptime/pingdom)

Website uptime and performance monitoring.

```
Endpoint: /api/integrations/pingdom
Supports: Uptime checks, transaction checks
```

#### [Better Uptime](./integrations/uptime/better-uptime)

Modern uptime monitoring with status pages.

```
Endpoint: /api/integrations/betteruptime
Supports: Monitor incidents
```

#### [Uptime Kuma](./integrations/uptime/uptime-kuma)

Self-hosted uptime monitoring.

```
Endpoint: /api/integrations/uptimekuma
Supports: Monitor notifications
```

---

### Log & Event Analysis

#### [Splunk On-Call](./integrations/logs-events/splunk-oncall)

Incident management from Splunk.

```
Endpoint: /api/integrations/splunk-oncall
Supports: Alerts, incidents
```

---

### CI/CD & DevOps

#### [GitHub](./integrations/ci-cd/github)

GitHub Actions and repository events.

```
Endpoint: /api/integrations/github
Supports: Workflow failures, security alerts
```

#### [Bitbucket](./integrations/ci-cd/bitbucket)

Bitbucket Pipelines and repository events.

```
Endpoint: /api/integrations/bitbucket
Supports: Pipeline failures
```

---

### Issue Tracking & Project Management

#### [Jira Cloud](./integrations/issue-tracking/jira)

Bi-directional integration with Jira Cloud for incident tracking, service project routing, real-time comment synchronization, and postmortem action items.

- Automatic Jira issue creation on incident start
- Service-level project routing (`SCRUM`, `INFRA`, `API`)
- Real-time comment sync from OpsKnight notes to Jira tickets
- Idempotent timing-safe HMAC webhooks (`issue_updated`, `issue_deleted`)
- Smart issue key and full URL link parser (`SCRUM-42` or browse URL)

[Full Jira Cloud Setup & Architecture Guide →](./integrations/issue-tracking/jira)

---

### Communication

#### [Slack](./integrations/communication/slack)

Team communication with interactive incident management.

- Rich message formatting with incident details
- Interactive buttons: Acknowledge, Resolve, View
- Thread updates for incident timeline
- Channel-based routing

[Full Setup Guide →](./integrations/communication/slack-oauth-setup)

**New in v1.2** — [ChatOps & Incident War Rooms →](./integrations/communication/slack-chatops): a dedicated Slack channel per incident, on-call responders auto-invited, `/incident` slash commands, 1-click Acknowledge/Assign/Resolve, and 📌 emoji pin sync.

---

### Custom Integrations

#### [Generic Webhooks](./integrations/custom/webhooks)

Connect any tool that can send HTTP webhooks.

```
Endpoint: /api/integrations/webhook
Supports: Any JSON payload
```

#### Events API

Programmatically create and manage incidents.

```
Endpoint: /api/events
Supports: trigger, acknowledge, resolve actions
```

[Events API Reference →](./api/events)

---

## How Integrations Work

### The Alert Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MONITORING TOOLS                              │
│   Datadog • Prometheus • CloudWatch • Sentry • GitHub • Custom       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ Webhook POST
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      OPSKNIGHT INTEGRATION                           │
│   1. Receive webhook payload                                         │
│   2. Verify signature (if configured)                                │
│   3. Parse and normalize event                                       │
│   4. Map to service via routing key                                  │
│   5. Deduplicate using dedup_key                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        INCIDENT CREATED                              │
│   - Title, description, urgency extracted                            │
│   - Service assigned                                                 │
│   - Escalation policy triggered                                      │
│   - On-call person notified                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Payload Normalization

Each integration has a custom parser that normalizes tool-specific formats:

**Datadog Alert**:

```json
{
  "title": "[Triggered] CPU High on web-01",
  "alert_type": "error",
  "tags": ["env:production", "team:platform"]
}
```

**Normalized to OpsKnight**:

```json
{
  "title": "CPU High on web-01",
  "description": "CPU usage exceeded threshold",
  "urgency": "HIGH",
  "source": "datadog",
  "dedup_key": "datadog-alert-12345"
}
```

### Deduplication

The dedup key prevents duplicate incidents from the same root cause:

1. **Same dedup key** → Updates existing incident
2. **New dedup key** → Creates new incident

This is crucial during alert storms when the same issue triggers multiple alerts.

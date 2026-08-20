---
order: 5
title: API Reference
description: Events, incidents, rate limits, and CLI — only what has a published guide
---

# API Reference

Published partner docs for this version are the pages in this folder. The install also exposes other `/api/*` routes used by the UI; those are **not** documented here until they have a stable, copy-paste contract.

---

## Published guides

| Guide                            | What it covers                                      |
| -------------------------------- | --------------------------------------------------- |
| [Events API](./events)           | Trigger, acknowledge, resolve from monitoring tools |
| [Incidents API](./incidents)     | List and manage incidents with an API key           |
| [Rate limiting](./rate-limiting) | Limits, headers, 429 behavior                       |
| [CLI](./cli)                     | Command-line access                                 |

Services, schedules, users, and teams are managed in the **UI**. REST handlers for some of those resources exist on the instance; do not treat an undocumented path as a supported public API.

---

## Authentication

All API requests require authentication. OpsKnight supports API key authentication.

### Creating an API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Enter a name (e.g., "Datadog Integration")
4. Select scopes (permissions)
5. Copy the key — it's only shown once!

### Using Your API Key

Include the API key in the `Authorization` header:

```bash
# Bearer token format (recommended)
curl -H "Authorization: Bearer sk_live_abc123..." \
  https://opsknight.yourco.com/api/incidents

# Alternative: Api-Key format
curl -H "Authorization: Api-Key sk_live_abc123..." \
  https://opsknight.yourco.com/api/incidents

# Alternative: X-API-Key header
curl -H "X-API-Key: sk_live_abc123..." \
  https://opsknight.yourco.com/api/incidents
```

### API Key Prefixes

| Prefix     | Type       | Description                 |
| ---------- | ---------- | --------------------------- |
| `sk_live_` | Production | Full access based on scopes |
| `sk_test_` | Test       | Sandbox/test environment    |

### Scopes

API keys have scoped permissions. Select only what you need:

| Scope             | Description                                 |
| ----------------- | ------------------------------------------- |
| `events:write`    | Send events (trigger, acknowledge, resolve) |
| `incidents:read`  | Read incidents and incident details         |
| `incidents:write` | Create and update incidents                 |
| `services:read`   | Read services                               |
| `services:write`  | Create and update services                  |
| `schedules:read`  | Read schedules and on-call                  |
| `schedules:write` | Create and update schedules                 |
| `users:read`      | Read users                                  |
| `users:write`     | Manage users (admin)                        |
| `teams:read`      | Read teams                                  |
| `teams:write`     | Manage teams                                |

---

## Base URL

All API endpoints are relative to your OpsKnight instance:

```
https://your-opsknight-instance.com/api
```

Example:

```
https://opsknight.yourco.com/api/incidents
```

---

## Request Format

### Headers

```http
Content-Type: application/json
Authorization: Bearer sk_live_abc123...
```

### Request Body

JSON format for POST/PATCH requests:

```json
{
  "title": "High CPU on web-01",
  "urgency": "HIGH",
  "service_id": "svc_abc123"
}
```

---

## Response Format

### Success Response

```json
{
  "data": {
    "id": "inc_abc123",
    "title": "High CPU on web-01",
    "status": "OPEN",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### List Response (Paginated)

```json
{
  "data": [
    { "id": "inc_abc123", "title": "..." },
    { "id": "inc_def456", "title": "..." }
  ],
  "pagination": {
    "total": 150,
    "limit": 25,
    "offset": 0,
    "has_more": true
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": {
      "field": "title",
      "reason": "required"
    }
  }
}
```

---

## Error Codes

| Code               | HTTP Status | Description                         |
| ------------------ | ----------- | ----------------------------------- |
| `UNAUTHORIZED`     | 401         | Invalid or missing API key          |
| `FORBIDDEN`        | 403         | API key lacks required scope        |
| `NOT_FOUND`        | 404         | Resource not found                  |
| `VALIDATION_ERROR` | 400         | Invalid request data                |
| `CONFLICT`         | 409         | Resource conflict (e.g., duplicate) |
| `RATE_LIMITED`     | 429         | Too many requests                   |
| `INTERNAL_ERROR`   | 500         | Server error                        |

---

## Rate Limits

Limits live on the instance and differ by route class. Use [Rate limiting](./rate-limiting) as the source for numbers and headers — do not copy a second table from this page.

### Rate Limit Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705318800
```

### Handling Rate Limits

When rate limited, you'll receive a `429` response:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Retry after 30 seconds.",
    "retry_after": 30
  }
}
```

**Best practices**:

- Implement exponential backoff
- Respect the `Retry-After` header
- Cache responses where appropriate
- Batch requests when possible

---

## Pagination

List endpoints support pagination:

| Parameter | Default | Max | Description    |
| --------- | ------- | --- | -------------- |
| `limit`   | 25      | 100 | Items per page |
| `offset`  | 0       | -   | Skip N items   |

### Example

```bash
# First page
GET /api/incidents?limit=25&offset=0

# Second page
GET /api/incidents?limit=25&offset=25

# Third page
GET /api/incidents?limit=25&offset=50
```

### Response

```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 25,
    "offset": 25,
    "has_more": true
  }
}
```

---

## Filtering

List endpoints support filtering via query parameters:

### Incidents API Filters

```bash
GET /api/incidents?status=OPEN&urgency=HIGH&service_id=svc_abc123
```

| Filter           | Values                                            | Description         |
| ---------------- | ------------------------------------------------- | ------------------- |
| `status`         | OPEN, ACKNOWLEDGED, RESOLVED, SNOOZED, SUPPRESSED | Incident status     |
| `urgency`        | HIGH, MEDIUM, LOW                                 | Urgency level       |
| `service_id`     | Service ID                                        | Filter by service   |
| `team_id`        | Team ID                                           | Filter by team      |
| `assignee_id`    | User ID                                           | Filter by assignee  |
| `created_after`  | ISO 8601 date                                     | Created after date  |
| `created_before` | ISO 8601 date                                     | Created before date |

### Multiple Values

Some filters accept multiple values:

```bash
GET /api/incidents?status=OPEN,ACKNOWLEDGED&urgency=HIGH,MEDIUM
```

---

## Sorting

List endpoints support sorting:

```bash
GET /api/incidents?sort=created_at&order=desc
```

| Parameter | Values                                  | Default    |
| --------- | --------------------------------------- | ---------- |
| `sort`    | created_at, updated_at, urgency, status | created_at |
| `order`   | asc, desc                               | desc       |

---

## Quick Start Examples

### Trigger an Incident

```bash
curl -X POST https://opsknight.yourco.com/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_live_abc123" \
  -d '{
    "routing_key": "payment-api",
    "event_action": "trigger",
    "dedup_key": "high-cpu-web01",
    "payload": {
      "summary": "High CPU on web-01",
      "severity": "critical",
      "source": "datadog"
    }
  }'
```

### List Open Incidents

```bash
curl -X GET "https://opsknight.yourco.com/api/incidents?status=OPEN" \
  -H "Authorization: Bearer sk_live_abc123"
```

### Acknowledge an Incident

```bash
curl -X POST https://opsknight.yourco.com/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_live_abc123" \
  -d '{
    "routing_key": "payment-api",
    "event_action": "acknowledge",
    "dedup_key": "high-cpu-web01"
  }'
```

---

## Official CLI

- [CLI](./cli)

---

## Webhooks (Outbound)

OpsKnight can send webhooks to your systems when events occur.

### Supported Events

| Event                   | Description                     |
| ----------------------- | ------------------------------- |
| `incident.triggered`    | New incident created            |
| `incident.acknowledged` | Incident acknowledged           |
| `incident.resolved`     | Incident resolved               |
| `incident.escalated`    | Incident escalated to next step |
| `incident.assigned`     | Incident assigned/reassigned    |

### Webhook Payload

```json
{
  "event": "incident.triggered",
  "timestamp": "2024-01-15T10:30:00Z",
  "incident": {
    "id": "inc_abc123",
    "title": "High CPU on web-01",
    "status": "OPEN",
    "urgency": "HIGH",
    "service": {
      "id": "svc_xyz",
      "name": "Payment API"
    },
    "assignee": {
      "id": "usr_123",
      "name": "Alice Smith"
    }
  }
}
```

### Signature Verification

Webhooks include an HMAC-SHA256 signature:

```http
X-OpsKnight-Signature: sha256=abc123def456...
```

Verify by computing HMAC of the raw request body using your webhook secret.

---

## What this version actually ships

- Events ingest (including PagerDuty Events API v2 as an **ingest adapter**, not a full PD clone)
- Incidents REST for automation that has an API key
- Rate limits described in [Rate limiting](./rate-limiting)
- CLI in [CLI](./cli)

Issues: [GitHub](https://github.com/opsknight-labs/OpsKnight/issues)

# Core Concepts

Understanding the fundamental building blocks of OpsSentinal.

## In This Section

| Concept                                         | Description                 |
| ----------------------------------------------- | --------------------------- |
| [Dashboard](./dashboard.md)                     | Command center overview     |
| [Services](./services.md)                       | Systems you monitor         |
| [Incidents](./incidents.md)                     | Alert lifecycle management  |
| [Teams](./teams.md)                             | User organization           |
| [Users](./users.md)                             | User management and roles   |
| [Schedules](./schedules.md)                     | On-call rotations           |
| [Escalation Policies](./escalation-policies.md) | Multi-tier escalation       |
| [Analytics](./analytics.md)                     | Metrics and insights        |
| [Postmortems](./postmortems.md)                 | Incident reviews            |
| [Status Page](./status-page.md)                 | Public status communication |

## How It All Connects

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Service   │────▶│   Incident  │────▶│   On-Call   │
│             │     │             │     │   Person    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Escalation  │     │  Timeline   │     │   Notify    │
│   Policy    │     │             │     │   (SMS/Push)│
└─────────────┘     └─────────────┘     └─────────────┘
```

1. **Services** represent systems (APIs, databases, etc.)
2. **Incidents** are triggered when something goes wrong
3. **Schedules** determine who is on-call
4. **Escalation Policies** ensure incidents reach the right people
5. **Teams** organize users by function or responsibility

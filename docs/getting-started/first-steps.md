# First Steps

After installing OpsSentinal, follow these steps to set up your incident management workflow.

## 1. Create Admin User

If you haven't already, create your first admin user:

```bash
docker exec -it opssentinal_app npm run opssentinal -- \
  --user "Your Name" \
  --email admin@yourcompany.com \
  --password SecurePassword123! \
  --role admin
```

## 2. Log In

1. Open http://localhost:3000
2. Click **Sign In**
3. Enter your admin credentials

## 3. Create Your First Service

Services represent the systems you want to monitor.

1. Navigate to **Services** in the sidebar
2. Click **+ New Service**
3. Fill in:
   - **Name**: e.g., "API Gateway"
   - **Description**: Brief description of the service
4. Click **Create**

## 4. Create an Integration Key

Integration keys allow external systems to send alerts.

1. Go to your service details
2. Click **Integrations** tab
3. Click **+ Add Integration**
4. Copy the generated **Routing Key**

## 5. Trigger a Test Incident

Use the API to trigger a test incident:

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "YOUR_ROUTING_KEY",
    "event_action": "trigger",
    "dedup_key": "test-incident-001",
    "payload": {
      "summary": "Test Incident",
      "source": "manual-test",
      "severity": "warning"
    }
  }'
```

## 6. View the Incident

1. Navigate to **Incidents** in the sidebar
2. You should see your test incident
3. Click to view details
4. Try **Acknowledge** and **Resolve** actions

## Next Steps

- [Set up Teams](../core-concepts/teams.md) - Organize users
- [Create Schedules](../core-concepts/schedules.md) - On-call rotations
- [Configure Notifications](../administration/notifications.md) - SMS, Push, Email
- [Connect Slack](../integrations/slack.md) - Team notifications

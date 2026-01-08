# Teams

Teams help organize users by function, responsibility, or domain.

## What are Teams?

Teams are groups of users who share responsibility for specific services or areas:

- Platform Team
- Backend Team
- Infrastructure Team
- Support Team

## Creating a Team

1. Navigate to **Teams** in the sidebar
2. Click **+ New Team**
3. Fill in:
   - **Name**: Team identifier
   - **Description**: Team's responsibilities

## Team Roles

| Role       | Permissions                   |
| ---------- | ----------------------------- |
| **Owner**  | Full control, can delete team |
| **Admin**  | Manage members, settings      |
| **Member** | Standard access               |

## Adding Team Members

1. Open the team
2. Go to **Members** tab
3. Click **+ Add Member**
4. Search for users
5. Assign a role

## Team Notifications

Configure how the team receives alerts:

1. Go to **Settings** tab
2. Toggle notification preferences:
   - Email notifications
   - Slack channel
   - SMS alerts

## Assigning Services to Teams

Link services to teams for organization:

1. Open the service
2. Go to **Settings**
3. Select the owning **Team**

## Use Cases

### By Function

- `platform-team` - Core infrastructure
- `backend-team` - API services
- `frontend-team` - Web applications

### By Service Area

- `payments-team` - Payment processing
- `auth-team` - Authentication services
- `data-team` - Data pipelines

### By Geography

- `us-east-team` - US East region
- `eu-west-team` - EU West region

## Best Practices

- ✅ Keep teams focused on specific domains
- ✅ Ensure every service has an owning team
- ✅ Use teams in escalation policies
- ✅ Configure team-specific notification channels

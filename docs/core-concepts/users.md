# Users

User management and role-based access control in OpsSentinal.

## User Roles

OpsSentinal has three built-in roles:

| Role          | Description        | Capabilities                    |
| ------------- | ------------------ | ------------------------------- |
| **Admin**     | Full system access | All permissions                 |
| **Responder** | On-call responders | Manage incidents, view services |
| **User**      | Read-only access   | View incidents, dashboards      |

## Creating Users

### Via CLI (Recommended for Initial Setup)

```bash
npm run opssentinal -- \
  --user "John Doe" \
  --email john@company.com \
  --password SecurePass123! \
  --role responder
```

### Via UI

1. Navigate to **Users** in the sidebar
2. Click **+ Invite User**
3. Enter email address
4. Select role
5. Send invitation

## User Permissions

### Admin

- ✅ Manage all users
- ✅ Configure system settings
- ✅ Create/delete services
- ✅ Manage integrations
- ✅ Access audit logs

### Responder

- ✅ Acknowledge/resolve incidents
- ✅ Create incidents
- ✅ Manage their schedules
- ✅ View all services
- ❌ System settings

### User

- ✅ View incidents
- ✅ View services
- ✅ View schedules
- ❌ Modify anything

## User Settings

Users can manage their own:

1. **Profile** - Name, contact info
2. **Preferences** - Timezone, digest settings
3. **Security** - Password, sessions
4. **Notification Methods** - Phone, email

## SSO/OIDC

For enterprise deployments, configure SSO:

1. Go to **Settings → Authentication**
2. Configure OIDC provider
3. Map roles from identity provider

See [Authentication](../administration/authentication.md) for details.

## Deactivating Users

When someone leaves:

1. Go to **Users**
2. Find the user
3. Click **Deactivate**

> [!NOTE]
> Deactivated users cannot log in but their history is preserved.

## Best Practices

- ✅ Use least-privilege roles
- ✅ Configure SSO for enterprises
- ✅ Ensure all responders have contact methods
- ✅ Audit user access regularly

# Authentication

Configure how users authenticate with OpsSentinal.

## Authentication Methods

| Method   | Best For                 |
| -------- | ------------------------ |
| Local    | Small teams, development |
| SSO/OIDC | Enterprise, compliance   |

## Local Authentication

Default authentication using email and password.

### Creating Users

```bash
npm run opssentinal -- \
  --user "John Doe" \
  --email john@company.com \
  --password SecurePass123! \
  --role responder
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

## SSO/OIDC Configuration

Enterprise single sign-on via OpenID Connect.

### Supported Providers

- Okta
- Azure AD
- Google Workspace
- Auth0
- Keycloak
- Any OIDC-compliant provider

### Setup Steps

1. Go to **Settings → Authentication**
2. Enable **OIDC/SSO**
3. Configure:

| Field          | Description                 |
| -------------- | --------------------------- |
| Issuer URL     | Provider's OIDC issuer      |
| Client ID      | App client ID               |
| Client Secret  | App client secret           |
| Auto Provision | Create users on first login |

### Role Mapping

Map provider roles to OpsSentinal roles:

```
Provider Role    → OpsSentinal Role
admin            → Admin
engineer         → Responder
viewer           → User
```

Configure in **Settings → Authentication → Role Mapping**

## Encryption Keys

OpsSentinal encrypts sensitive data:

- API tokens
- Integration secrets
- Notification credentials

### Key Management

Keys are derived from `NEXTAUTH_SECRET`.

> [!IMPORTANT]
> Changing `NEXTAUTH_SECRET` will invalidate all encrypted data.

### Key Rotation

To rotate keys:

1. Export encrypted data
2. Update `NEXTAUTH_SECRET`
3. Re-configure integrations

## Session Management

Users can view and revoke active sessions:

1. Go to **Settings → Security**
2. View **Active Sessions**
3. Click **Revoke** to end a session

## Best Practices

- ✅ Use SSO for production
- ✅ Enable auto-provisioning
- ✅ Configure role mapping
- ✅ Regularly audit user access
- ✅ Keep `NEXTAUTH_SECRET` secure

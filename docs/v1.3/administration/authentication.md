---
order: 1
title: Authentication
description: Operate local credentials, OIDC, password recovery, and JWT session revocation safely.
---

# Authentication

OpsKnight v1.3 supports local email/password authentication and one workspace OIDC provider. Both can be available on the login page. Authentication proves identity; [authorization](../security/authorization.md) determines what the signed-in user may do.

## Production prerequisites

Set a stable public HTTPS origin and preserve the authentication secrets:

| Setting               | Purpose                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `NEXTAUTH_URL`        | Exact public origin used for callbacks and secure-cookie selection.                              |
| `NEXTAUTH_SECRET`     | Signs/encrypts session tokens; changing it invalidates existing sessions.                        |
| `ENCRYPTION_KEY`      | Stable 64-hex-character key used to encrypt the OIDC client secret and other stored credentials. |
| `NEXT_PUBLIC_APP_URL` | Public origin used in user-facing links; normally matches `NEXTAUTH_URL`.                        |

The reverse proxy must forward the original host and scheme. Back up secrets outside PostgreSQL; restoring the database without the matching encryption key does not restore usable OIDC credentials.

## Bootstrap the first Admin

When no user exists, open `/setup`, enter the Admin name and email, and create the account. OpsKnight displays a generated password once. Store it securely, sign in, change it immediately, and create a second Admin. Setup stops accepting another bootstrap after a user exists.

## Local accounts

Admins invite subsequent users from **Users**. An invitation is valid for seven days and earlier unused invite tokens are invalidated when a replacement is generated. Treat the link as a credential.

Passwords must be 10–128 characters and contain lowercase, uppercase, numeric, and special characters. These rules are fixed in v1.3; there is no configurable expiry, history, or complexity policy.

### Password recovery

The login page's **Forgot password** flow returns the same message for registered and unknown addresses. A reset token:

- expires after one hour;
- invalidates earlier unused reset tokens for the address;
- is delivered by configured email, with SMS fallback only when the user and provider permit it;
- increments the user's token version after use, revoking existing sessions.

If no delivery provider is available, an Admin can generate a reset link from the supported user-management workflow. Share any reset link only through an approved secret channel.

## Configure OIDC

You need `ADMIN` and a working `ENCRYPTION_KEY`.

1. Register a confidential OIDC web application at the identity provider.
2. Add this exact callback URL:

   ```text
   https://YOUR_OPSKNIGHT_URL/api/auth/callback/oidc
   ```

3. Go to **Settings** → **System** → **Single Sign-On (OIDC)**.
4. Enter the HTTPS issuer, client ID, client secret, and optional provider label/scopes.
5. Select **Test connection** to validate issuer discovery.
6. Configure provisioning restrictions and mappings before enabling OIDC.
7. Save, then test with a non-Admin account in a private browser session while retaining a working local Admin session.

Default scopes are `openid email profile`; custom scopes are appended. The provider's claims—not its brand—determine whether domain, role, and profile rules work. See [OIDC setup](../security/oidc-setup.md) for registration examples.

### Email and identity safety

OpsKnight requires an email. An explicit `email_verified: false` is rejected. Set `OIDC_REQUIRE_EMAIL_VERIFIED_STRICT=true` to also reject a missing claim.

An OIDC identity is bound to normalized issuer plus subject. If an existing local user's email has no such identity link, v1.3 blocks automatic email-only linking to prevent account takeover. Plan account migration and test it before enforcing SSO.

### Auto-provisioning and domains

When auto-provisioning is disabled, an unknown OIDC user is denied. When enabled, an eligible first login creates an active `USER` account. A non-empty allowed-domain list requires an exact lower-case email-domain match.

OIDC sign-in can reactivate an existing linked disabled user. If deactivation must remain authoritative, remove or block the identity at the IdP as part of offboarding.

### Role mapping

Rules are evaluated in order; the first exact scalar or array-value match wins:

```json
[
  { "claim": "groups", "value": "opsknight-admins", "role": "ADMIN" },
  { "claim": "groups", "value": "on-call", "role": "RESPONDER" }
]
```

Valid targets are `USER`, `RESPONDER`, and `ADMIN`. A newly provisioned user begins as `USER`; if no rule matches, an existing user's current role is retained. Mapping can both promote and demote on later login, so use a dedicated, tightly governed Admin group.

### Profile mapping

Map IdP claim names to `department`, `jobTitle`, and `avatarUrl`. Non-empty values synchronize on login. An avatar uploaded locally under `/uploads/` is not overwritten by OIDC profile synchronization.

## Sessions

Sessions are JWT based. Web login without **Remember me** has a seven-day ceiling; remembered web sessions and mobile sessions have a one-year ceiling. Activity refreshes session state at most hourly, but there is no separate configurable idle-timeout control in v1.3.

Cookies are HTTP-only where appropriate and use `SameSite=Lax`. `NEXTAUTH_URL` beginning with `https://` enables Secure cookies and secure name prefixes; an origin mismatch commonly causes login loops.

**Settings** → **Security** offers **Revoke all sessions**. It increments the user's token version; v1.3 does not list or revoke individual devices. Role/status changes may take effect after the authentication user-cache refresh, so use session revocation for urgent access removal and remove access at the IdP too.

## Failure-safe rollout

- Keep a tested local break-glass Admin while introducing OIDC.
- Restrict auto-provision domains before enabling it.
- Test normal, denied-domain, missing-claim, disabled-user, and Admin-group cases.
- Confirm role mapping cannot grant Admin through a user-controlled claim.
- Verify revoke-all and IdP disable behavior.
- Record the rollback: disable OIDC using the retained local Admin session.

## Troubleshooting

| Symptom                       | Check                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| Redirect/cookie loop          | Exact HTTPS `NEXTAUTH_URL`, forwarded host/scheme, and browser cookie policy.           |
| Discovery test fails          | Issuer is HTTPS and exposes valid OIDC discovery metadata from the app network.         |
| Existing local user is denied | Identity is not safely linked; do not bypass by weakening email/subject checks.         |
| New user is denied            | Auto-provision setting, exact allowed domain, email and verification claims.            |
| Role does not update          | Requested custom scope, actual ID-token/profile claim, JSON rule order and exact value. |
| Secret cannot decrypt         | Restore the matching `ENCRYPTION_KEY` or enter a new client secret.                     |

## Related topics

- [Authorization](../security/authorization.md)
- [OIDC setup](../security/oidc-setup.md)
- [Users](../core-concepts/users.md)
- [Configuration](../getting-started/configuration.md)
- [Troubleshooting](../troubleshooting.md)

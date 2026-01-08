# CLI Tool

The OpsSentinalCLI for user management and automation.

## Installation

The CLI is included with OpsSentinal:

```bash
npm run opssentinal -- [options]
```

## User Management

### Create User

```bash
npm run opssentinal -- \
  --user "John Doe" \
  --email john@company.com \
  --password SecurePass123! \
  --role admin
```

### Options

| Option       | Description                        | Required |
| ------------ | ---------------------------------- | -------- |
| `--user`     | User's full name                   | ✅       |
| `--email`    | Email address                      | ✅       |
| `--password` | Password                           | ✅       |
| `--role`     | Role: `admin`, `responder`, `user` | ✅       |
| `--update`   | Update existing user               | -        |

### Update User

```bash
npm run opssentinal -- \
  --user "John Doe" \
  --email john@company.com \
  --password NewPassword123! \
  --role responder \
  --update
```

## Docker Usage

When running in Docker:

```bash
docker exec -it opssentinal_app npm run opssentinal -- \
  --user "Admin" \
  --email admin@example.com \
  --password SecurePass123! \
  --role admin
```

## Kubernetes Usage

```bash
kubectl exec -it deploy/opssentinal -- npm run opssentinal -- \
  --user "Admin" \
  --email admin@example.com \
  --password SecurePass123! \
  --role admin
```

## Common Tasks

### Initial Setup

Create the first admin user after deployment:

```bash
npm run opssentinal -- \
  --user "System Admin" \
  --email admin@yourcompany.com \
  --password "$(openssl rand -base64 16)" \
  --role admin
```

### Reset Password

```bash
npm run opssentinal -- \
  --user "John Doe" \
  --email john@company.com \
  --password NewSecurePass! \
  --role responder \
  --update
```

### Promote User

```bash
npm run opssentinal -- \
  --email john@company.com \
  --role admin \
  --update
```

## Exit Codes

| Code | Meaning |
| ---- | ------- |
| 0    | Success |
| 1    | Error   |

## Best Practices

- ✅ Use strong passwords
- ✅ Store credentials securely
- ✅ Audit user creation
- ✅ Use SSO for production

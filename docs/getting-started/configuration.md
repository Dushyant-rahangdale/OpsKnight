# Configuration Reference

All environment variables used by OpsSentinal.

## Required Variables

| Variable          | Description                   | Example                                 |
| ----------------- | ----------------------------- | --------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection string  | `postgresql://user:pass@host:5432/db`   |
| `NEXTAUTH_URL`    | Public URL of the application | `https://ops.yourcompany.com`           |
| `NEXTAUTH_SECRET` | Secret for session encryption | Generate with `openssl rand -base64 32` |

## Optional Variables

### Cron Jobs

| Variable               | Description                        | Default              |
| ---------------------- | ---------------------------------- | -------------------- |
| `CRON_SECRET`          | Secret for cron job authentication | -                    |
| `ENABLE_INTERNAL_CRON` | Enable internal scheduler          | `true` in production |

### Email (SMTP)

Configure via **Settings → Notifications** UI, or set these variables:

| Variable        | Description             |
| --------------- | ----------------------- |
| `SMTP_HOST`     | SMTP server hostname    |
| `SMTP_PORT`     | SMTP port (usually 587) |
| `SMTP_USER`     | SMTP username           |
| `SMTP_PASSWORD` | SMTP password           |
| `SMTP_FROM`     | From email address      |

### SMS (Twilio)

| Variable              | Description         |
| --------------------- | ------------------- |
| `TWILIO_ACCOUNT_SID`  | Twilio Account SID  |
| `TWILIO_AUTH_TOKEN`   | Twilio Auth Token   |
| `TWILIO_PHONE_NUMBER` | Twilio phone number |

### Push Notifications (OneSignal)

| Variable            | Description            |
| ------------------- | ---------------------- |
| `ONESIGNAL_APP_ID`  | OneSignal App ID       |
| `ONESIGNAL_API_KEY` | OneSignal REST API Key |

### AWS SNS

| Variable                | Description    |
| ----------------------- | -------------- |
| `AWS_REGION`            | AWS region     |
| `AWS_ACCESS_KEY_ID`     | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |

### PostgreSQL (Docker Compose)

| Variable            | Description       | Default          |
| ------------------- | ----------------- | ---------------- |
| `POSTGRES_USER`     | Database user     | `opssentinal`    |
| `POSTGRES_PASSWORD` | Database password | -                |
| `POSTGRES_DB`       | Database name     | `opssentinal_db` |

## Security Best Practices

> [!IMPORTANT]
> Never commit `.env` files to version control.

1. Use strong, unique values for all secrets
2. Rotate `NEXTAUTH_SECRET` periodically
3. Use environment-specific configurations
4. Enable HTTPS in production

## Example `.env` File

```bash
# Database
DATABASE_URL=postgresql://opssentinal:secure_password@localhost:5432/opssentinal_db

# NextAuth
NEXTAUTH_URL=https://ops.yourcompany.com
NEXTAUTH_SECRET=your-32-char-secret-here

# Cron
CRON_SECRET=your-cron-secret
ENABLE_INTERNAL_CRON=true

# Email (optional - configure via UI)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=user@example.com
# SMTP_PASSWORD=password
# SMTP_FROM=noreply@example.com
```

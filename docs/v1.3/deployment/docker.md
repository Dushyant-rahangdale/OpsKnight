---
order: 1
title: Docker Compose
description: Deploy, verify, back up, upgrade, and recover the supported OpsKnight Compose stack.
---

# Docker Compose

The repository Compose file runs the published OpsKnight image and PostgreSQL 15 on one Docker host. It is the evaluation path and a practical small-install topology, but it is not highly available.

## Prerequisites

- Docker Engine with the Compose v2 plugin (`docker compose version`).
- Capacity for the application, PostgreSQL, database growth, backups, and container-image updates.
- A public HTTPS origin and reverse proxy for production.
- A durable backup destination outside the Compose volume.

## Configure secrets before first production start

```bash
git clone https://github.com/opsknight-labs/OpsKnight.git
cd OpsKnight
cp env.example .env
openssl rand -base64 32
openssl rand -hex 32
```

Set at least:

```dotenv
POSTGRES_USER=opsknight
POSTGRES_PASSWORD=REPLACE_WITH_A_LONG_DATABASE_PASSWORD
POSTGRES_DB=opsknight_db
NEXTAUTH_URL=https://ops.example.com
NEXTAUTH_SECRET=REPLACE_WITH_BASE64_OUTPUT
NEXT_PUBLIC_APP_URL=https://ops.example.com
ENCRYPTION_KEY=REPLACE_WITH_64_HEX_CHARACTERS
APP_PORT=3000
```

The checked-in Compose file contains development fallbacks. They are not safe production secrets. `ENCRYPTION_KEY` must remain stable and backed up; losing it means re-entering encrypted provider and integration credentials.

The Compose application constructs `DATABASE_URL` using the internal hostname `opsknight-db`. Do not set it to `localhost` inside the application container.

## Start and verify

```bash
docker compose config
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail=200 opsknight-app
curl --fail http://localhost:3000/api/health
```

Open the configured origin and complete `/setup` to create the first administrator. Then verify a database write by creating a test service and a test incident.

`opsknight-app` waits for the database health check. Its entrypoint runs `prisma migrate deploy` with up to three attempts, tries the packaged recovery helper after failures, and then starts the application even if all migration attempts fail. Therefore, a running container does not by itself prove migrations succeeded: inspect startup logs and readiness.

## TLS and proxying

Terminate TLS at a reverse proxy and forward the original host and scheme. A minimal nginx location is:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Keep port 5432 private in production. The default Compose file publishes it to the host for convenience; restrict it with host firewall rules or maintain a production override that does not publish the database port.

## Configure providers

Notification-provider credentials are configured in **Settings → Notification Providers**, not with SMTP or Twilio environment variables. See [Notifications](../administration/notifications).

## Back up

Create a logical database backup and store it outside the Docker volume:

```bash
docker compose exec -T opsknight-db \
  pg_dump -U opsknight -d opsknight_db -Fc > opsknight-$(date +%Y%m%d-%H%M%S).dump
```

Also back up the production `.env`/secret-store values, especially `NEXTAUTH_SECRET` and `ENCRYPTION_KEY`, using your secrets-management process. Never commit them.

Validate backups by restoring into an isolated database on a regular schedule. A backup that has never been restored is not a recovery plan.

## Restore

Restoring overwrites or conflicts with existing data. Schedule downtime, preserve the current database first, and restore into an empty isolated database whenever possible.

```bash
docker compose stop opsknight-app
docker compose exec -T opsknight-db \
  pg_restore --clean --if-exists --no-owner -U opsknight -d opsknight_db \
  < BACKUP.dump
docker compose start opsknight-app
docker compose logs --tail=200 opsknight-app
curl --fail http://localhost:3000/api/health
```

Confirm users, services, integrations, and a test incident before declaring recovery complete.

## Upgrade

Do not use the floating `latest` tag for a controlled production release without first recording the image digest you tested.

1. Read release and migration notes.
2. Take and verify a database backup.
3. Record the current image reference/digest and `.env`.
4. Pull the intended release image.
5. Recreate the app and watch migration/startup logs.
6. Run health, login, database-write, and test-incident checks.

```bash
docker compose pull opsknight-app
docker compose up -d opsknight-app
docker compose logs -f opsknight-app
```

Database migrations may not be backward compatible. Rolling only the image back can be unsafe after a migration; follow the release's rollback instructions and restore the pre-upgrade database when required.

## Routine operations

```bash
docker compose ps
docker compose logs -f opsknight-app
docker compose logs -f opsknight-db
docker compose restart opsknight-app
docker compose down
```

`docker compose down` preserves the named database volume. `docker compose down -v` deletes it and destroys the database; use `-v` only for a disposable environment after confirming the target project and backup.

## Troubleshooting

| Symptom                                     | Check                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| Database remains unhealthy                  | `opsknight-db` logs, credentials, volume ownership/capacity, and host disk.        |
| App loops/restarts                          | App startup logs, migration errors, required secrets, and database readiness.      |
| Login redirects loop                        | Browser origin exactly matches `NEXTAUTH_URL`; proxy forwards Host and scheme.     |
| Health check fails                          | `/api/health`, database reachability, migrations, and container resource pressure. |
| Provider settings disappear/fail to decrypt | Stable `ENCRYPTION_KEY` and restored database belong to the same installation.     |
| Push does not register                      | Public HTTPS origin, VAPID provider, browser permission, and service worker.       |

See [Troubleshooting](../troubleshooting) and [Configuration Reference](../getting-started/configuration).

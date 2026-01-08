# Docker Deployment

Deploy OpsSentinal with Docker Compose.

## Quick Start

```bash
# Clone repository
git clone https://github.com/dushyant-rahangdale/opssentinal.git
cd opssentinal

# Configure
cp env.example .env
# Edit .env with your settings

# Start
docker compose up -d

# Create admin
docker exec -it opssentinal_app npm run opssentinal -- \
  --user "Admin" --email admin@example.com \
  --password SecurePass123! --role admin
```

## Configuration

### Required Environment Variables

```bash
DATABASE_URL=postgresql://opssentinal:password@postgres:5432/opssentinal_db
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-32-char-secret
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Docker Compose Files

| File                      | Purpose                     |
| ------------------------- | --------------------------- |
| `docker-compose.yml`      | Standard deployment         |
| `docker-compose.dev.yml`  | Development with hot reload |
| `docker-compose.prod.yml` | Production optimizations    |

## Production Deployment

### Step 1: Configure Environment

```bash
cp env.example .env
```

Edit `.env`:

```bash
DATABASE_URL=postgresql://opssentinal:STRONG_PASSWORD@postgres:5432/opssentinal_db
NEXTAUTH_URL=https://ops.yourcompany.com
NEXTAUTH_SECRET=<generated-secret>
POSTGRES_PASSWORD=STRONG_PASSWORD
```

### Step 2: Deploy

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Step 3: Setup Reverse Proxy

Use nginx or Traefik for SSL termination.

Example nginx config:

```nginx
server {
    listen 443 ssl;
    server_name ops.yourcompany.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

## Updating

```bash
# Pull latest
git pull
docker compose pull

# Restart
docker compose up -d
```

## Backup

```bash
# Database backup
docker exec opssentinal_postgres pg_dump -U opssentinal opssentinal_db > backup.sql

# Restore
cat backup.sql | docker exec -i opssentinal_postgres psql -U opssentinal opssentinal_db
```

## Troubleshooting

### View Logs

```bash
docker compose logs -f app
docker compose logs -f postgres
```

### Reset Database

```bash
docker compose down -v
docker compose up -d
```

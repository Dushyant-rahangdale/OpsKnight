# Installation Guide

This guide covers all deployment options for OpsSentinal.

## Deployment Options

| Method                                    | Best For                          |
| ----------------------------------------- | --------------------------------- |
| [Docker Compose](#docker-compose)         | Development and small deployments |
| [Kubernetes](../deployment/kubernetes.md) | Production and scaling            |
| [Local Development](#local-development)   | Contributing and testing          |

---

## Docker Compose

The recommended way to run OpsSentinal.

### Step 1: Clone and Configure

```bash
git clone https://github.com/dushyant-rahangdale/opssentinal.git
cd opssentinal
cp env.example .env
```

### Step 2: Configure Environment

Edit `.env` with your settings:

```bash
# Required
DATABASE_URL=postgresql://opssentinal:your_password@postgres:5432/opssentinal_db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32

# Optional - Configure via UI
CRON_SECRET=your-cron-secret
```

### Step 3: Start Services

```bash
docker compose up -d
```

### Step 4: Create Admin User

```bash
docker exec -it opssentinal_app npm run opssentinal -- \
  --user "Admin" \
  --email admin@example.com \
  --password SecurePass123! \
  --role admin
```

---

## Local Development

For contributors and developers.

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate deploy
npx prisma generate

# Start development server
npm run dev
```

---

## Verifying Installation

After installation, verify:

1. ✅ Application loads at http://localhost:3000
2. ✅ You can log in with the admin account
3. ✅ Dashboard displays without errors

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker compose logs postgres

# Reset database
docker compose down -v
docker compose up -d
```

### Port Conflicts

If port 3000 is in use, modify `docker-compose.yml`:

```yaml
ports:
  - '3001:3000' # Use port 3001 instead
```

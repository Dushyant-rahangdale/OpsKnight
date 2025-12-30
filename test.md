# OpsSentinal End-to-End Testing Guide

This document provides comprehensive guidance for setting up and running the full OpsSentinal test suite (500+ tests), including unit tests, integration tests, and database-resilience tests.

## 1. Environment Setup

### 1.1 Local Database (Docker)
The integration tests require a real PostgreSQL instance. The easiest way to start one is using Docker:

```powershell
docker run --name opssentinal-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=opssentinal_test -p 5432:5432 -d postgres
```

### 1.2 Configuration
Create or update `file:///c:/Users/Dushyant.Rahangdale/Repo/OpsSentinal/.env.test` with your test database connection:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/opssentinal_test"
VITEST_USE_REAL_DB=1
```

### 1.3 Database Migration
Before running tests for the first time or after schema changes, apply the migrations to the test database:

```powershell
npx prisma migrate dev
```

## 2. Running the Test Suite

### 2.1 Full Comprehensive Run (Real DB)
This command runs **all 500+ tests** (Unit + Integration) against the real database. This is required for CI readiness.

```powershell
# Windows (PowerShell)
$env:VITEST_USE_REAL_DB=1; npx vitest run --no-file-parallelism --maxWorkers=1

# Linux/macOS
VITEST_USE_REAL_DB=1 npx vitest run --no-file-parallelism --maxWorkers=1
```
> [!IMPORTANT]
> `--no-file-parallelism` and `--maxWorkers=1` are crucial to prevent race conditions during database resets between different test files.

### 2.2 Quick Unit Tests (Mocked DB)
To check core logic without requiring a database:
```powershell
npm run test:run
```

### 2.3 Resilience & Job Queue Tests
Targeted testing for concurrency, locking, and background processing:
```powershell
$env:VITEST_USE_REAL_DB=1; npx vitest run tests/integration/resilience.test.ts tests/integration/job-queue.test.ts tests/integration/event-resilience.test.ts --no-file-parallelism --maxWorkers=1
```

## 3. CI Simulation
To verify exactly what will run on GitHub Actions:
```powershell
npm run test:ci
```

## 4. Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **Foreign Key Violations** | Standardize tests to use the `resetDatabase()` helper in `beforeEach`. Manual `deleteMany` calls are discouraged as they often miss child records. |
| **Serializable Retries** | If you see `Serializable` errors under load, check `src/lib/config.ts`. The default `EVENT_TRANSACTION_MAX_ATTEMPTS` is set to 5. |
| **Slow Query Warnings** | Tests targeting the API or complex escalations may log "Slow query detected". This is expected in local environments; test timeouts are set to 30s to accommodate this. |
| **Port Conflicts** | If 5432 is taken, change the port in `docker run` and update `DATABASE_URL` accordingly. |

## 5. Adding New Tests
When adding new integration tests, always import helpers from `file:///c:/Users/Dushyant.Rahangdale/Repo/OpsSentinal/tests/helpers/test-db.ts` to ensure consistent data seeding and database resets.

# CI/CD Guide - OpsGuard

This guide explains the CI/CD pipeline setup, Docker image tagging strategy, and how to use it.

## Overview

OpsGuard uses GitHub Actions for continuous integration and deployment with a comprehensive Docker image tagging strategy that supports testing, production, and rollback scenarios.

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Pull requests to `main`
- Pushes to `main` branch

**What it does:**
- Runs linting
- Runs tests
- Generates test coverage
- Builds Docker images for testing

**Image Tags:**
- **Pull Requests:** `test-pr-<PR_NUMBER>` and `test-<commit-sha>`
- **Main Branch:** `test` and `test-<commit-sha>`

**Example:**
```bash
# PR #42
ghcr.io/username/opsguard:test-pr-42
ghcr.io/username/opsguard:test-abc1234

# Main branch
ghcr.io/username/opsguard:test
ghcr.io/username/opsguard:test-def5678
```

---

### 2. CD Workflow (`.github/workflows/cd.yml`)

**Triggers:**
- Version tags (e.g., `v0.1.0`, `v1.2.3`)
- Manual workflow dispatch

**What it does:**
- Builds production Docker images
- Tags images with version, latest, and commit SHA
- Runs security scans
- Publishes to GitHub Container Registry

**Image Tags:**
- `v<version>` (e.g., `v0.1.0`) - **For rollbacks**
- `latest` - **Current production**
- `stable` - **Stable release marker**
- `<commit-sha>` - **Specific commit**

**Example:**
```bash
# Version v0.1.0
ghcr.io/username/opsguard:v0.1.0  # Rollback target
ghcr.io/username/opsguard:latest   # Current production
ghcr.io/username/opsguard:stable   # Stable marker
ghcr.io/username/opsguard:abc1234  # Commit SHA
```

---

### 3. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Manual workflow dispatch

**What it does:**
- Creates a git tag
- Creates a GitHub release
- Triggers the CD workflow automatically

---

## Docker Image Tagging Strategy

### Tag Types

| Tag | Purpose | Example | When Created |
|-----|---------|---------|--------------|
| `test` | Testing/staging | `test` | On push to main |
| `test-pr-<N>` | PR testing | `test-pr-42` | On PR creation |
| `test-<sha>` | Test commit | `test-abc1234` | On any test build |
| `v<version>` | Versioned release | `v0.1.0` | On version tag |
| `latest` | Production | `latest` | On version tag |
| `stable` | Stable marker | `stable` | On version tag |
| `<sha>` | Specific commit | `abc1234` | On version tag |

### Rollback Strategy

**Scenario:** You need to rollback from `v0.2.0` to `v0.1.0`

```bash
# Option 1: Use version tag (recommended)
docker pull ghcr.io/username/opsguard:v0.1.0
docker tag ghcr.io/username/opsguard:v0.1.0 ghcr.io/username/opsguard:latest

# Option 2: Use commit SHA
docker pull ghcr.io/username/opsguard:abc1234
docker tag ghcr.io/username/opsguard:abc1234 ghcr.io/username/opsguard:latest
```

### Image Naming Convention

All images are stored in GitHub Container Registry:
```
ghcr.io/<username>/<repository>:<tag>
```

Example:
```
ghcr.io/Dushyant-rahangdale/OpsGuard:v0.1.0
```

---

## Usage Guide

### Creating a Release

#### Method 1: Using Release Workflow (Recommended)

1. Go to **Actions** → **Release - Create Version Tag**
2. Click **Run workflow**
3. Enter version (e.g., `0.1.0`)
4. Optionally add release notes
5. Click **Run workflow**

This will:
- Create git tag `v0.1.0`
- Create GitHub release
- Trigger CD workflow to build production images

#### Method 2: Manual Tag Creation

```bash
# Create and push tag
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

The CD workflow will automatically:
- Build production images
- Tag with `v0.1.0`, `latest`, `stable`, and commit SHA
- Run security scans

### Pulling Images

#### Production (Latest)
```bash
docker pull ghcr.io/Dushyant-rahangdale/OpsGuard:latest
```

#### Specific Version (Rollback)
```bash
docker pull ghcr.io/Dushyant-rahangdale/OpsGuard:v0.1.0
```

#### Testing
```bash
docker pull ghcr.io/Dushyant-rahangdale/OpsGuard:test
```

### Using in Docker Compose

Update `docker-compose.yml`:

```yaml
services:
  opsguard-app:
    image: ghcr.io/Dushyant-rahangdale/OpsGuard:latest
    # ... rest of config
```

For specific version:
```yaml
services:
  opsguard-app:
    image: ghcr.io/Dushyant-rahangdale/OpsGuard:v0.1.0
    # ... rest of config
```

### Using in Kubernetes

Update `k8s/opsguard-deployment.yaml`:

```yaml
spec:
  template:
    spec:
      containers:
      - name: opsguard
        image: ghcr.io/Dushyant-rahangdale/OpsGuard:latest
        # ... rest of config
```

For specific version:
```yaml
        image: ghcr.io/Dushyant-rahangdale/OpsGuard:v0.1.0
```

---

## Workflow Details

### CI Workflow Steps

1. **Checkout code**
2. **Setup Node.js** (v20)
3. **Install dependencies**
4. **Run linter** (`npm run lint`)
5. **Run tests** (`npm run test:run`)
6. **Generate coverage** (`npm run test:coverage`)
7. **Upload coverage** to Codecov
8. **Build Docker image** (for PRs and main branch)
9. **Push to registry** with test tags

### CD Workflow Steps

1. **Checkout code**
2. **Setup Docker Buildx**
3. **Login to registry**
4. **Extract version** from tag
5. **Extract metadata** for tags
6. **Build and push** production images
7. **Run security scan** (Trivy)
8. **Upload scan results** to GitHub Security

### Release Workflow Steps

1. **Checkout code**
2. **Validate version format**
3. **Check if tag exists**
4. **Create git tag**
5. **Push tag** to repository
6. **Create GitHub release**

---

## Security

### Container Registry Authentication

Images are pushed to GitHub Container Registry (`ghcr.io`). To pull images:

1. **Public repositories:** No authentication needed
2. **Private repositories:** 
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```

### Security Scanning

The CD workflow automatically runs Trivy security scans on production images and uploads results to GitHub Security tab.

---

## Best Practices

### Versioning

- Use [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`
- Examples: `0.1.0`, `1.0.0`, `1.2.3`
- Always prefix with `v` in tags: `v0.1.0`

### Image Tags

- **Never delete version tags** - They're needed for rollbacks
- **Use `latest` for production** - Always points to current stable
- **Use `test` for staging** - Test before production
- **Use commit SHA** - For debugging specific commits

### Rollback Procedure

1. Identify the version to rollback to
2. Pull the versioned image: `docker pull ghcr.io/.../OpsGuard:v0.1.0`
3. Update deployment to use the version tag
4. Verify the rollback worked
5. Document the rollback reason

### Testing Before Production

1. Test with `test` tag first
2. Verify everything works
3. Create version tag for production
4. Deploy with version tag
5. Update `latest` tag if needed

---

## Troubleshooting

### Workflow Not Triggering

- Check if paths are ignored (workflow ignores `.md` files)
- Verify branch name matches (`main`)
- Check workflow file syntax

### Image Build Fails

- Check Dockerfile syntax
- Verify all dependencies are available
- Check build logs in Actions tab

### Cannot Pull Images

- Verify repository is public or you're authenticated
- Check image name and tag are correct
- Verify registry URL: `ghcr.io/username/repo:tag`

### Security Scan Fails

- Review Trivy scan results
- Fix vulnerabilities if critical
- Update base images if needed

---

## Environment Variables

No additional secrets needed! The workflows use:
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- Container registry authentication uses `GITHUB_TOKEN`

---

## Next Steps

1. **First Release:**
   - Go to Actions → Release workflow
   - Create version `0.1.0`
   - Wait for CD workflow to complete
   - Verify images are published

2. **Update Documentation:**
   - Update README with image pull instructions
   - Document your deployment process

3. **Set Up Monitoring:**
   - Monitor workflow runs
   - Set up alerts for failed builds
   - Track image usage

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Buildx](https://docs.docker.com/buildx/)
- [Trivy Security Scanner](https://aquasecurity.github.io/trivy/)


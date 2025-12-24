# GitHub Actions Workflows

This directory contains the CI/CD workflows for OpsGuard.

## Workflows

### `ci.yml` - Continuous Integration
- **Triggers:** Pull requests and pushes to `main`
- **Purpose:** Run tests, linting, and build test images
- **Image Tags:** `test`, `test-pr-<N>`, `test-<sha>`

### `cd.yml` - Continuous Deployment
- **Triggers:** Version tags (e.g., `v0.1.0`) or manual dispatch
- **Purpose:** Build and push production images
- **Image Tags:** `v<version>`, `latest`, `stable`, `<sha>`
- **Includes:** Security scanning with Trivy

### `release.yml` - Release Management
- **Triggers:** Manual workflow dispatch
- **Purpose:** Create version tags and GitHub releases
- **Usage:** Go to Actions → Release workflow → Run workflow

## Quick Start

1. **First Release:**
   - Go to Actions → Release workflow
   - Enter version: `0.1.0`
   - Run workflow
   - This creates tag `v0.1.0` and triggers CD workflow

2. **View Images:**
   - Go to Packages in your GitHub repository
   - Images are published to `ghcr.io/<username>/OpsGuard`

3. **Pull Images:**
   ```bash
   docker pull ghcr.io/<username>/OpsGuard:latest
   docker pull ghcr.io/<username>/OpsGuard:v0.1.0
   ```

For detailed information, see [CI_CD_GUIDE.md](../CI_CD_GUIDE.md).

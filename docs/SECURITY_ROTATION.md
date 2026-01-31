# Secret Rotation Guide

This document provides comprehensive procedures for rotating secrets and credentials used by OpsKnight.

## Table of Contents

- [Secrets Inventory](#secrets-inventory)
- [Rotation Procedures](#rotation-procedures)
  - [NEXTAUTH_SECRET](#nextauth_secret)
  - [DATABASE_URL / POSTGRES_PASSWORD](#database_url--postgres_password)
  - [ENCRYPTION_KEY](#encryption_key)
  - [API Keys](#api-keys)
  - [Third-Party Service Credentials](#third-party-service-credentials)
- [Git History Cleaning](#git-history-cleaning)
- [Kubernetes Secrets Management](#kubernetes-secrets-management)
- [Emergency Response](#emergency-response)
- [Rotation Schedule](#rotation-schedule)

---

## Secrets Inventory

| Secret                   | Purpose                 | Rotation Frequency | Impact on Rotation            |
| ------------------------ | ----------------------- | ------------------ | ----------------------------- |
| `NEXTAUTH_SECRET`        | Session signing         | Quarterly          | All user sessions invalidated |
| `POSTGRES_PASSWORD`      | Database access         | Annually           | Brief downtime required       |
| `ENCRYPTION_KEY`         | Data encryption at rest | Annually           | Re-encryption required        |
| `API_KEY_SIGNING_SECRET` | API key verification    | Quarterly          | API keys remain valid         |
| `SENDGRID_API_KEY`       | Email service           | On compromise      | Email sending interruption    |
| `TWILIO_AUTH_TOKEN`      | SMS notifications       | On compromise      | SMS sending interruption      |
| `AWS_SECRET_ACCESS_KEY`  | AWS services            | Quarterly          | Depends on service usage      |
| `SLACK_SIGNING_SECRET`   | Slack integration       | On compromise      | Slack notifications stop      |

---

## Rotation Procedures

### NEXTAUTH_SECRET

**Impact:** All active user sessions will be invalidated. Users must log in again.

**Prerequisites:**

- Maintenance window scheduled (off-peak hours recommended)
- User notification prepared

**Steps:**

1. **Generate new secret:**

   ```bash
   openssl rand -base64 32
   ```

2. **Update environment variable:**

   ```bash
   # Kubernetes
   kubectl create secret generic opsknight-secrets \
     --from-literal=NEXTAUTH_SECRET=<new-secret> \
     --dry-run=client -o yaml | kubectl apply -f -

   # Docker Compose
   # Update .env file with new NEXTAUTH_SECRET value
   ```

3. **Rolling restart:**

   ```bash
   # Kubernetes
   kubectl rollout restart deployment/opsknight

   # Docker Compose
   docker-compose up -d --force-recreate
   ```

4. **Verify:**
   - Confirm application is running
   - Test login functionality
   - Monitor error logs

---

### DATABASE_URL / POSTGRES_PASSWORD

**Impact:** Brief downtime during password change and application restart.

**Prerequisites:**

- Database backup completed
- Maintenance window scheduled

**Steps:**

1. **Create new password:**

   ```bash
   openssl rand -base64 24
   ```

2. **Update PostgreSQL password:**

   ```sql
   -- Connect as superuser
   ALTER USER opsknight WITH PASSWORD '<new-password>';
   ```

3. **Update application configuration:**

   ```bash
   # Update DATABASE_URL with new password
   # Format: postgresql://opsknight:<new-password>@host:5432/opsknight_db
   ```

4. **Restart application:**

   ```bash
   kubectl rollout restart deployment/opsknight
   ```

5. **Verify:**
   - Check database connectivity
   - Run health check endpoint
   - Verify data operations

**Rollback:**
If issues occur, revert PostgreSQL password and restart:

```sql
ALTER USER opsknight WITH PASSWORD '<old-password>';
```

---

### ENCRYPTION_KEY

**Impact:** Data encrypted with old key must be re-encrypted. Extended maintenance required.

**Prerequisites:**

- Full database backup
- Extended maintenance window (hours)
- Re-encryption script prepared

**Steps:**

1. **Generate new encryption key:**

   ```bash
   openssl rand -hex 32
   ```

2. **Update configuration with both keys:**

   ```env
   ENCRYPTION_KEY=<new-key>
   ENCRYPTION_KEY_OLD=<current-key>
   ```

3. **Run re-encryption migration:**

   ```bash
   # This script should decrypt with old key and encrypt with new key
   npm run security:reencrypt
   ```

4. **Verify data integrity:**

   ```bash
   npm run security:verify-encryption
   ```

5. **Remove old key from configuration:**

   ```env
   ENCRYPTION_KEY=<new-key>
   # Remove ENCRYPTION_KEY_OLD
   ```

6. **Restart application:**
   ```bash
   kubectl rollout restart deployment/opsknight
   ```

---

### API Keys

**Note:** Rotating the API key signing secret does NOT invalidate existing API keys.

**For user-generated API keys:**

- Users can revoke and regenerate their own keys via the UI
- Admins can revoke keys via the admin panel

**For signing secret rotation:**

1. **Generate new secret:**

   ```bash
   openssl rand -base64 32
   ```

2. **Update configuration:**

   ```bash
   API_KEY_SIGNING_SECRET=<new-secret>
   ```

3. **Restart application** (no downtime with rolling update)

---

### Third-Party Service Credentials

#### SendGrid API Key

1. Generate new key in SendGrid dashboard
2. Update `SENDGRID_API_KEY` environment variable
3. Restart application
4. Revoke old key in SendGrid dashboard

#### Twilio Auth Token

1. Generate new token in Twilio console
2. Update `TWILIO_AUTH_TOKEN` environment variable
3. Restart application
4. Old token is automatically invalidated

#### AWS Credentials

1. Create new access key in IAM
2. Update `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
3. Restart application
4. Delete old access key in IAM after verification

#### Slack Credentials

1. Regenerate signing secret in Slack app settings
2. Update `SLACK_SIGNING_SECRET` environment variable
3. Restart application

---

## Git History Cleaning

If secrets are accidentally committed to the repository:

### Using BFG Repo-Cleaner (Recommended)

1. **Backup repository:**

   ```bash
   git clone --mirror git@github.com:org/opsknight.git opsknight-backup.git
   ```

2. **Download BFG:**

   ```bash
   wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
   ```

3. **Create file with secrets to remove:**

   ```bash
   echo "secret-value-to-remove" >> secrets.txt
   ```

4. **Run BFG:**

   ```bash
   java -jar bfg-1.14.0.jar --replace-text secrets.txt opsknight.git
   ```

5. **Clean and push:**
   ```bash
   cd opsknight.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

### Using git-filter-repo

```bash
# Install git-filter-repo
pip install git-filter-repo

# Replace secret in all history
git filter-repo --replace-text <(echo 'SECRET_VALUE==>***REMOVED***')
```

### Post-Cleanup

1. **Rotate the exposed secret immediately**
2. **Force all team members to re-clone:**
   ```bash
   rm -rf opsknight
   git clone git@github.com:org/opsknight.git
   ```
3. **Check GitHub's cached views** (may take time to clear)
4. **Review GitHub Security Advisories** for any automated detection

---

## Kubernetes Secrets Management

### Best Practices

1. **Use sealed-secrets or external-secrets:**

   ```yaml
   apiVersion: bitnami.com/v1alpha1
   kind: SealedSecret
   metadata:
     name: opsknight-secrets
   spec:
     encryptedData:
       NEXTAUTH_SECRET: AgA...encrypted...
   ```

2. **Enable encryption at rest:**

   ```yaml
   # kube-apiserver configuration
   --encryption-provider-config=/etc/kubernetes/enc/enc.yaml
   ```

3. **Limit secret access with RBAC:**

   ```yaml
   apiVersion: rbac.authorization.k8s.io/v1
   kind: Role
   metadata:
     name: secret-reader
   rules:
     - apiGroups: ['']
       resources: ['secrets']
       resourceNames: ['opsknight-secrets']
       verbs: ['get']
   ```

4. **Audit secret access:**
   ```yaml
   # Enable audit logging for secrets
   apiVersion: audit.k8s.io/v1
   kind: Policy
   rules:
     - level: Metadata
       resources:
         - group: ''
           resources: ['secrets']
   ```

### Rotation with Zero Downtime

```yaml
# Create new secret version
apiVersion: v1
kind: Secret
metadata:
  name: opsknight-secrets-v2
stringData:
  NEXTAUTH_SECRET: <new-value>

---
# Update deployment to use new secret
spec:
  template:
    spec:
      containers:
        - name: opsknight
          envFrom:
            - secretRef:
                name: opsknight-secrets-v2
```

---

## Emergency Response

### Secret Compromise Checklist

1. **Immediately:**
   - [ ] Identify which secret(s) were compromised
   - [ ] Determine exposure scope (public repo, logs, etc.)
   - [ ] Check for unauthorized access in audit logs

2. **Within 15 minutes:**
   - [ ] Rotate compromised secret(s)
   - [ ] Revoke any sessions/tokens if applicable
   - [ ] Block suspicious IP addresses if identified

3. **Within 1 hour:**
   - [ ] Deploy application with new secrets
   - [ ] Notify affected users if required
   - [ ] Document incident details

4. **Within 24 hours:**
   - [ ] Complete post-mortem analysis
   - [ ] Clean git history if needed
   - [ ] Review and strengthen secret management practices
   - [ ] Update monitoring/alerting if gaps identified

### Communication Template

```
Subject: Security Notice - Credential Rotation

We identified a security concern requiring immediate credential rotation.

Impact: [Describe user impact, e.g., "You may need to log in again"]

Action taken: [Describe remediation steps]

User action required: [Any steps users need to take]

Questions: Contact security@example.com
```

---

## Rotation Schedule

### Quarterly Rotation

- NEXTAUTH_SECRET
- API_KEY_SIGNING_SECRET
- AWS_SECRET_ACCESS_KEY (if used)

### Annual Rotation

- POSTGRES_PASSWORD
- ENCRYPTION_KEY

### On-Demand Rotation (on compromise or team member departure)

- All third-party API keys
- Any secret potentially exposed

### Automated Reminders

Set up calendar reminders or use a secrets management tool that supports expiration tracking:

```bash
# Example: Create GitHub issue for rotation reminder
gh issue create \
  --title "Q1 Secret Rotation Due" \
  --body "Quarterly rotation required for: NEXTAUTH_SECRET, API_KEY_SIGNING_SECRET" \
  --label "security,maintenance"
```

---

## Appendix: Quick Reference

### Generate Secure Secrets

```bash
# 32-byte base64 (good for NEXTAUTH_SECRET)
openssl rand -base64 32

# 32-byte hex (good for ENCRYPTION_KEY)
openssl rand -hex 32

# URL-safe token
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Verify Secret Strength

```bash
# Check entropy
echo -n "your-secret" | ent

# Minimum recommendations:
# - 256 bits (32 bytes) for encryption keys
# - 128 bits (16 bytes) for session secrets
```

### Test After Rotation

```bash
# Health check
curl -f http://localhost:3000/api/health

# Login test
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Database connectivity
curl http://localhost:3000/api/health/db
```

# Kubernetes Deployment

Deploy OpsSentinal on Kubernetes for production workloads.

## Prerequisites

- Kubernetes 1.24+
- kubectl configured
- Ingress controller (nginx-ingress recommended)
- PostgreSQL (in-cluster or managed)

## Quick Start

```bash
cd k8s

# Create namespace
kubectl apply -f namespace.yaml

# Create secrets (edit first!)
kubectl apply -f secret.yaml

# Deploy
kubectl apply -f .
```

## Manifests

| File              | Purpose                   |
| ----------------- | ------------------------- |
| `namespace.yaml`  | OpsSentinal namespace     |
| `secret.yaml`     | Sensitive configuration   |
| `configmap.yaml`  | Non-sensitive config      |
| `deployment.yaml` | Application deployment    |
| `service.yaml`    | Internal service          |
| `ingress.yaml`    | External access           |
| `hpa.yaml`        | Horizontal Pod Autoscaler |
| `postgres-*.yaml` | PostgreSQL (optional)     |

## Configuration

### Secrets

Edit `secret.yaml` before applying:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: opssentinal-secrets
  namespace: opssentinal
type: Opaque
stringData:
  DATABASE_URL: postgresql://user:pass@postgres:5432/opssentinal
  NEXTAUTH_SECRET: your-32-char-secret
  NEXTAUTH_URL: https://ops.yourcompany.com
```

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: opssentinal-config
  namespace: opssentinal
data:
  ENABLE_INTERNAL_CRON: 'true'
```

## Ingress

Configure for your domain:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: opssentinal-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - ops.yourcompany.com
      secretName: opssentinal-tls
  rules:
    - host: ops.yourcompany.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: opssentinal
                port:
                  number: 3000
```

## Scaling

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: opssentinal-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: opssentinal
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Database Options

### In-Cluster PostgreSQL

Use provided manifests:

```bash
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f postgres-service.yaml
```

### Managed PostgreSQL

Use AWS RDS, GCP Cloud SQL, or Azure Database:

- Update `DATABASE_URL` in secrets
- Ensure network connectivity

## Updating

```bash
# Update image
kubectl set image deployment/opssentinal \
  opssentinal=ghcr.io/your-org/opssentinal:latest

# Or apply updated manifests
kubectl apply -f deployment.yaml
```

## Troubleshooting

```bash
# View pods
kubectl get pods -n opssentinal

# View logs
kubectl logs -f deploy/opssentinal -n opssentinal

# Shell access
kubectl exec -it deploy/opssentinal -n opssentinal -- sh
```

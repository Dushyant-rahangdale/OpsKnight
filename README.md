<div align="center">

<img src="public/banner.png" alt="OpsKnight Banner" width="100%">

# 🛡️ OpsKnight

**Open-Source Incident Management Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Website](https://img.shields.io/badge/Website-opsknight.com-10b981?style=for-the-badge&logo=google-chrome&logoColor=white)](https://opsknight.com)
[![License](https://img.shields.io/badge/License-AGPL--3.0-green?style=for-the-badge)](LICENSE)

<div align="center">
  <h3>
    <a href="https://opsknight.com" target="_blank">
      🌐 Visit Website: opsknight.com
    </a>
  </h3>
</div>

[**Documentation**](docs/) • [**Quick Start**](#-quick-start) • [**Features**](#-features) • [**API**](docs/api/)

</div>

---

## ✨ Features

- 🚨 **Incident Management** - Complete lifecycle from trigger to resolution
- 📅 **On-Call Scheduling** - Flexible rotations, overrides, and layers
- 📈 **Escalation Policies** - Multi-tier escalation with user/team/schedule targets
- 📊 **Analytics & SLA** - MTTA, MTTR, and SLA compliance tracking
- 🌐 **Status Page** - Public-facing service status with subscriber notifications
- 🔔 **Multi-Channel Alerts** - SMS, Push, Email, Slack, WhatsApp
- 📱 **Mobile PWA** - Install on any device with push notifications
- 🔐 **Enterprise Security** - SSO/OIDC, RBAC, audit logs

---

## 🚀 Quick Start

### Docker Compose

```bash
# Clone and configure
git clone https://github.com/dushyant-rahangdale/opsknight.git
cd opsknight
cp env.example .env

# Start services
docker compose up -d

# Create admin user
docker exec -it opsknight_app npm run opsknight -- \
  --user "Admin" \
  --email admin@example.com \
  --password SecurePass123! \
  --role admin
```

Open **http://localhost:3000** and sign in.

---

## 📚 Documentation

| Section                                      | Description                                       |
| -------------------------------------------- | ------------------------------------------------- |
| [**Getting Started**](docs/getting-started/) | Installation, first steps, configuration          |
| [**Core Concepts**](docs/core-concepts/)     | Services, Incidents, Teams, Schedules, Escalation |
| [**Administration**](docs/administration/)   | Authentication, Notifications, Data Retention     |
| [**Integrations**](docs/integrations/)       | Slack, Webhooks, Monitoring Tools                 |
| [**API Reference**](docs/api/)               | REST API documentation                            |
| [**Deployment**](docs/deployment/)           | Docker, Kubernetes, Mobile PWA                    |
| [**Roadmap**](ROADMAP.md)                    | Future plans and feature tracking                 |

---

## 🔌 Integrations

<p align="center">
  <img src="https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white" alt="Slack">
  <img src="https://img.shields.io/badge/Datadog-632CA6?style=for-the-badge&logo=datadog&logoColor=white" alt="Datadog">
  <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" alt="Prometheus">
  <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white" alt="Grafana">
  <img src="https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white" alt="Sentry">
</p>

See [Integrations Documentation](docs/integrations/) for setup guides.

---

## 🛠️ CLI

```bash
# Create/update users
npm run opsknight -- --user "Name" --email user@example.com --password Pass123! --role responder
```

See [CLI Documentation](docs/api/cli.md) for full usage.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) and review our [Code of Conduct](CODE_OF_CONDUCT.md) for details.

---

## 🔒 Security

For reporting security vulnerabilities or reviewing our security policy, please see [SECURITY.md](SECURITY.md).

---

## 📄 License

OpsKnight is licensed under the [Apache License 2.0](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ for SREs and DevOps Teams</sub>
</div>

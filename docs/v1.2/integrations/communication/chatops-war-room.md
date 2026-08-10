# 🛡️ ChatOps & Video Incident War-Rooms (v1.2.0)

> **Version:** v1.2.0  
> **Category:** Integrations / Communication & Incident Response  
> **Applies to:** OpsKnight Web Dashboard, Slack App Integration, Mobile Web

---

## 📋 Overview

OpsKnight **v1.2.0** introduces native **ChatOps Workflows & Multi-Provider Video War-Rooms**. When a high-urgency or high-priority incident is triggered, OpsKnight automatically orchestrates an isolated Slack war-room channel, invites on-call responders, syncs channel topics in real time, and establishes a 1-click video bridge (Jitsi Meet, Zoom, or Google Meet).

---

## 🌟 Key Capabilities

### 1. Automated Slack War-Room Channel Creation
- Automatically creates dedicated Slack channels following the pattern: `#inc-<id>-<service-slug>`.
- Example: `#inc-vzvtwk-github-alert`.
- Triggered based on configurable **Incident Urgency** (`HIGH`, `MEDIUM`, `LOW`) and **Incident Priority** (`P1`, `P2`, `P3`, `P4`, `P5`).

### 2. Auto-Inviting Responders & On-Call Shifts
- Resolves current on-call schedules, escalation policy steps, and team owners automatically.
- Matches Slack user profiles via `users.lookupByEmail` and auto-invites assigned responders directly into the war-room channel.

### 3. Real-Time Channel Topic Synchronization
- Keeps all incident responders aligned with dynamic topic updates:
  ```text
  👀 16% of incidents originate from "Github Alert" | ACKNOWLEDGED | HIGH | 👤 Admin | https://opssentinal.com/incidents/cmsnfmlqx000pupcim9vzvtwk
  ```
- Automatically updates topic status when incidents transition from `OPEN` ➔ `ACKNOWLEDGED` ➔ `RESOLVED`.

### 4. Interactive `/incident` Slash Command Center

Responders can execute incident management commands directly inside any Slack war-room channel:

| Slash Command | Description | Example |
| :--- | :--- | :--- |
| `/incident ack` | Acknowledges the active incident and updates Slack topic & web dashboard. | `/incident ack` |
| `/incident resolve [summary]` | Resolves the incident, logs a resolution note, updates topic, and archives channel. | `/incident resolve Fixed DB pool limit` |
| `/incident who` | Queries real-time on-call schedules, active shifts, and escalation delays for the service. | `/incident who` |
| `/incident note <message>` | Maps user email (case-insensitive) and appends a post-mortem note to the incident timeline. | `/incident note Memory leak identified in worker node` |
| `/incident help` | Displays the interactive ChatOps command guide card. | `/incident help` |

### 5. Multi-Provider Video War-Rooms

OpsKnight v1.2 supports 3 top-tier video bridge providers:

#### 📹 **Jitsi Meet (Default Instant Rooms)**
- **0 Setup Required**: Generates an instant, private video call room dynamically for every incident:
  `https://meet.jit.si/opsknight-inc-XXXX`
- Allows responders to join immediately from web or mobile with zero pre-created links or credentials.

#### 🎥 **Zoom Integration**
- Supports team Zoom meeting URLs (`https://us04web.zoom.us/j/1234567890`) or personal vanity links (`https://myorg.zoom.us/my/warroom`).
- Includes automatic `/j/` path sanitization to prevent Zoom `3,001` invalid meeting link errors.

#### 🟢 **Google Meet Integration**
- Supports Google Workspace lookup links (`https://meet.google.com/lookup/opsknight-inc-XXXX`) or standard Meet call links (`https://meet.google.com/abc-defg-hij`).

### 6. Automated Channel Archiving
- Once an incident is marked `RESOLVED`, OpsKnight automatically archives the dedicated Slack war-room channel to prevent channel clutter.

---

## ⚙️ Configuration Guide

1. Navigate to **Settings → Integrations → ChatOps** on your OpsKnight Web Dashboard.
2. Toggle **Enable ChatOps workflows**.
3. Set **Channel Prefix** (default: `inc`).
4. Select **Auto-create channels on Incident Urgency** (`HIGH`, `MEDIUM`, `LOW`) and **Priority** (`P1`, `P2`).
5. Select your **Default Video Bridge Provider** (`Jitsi Meet`, `Zoom`, `Google Meet`, or `None`).
6. Optionally enter a **Custom Bridge URL Template** (e.g. `https://myorg.zoom.us/j/1234567890`).
7. Click **Save ChatOps Configuration**.

---

## 🔧 Slack OAuth Scopes Required

For full ChatOps functionality, ensure your Slack App has the following bot token scopes:
- `channels:manage` — Channel creation, topic updates, and archiving
- `chat:write` — Posting incident notification cards & event updates
- `commands` — Slash command `/incident` handling
- `users:read` & `users:read.email` — On-call responder user resolution via email

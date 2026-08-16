# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-08-16

### Added

- **Slack ChatOps incident war rooms** — a dedicated Slack channel per qualifying
  incident, with on-call responders auto-invited, an incident command card, and
  an optional Jitsi/Zoom/Google Meet bridge
- **One-click actions** in Slack: Acknowledge, Assign to Me and Resolve
- **Slash commands** — `/incident ack | resolve | note | who | postmortem | help`
- **📌 emoji pin sync** — react to any message in a war room to capture it as an
  incident note; pinning is idempotent
- **Slack app manifest generator** — copy a complete manifest configuring every
  scope, the events subscription, interactivity and the slash command in one step
- Signing secret is entered in the UI and stored encrypted, no environment
  variable required
- Setup documentation for Slack ChatOps, including scope reference and
  troubleshooting

### Fixed

- **On-call resolution paged the entire schedule on Node 20.** `hour12: false`
  resolves to the h24 hour cycle on Node 20's ICU, reporting midnight as hour
  "24" and shifting start-of-day a full day early in zero-offset zones. No block
  covered "now", so the roster fallback paged everyone instead of the person on
  call
- Slack request signatures are now verified and **fail closed**; previously a
  missing secret caused every unsigned request to be trusted
- Server-side request forgery via `response_url`, which was fetched unvalidated
- "Assign to Me" could assign an incident to an arbitrary user when Slack user
  resolution failed
- The Acknowledge button did not stop the escalation chain
- Slack button actions did not send notifications the equivalent web actions did
- Incident timeline showed raw Slack IDs (`<@U0673U4TWAJ>`) instead of names
- War-room API required only authentication, not permission on the incident
- Manual **Create War-Room** and **Archive** were blocked by settings that govern
  automatic behaviour
- Slack rate limits (429) crashed some code paths and were swallowed on others
- Archived war rooms no longer read as active, and no longer receive updates
- Emoji reaction sync requested the scopes it needs (`reactions:read`,
  `channels:history`, `groups:history`)

### Changed

- Watchtower removed from the production compose file; image rollout is now a
  deliberate action
- `engines` pins Node 20 to match the production image
- Pinned messages are saved as an incident note only, without a duplicate
  timeline event

### Added

- Initial GitHub Issue Templates (Bug Report, Feature Request, Config)
- Community Health files (CODE_OF_CONDUCT, CONTRIBUTING, etc.)

### Changed

- Updated repository description to match brand guidelines.
- Updated README to reflect Beta status.

---

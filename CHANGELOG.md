# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial GitHub Issue Templates (Bug Report, Feature Request, Config)
- Community Health files (CODE_OF_CONDUCT, CONTRIBUTING, etc.)

### Changed

- Updated repository description to match brand guidelines.
- Updated README to reflect Beta status.

---

## [2.0.0] - Unreleased

### Removed

- **Encryption key management UI** — The System Settings page no longer contains an
  Encryption Key configuration form. Key setup, rotation, and emergency recovery
  workflows have been removed from the application UI entirely.
- Removed `saveEncryptionKey`, `rotateSystemEncryptionKey`, and `manageEncryptionKey`
  server actions.
- Removed key fingerprint and canary validation logic that could lock the system out
  when the database key and environment key went out of sync.

### Changed

- **Encryption key is now environment-variable only** — `ENCRYPTION_KEY` must be set as
  an environment variable in production. The application no longer stores or reads the
  master encryption key from the database.
- A safe static fallback key is used automatically in `development` mode so local
  environments work out of the box with zero configuration.
- System Settings status overview now shows App URL and SSO status only; the Encryption
  status badge has been removed.
- `OIDC SSO` configuration no longer blocks saves on missing encryption key or failed
  fingerprint checks — encryption is handled transparently by the environment variable.

### Security

- Storing the master encryption key in the same database as the encrypted data is a
  security anti-pattern (backup exposure). Moving the key to an environment variable
  follows the 12-factor app methodology and is the production-grade approach.

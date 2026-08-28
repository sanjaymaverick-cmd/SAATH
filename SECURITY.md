# Security policy

SAATH is a private, self-hosted family application. Operators control the server and can access its runtime data, so members must trust the family administrator and the security of the host and backups.

## Supported version

Only the current `main` branch and latest tagged release receive fixes. Build updated images from source unless a verified package is explicitly available from this repository.

## Reporting a vulnerability

Use GitHub's private vulnerability-reporting feature if it is enabled for the repository. Otherwise, open a minimal issue at <https://github.com/sanjaymaverick-cmd/SAATH/issues> asking the maintainers for a private reporting channel. Do not publish credentials, family data, runtime files, or a working exploit in an issue.

Include the affected commit/version, deployment topology, relevant non-secret configuration, reproduction steps, and impact.

## Security model

- Administrators bootstrap the first account and create subsequent family accounts.
- Newly created and reset accounts receive a generated temporary password.
- A temporary password must be replaced at first login before normal application access is granted.
- Password resets revoke existing sessions; disabling an account blocks login and protected API access.
- Password login is throttled by the API. A reverse proxy may add broader request limiting.
- Per-user workout state is selected from the authenticated session; ordinary users cannot choose another member's data file.
- The runtime `data/` directory contains account records, password hashes, session material, audit records, and wellness/workout data. It is not encrypted by the application.
- Administrators are trusted and can review member workout, weight, and adherence information as documented.
- HTTPS is required for a remote deployment. The bundled optional Caddy profile or another trusted reverse proxy should terminate TLS.
- Guest/mobile-only state is local to that browser or device and is not synchronized through the family server.

## In scope

- Authentication or forced-password-change bypasses.
- Session forgery, failure to revoke sessions after a reset/disable action, or cross-user data access.
- Unauthorized access to administrator routes or member statistics.
- Cross-site scripting or cross-origin access to authenticated family data.
- Unsafe defaults in the shipped Docker, nginx, Caddy, or deployment configuration.

## Out of scope

- Access that already assumes control of the host, Docker socket, runtime `data/`, signing keys, or backups.
- Administrator access to member information that the product explicitly exposes to administrators.
- Third-party exercise media and its delivery infrastructure.
- Scanner output without a concrete exploitable path.

Never commit `.env` files, passwords, temporary passwords, `data/`, exports, backups, audit logs, signing keys, certificates, APKs, or local toolchains.

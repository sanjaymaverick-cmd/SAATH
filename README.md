# SAATH — Progress, together.

SAATH is a private family wellness and workout application. It is designed to run on infrastructure controlled by a family or small trusted group, with each member's training data isolated behind an administrator-created account. Its mobile app signs in to and synchronizes with the same family-owned deployment while retaining an offline copy on the device.

[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-a3e635?style=flat-square)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/sanjaymaverick-cmd/SAATH?style=flat-square)](https://github.com/sanjaymaverick-cmd/SAATH/commits/main)
[![Issues](https://img.shields.io/github/issues/sanjaymaverick-cmd/SAATH?style=flat-square)](https://github.com/sanjaymaverick-cmd/SAATH/issues)

Repository: [github.com/sanjaymaverick-cmd/SAATH](https://github.com/sanjaymaverick-cmd/SAATH)

## What SAATH includes

- A searchable exercise library with instructions and media, plus user-created custom exercises.
- Weekly plans and reusable routines, including supersets, warm-ups, timed work, cardio, and progression rules.
- Guided workout logging for sets, repetitions, weight, effort, rest periods, and personal records.
- Body-weight history, activity heatmaps, estimated one-repetition maximums, muscle maps, and adherence statistics.
- Import and export tools for portable backups and selected third-party workout formats.
- A responsive web application, installable PWA, and Capacitor Android/iOS projects.
- Optional read-only MCP access to self-hosted training data; see [mcp/README.md](mcp/README.md).

The rebrand does not change the exercise library, custom exercises, routines, workout history, or statistics model.

## Private family account model

SAATH is intended for administrator-managed deployment. An administrator bootstraps the first account, then creates accounts for family members. Every newly created or reset account receives a generated temporary password. The member must replace that temporary password at first sign-in before using the rest of the application. Password resets revoke existing sessions, and disabled accounts cannot sign in.

Do not send credentials through public channels. Store the runtime `data/` directory and its backups as sensitive family data.

## Self-hosting

Requirements: Docker with the Compose plugin.

```bash
git clone https://github.com/sanjaymaverick-cmd/SAATH.git
cd SAATH
cp .env.example .env
docker compose up -d --build
```

The default local images are `saath-api:local` and `saath-web:local`. No public container or APK availability is assumed. If this repository publishes images through its GitHub workflow, their names are `ghcr.io/sanjaymaverick-cmd/saath-api` and `ghcr.io/sanjaymaverick-cmd/saath-web`.

For a family deployment, set the real HTTPS hostname and disable guest access in `.env`, then bootstrap the administrator:

```bash
docker compose run --rm --no-deps api npm run bootstrap-admin -- --login owner --name "Family Admin"
```

The command prints a temporary password once. Sign in and change it immediately. Create subsequent family accounts from the administrator interface. See [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md) for TLS, deployment, backup, and recovery details.

## Development and validation

```bash
cd api && npm test
cd ../frontend && npm test
npm run build
cd ../mcp && npm test
npm run check:node-loadable
```

Mobile build instructions are in [docs/MOBILE.md](docs/MOBILE.md). Build and sign mobile artifacts yourself; signing keys and generated packages must remain outside version control.

## Architecture and data

- `frontend/` — React and Vite web/PWA client plus Capacitor projects.
- `api/` — Node service for administrator-managed password authentication, sessions, and per-user state.
- `web/` — nginx image serving the frontend and proxying `/api` on the same origin.
- `mcp/` — optional read-only local MCP server.
- `data/` — runtime accounts, password hashes, sessions, audit records, and workout data; never commit it.

Back up `data/` to encrypted storage. Exercise media is fetched separately and can be recreated.

## Exercise dataset and media

SAATH uses exercise metadata and instruction text from [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset), licensed under MIT. Exercise images and animations are © [Gym visual](https://gymvisual.com/) and are governed by that provider's terms; permission associated with the upstream dataset is not transferable. SAATH does not redistribute that media in this repository or in the Android package. See [NOTICE.md](NOTICE.md) for the complete attribution and reuse notice.

## License

SAATH is licensed under the [GNU Affero General Public License v3.0 or later](LICENSE).

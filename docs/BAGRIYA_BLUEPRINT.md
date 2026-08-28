# SAATH private family deployment blueprint

## Product

SAATH is a private family wellness and workout tracker. It is installed on phones as a
Home Screen PWA and synchronizes each member's training data through a family-owned Oracle Cloud
server. The administrator provisions accounts and can review workout, weight, and adherence data.

## Brand system

- Deep navy `#081A33`: app background and icon field
- Charcoal navy `#172B44`: cards and elevated surfaces
- Energetic orange `#FF6B1A`: primary actions and the strength portion of the BF mark
- Warm gold `#E6B84A`: achievements, streaks, and the family connector
- Master logo: `frontend/resources/icon.svg`

## Runtime architecture

```text
Family iPhones / browsers
        │ HTTPS
        ▼
gym.example.com
        │
        ▼
Caddy reverse proxy
        │ 127.0.0.1:8080
        ▼
Docker Compose
  ├─ web: nginx + React PWA
  ├─ api: Node account/data service
  ├─ data/: accounts, hashes, sessions, workouts and weights
  └─ media/: exercise images and animations
```

## Account lifecycle

1. Run `npm run bootstrap-admin -- --login owner --name "Family Admin"` in the API container once.
2. Sign in with the generated temporary password and replace it.
3. Create family accounts from Admin → Create family account.
4. Give each member the generated login ID and one-time temporary password.
5. The member selects a private password on first sign-in.
6. Admin password resets revoke all existing sessions and issue a new temporary password.
7. Disabling a member immediately blocks login and invalidates access to protected API routes.

## Adherence model

The dashboard compares each member's effective schedule—including day reschedules and rest-day
overrides—with completed workout dates. It reports the trailing 28-day percentage, current-week
completion, missed scheduled sessions, and the active completion streak.

## Oracle Cloud rollout

1. Back up and remove the former client demo only after confirming it is no longer required.
2. Retain the existing Always Free VM when possible; recreating scarce A1 capacity is avoidable.
3. Install Docker Engine, the Compose plugin, Git, and Caddy on Ubuntu.
4. Clone this repository into `/opt/saath` and copy `.env.example` to `.env`.
5. Set `ORIGIN=https://gym.example.com`, `WEB_PORT=8080`, and `ALLOW_GUEST=0`.
6. Build locally owned images with `docker compose up -d --build`.
7. Bootstrap the administrator before sharing the URL.
8. Configure Caddy from `deploy/Caddyfile.example` and allow inbound TCP 80/443 in OCI.
9. Keep port 8080 closed in the OCI security list; it is only a local Caddy upstream.
10. Verify iPhone installation, login, synchronization, notifications, and admin metrics.

## Backup and restore

Back up `data/` every night to encrypted storage outside the VM. The directory contains the entire
family dataset and authentication state. Exercise media can be downloaded again and does not need
the same retention.

Before each deployment:

1. Stop writes with `docker compose stop api`.
2. Archive `data/` with ownership and permissions preserved.
3. Restart the API.
4. Build the new images and run health checks.
5. Keep the previous image tag until the family confirms the release.

Restore by stopping the stack, replacing `data/` from a verified archive, and starting the same
application version that created the backup before attempting an upgrade.

## Validation gates

- `cd api && npm test`
- `cd frontend && npm test`
- `cd frontend && npm run build`
- `docker compose build`
- `curl http://127.0.0.1:8080/api/health`
- Create a test member, change its temporary password, record a workout, and verify adherence.
- Reset the test member password and confirm its previous sessions no longer work.

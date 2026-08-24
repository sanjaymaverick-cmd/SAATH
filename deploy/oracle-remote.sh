#!/usr/bin/env bash
set -euo pipefail

ARCHIVE="${1:?archive path required}"
PUBLIC_HOST="${2:?public IP or domain required}"
ADMIN_LOGIN="${3:-owner}"
ADMIN_NAME="${4:-Family Admin}"
APP_ROOT=/opt/bagriya-fitfam
RELEASE_ID="$(date -u +%Y%m%d%H%M%S)"
RELEASE="$APP_ROOT/releases/$RELEASE_ID"

sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl
if ! command -v docker >/dev/null 2>&1 || ! sudo docker compose version >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-v2
fi
sudo systemctl enable --now docker

sudo mkdir -p "$RELEASE" "$APP_ROOT/data" "$APP_ROOT/media/img" "$APP_ROOT/media/gif" "$APP_ROOT/releases"
sudo tar -xzf "$ARCHIVE" -C "$RELEASE"
sudo rm -rf "$RELEASE/data" "$RELEASE/media"
sudo ln -s "$APP_ROOT/data" "$RELEASE/data"
sudo ln -s "$APP_ROOT/media" "$RELEASE/media"

# Daily backups of the data directory (accounts, password hashes, workout history,
# session secret) — reinstalled on every deploy so a rebuilt server keeps them too.
sudo install -m 755 -o root -g root "$RELEASE/deploy/backup-data.sh" "$APP_ROOT/backup.sh"
sudo install -m 644 -o root -g root "$RELEASE/deploy/backup-data.service" /etc/systemd/system/backup-data.service
sudo install -m 644 -o root -g root "$RELEASE/deploy/backup-data.timer" /etc/systemd/system/backup-data.timer
sudo systemctl daemon-reload
sudo systemctl enable --now backup-data.timer

ORIGIN="http://$PUBLIC_HOST"
sudo tee "$RELEASE/.env" >/dev/null <<EOF
ORIGIN=$ORIGIN
RP_ID=$PUBLIC_HOST
RP_NAME=Bagriya FitFam
ALLOW_GUEST=0
INVITE_ONLY=0
SESSION_DAYS=90
PORT=3000
WEB_PORT=80
NGINX_PORT=80
VAPID_SUBJECT=mailto:admin@localhost
EOF

cd "$RELEASE"
sudo docker compose build

# Bootstrap only a genuinely fresh server. The command prints the temporary password once.
if [ ! -s "$APP_ROOT/data/db.json" ]; then
  echo
  echo "--- FIRST ADMINISTRATOR CREDENTIALS ---"
  sudo docker compose run --rm --no-deps api node bootstrap-admin.js --login "$ADMIN_LOGIN" --name "$ADMIN_NAME"
  echo "---------------------------------------"
  echo
fi

sudo ln -sfn "$RELEASE" "$APP_ROOT/current"
sudo docker compose up -d --remove-orphans

if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow OpenSSH >/dev/null || true
  sudo ufw allow 80/tcp >/dev/null || true
  sudo ufw allow 443/tcp >/dev/null || true
fi

for attempt in $(seq 1 60); do
  if curl -fsS http://127.0.0.1/api/health >/tmp/fitfam-health.json; then
    echo "Bagriya FitFam is healthy: $(cat /tmp/fitfam-health.json)"
    echo "Open: http://$PUBLIC_HOST"
    exit 0
  fi
  sleep 2
done

echo "Deployment started but health verification timed out." >&2
sudo docker compose ps >&2
sudo docker compose logs --tail=120 >&2
exit 1

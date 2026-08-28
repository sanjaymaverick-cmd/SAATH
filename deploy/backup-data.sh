#!/usr/bin/env bash
# Snapshots the live data directory (accounts, password hashes, per-user workout
# state, session secret) into a timestamped tarball and prunes old snapshots.
# Installed on the server as a systemd timer — see backup-data.service/.timer.
set -euo pipefail

APP_ROOT=/opt/saath
DATA_DIR="$APP_ROOT/data"
BACKUP_DIR="$APP_ROOT/backups"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-30}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/data-$STAMP.tar.gz" -C "$APP_ROOT" data
find "$BACKUP_DIR" -name 'data-*.tar.gz' -mtime "+$KEEP_DAYS" -delete

echo "Backed up $DATA_DIR -> $BACKUP_DIR/data-$STAMP.tar.gz"

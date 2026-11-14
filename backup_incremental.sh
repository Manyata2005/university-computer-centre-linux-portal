
#!/usr/bin/env bash
set -Eeuo pipefail

SOURCE="/srv/university/"
BACKUP_DIR="/var/backups/university/incremental"
LOG_FILE="/var/log/university/backup.log"
LOCK_FILE="/var/lock/university-incremental-backup.lock"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FINAL="$BACKUP_DIR/snapshot_$TIMESTAMP"
TEMP="$BACKUP_DIR/.snapshot_$TIMESTAMP.tmp"

if [ "$(id -u)" -ne 0 ]; then
    echo "Run this script with sudo."
    exit 1
fi

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    echo "Another backup is already running."
    exit 1
fi

cleanup() {
    if [ -d "$TEMP" ]; then
        rm -rf "$TEMP"
    fi
}
trap cleanup EXIT

PREVIOUS=""

while IFS= read -r candidate; do
    if [ -f "$candidate/.backup_complete" ]; then
        PREVIOUS="$candidate"
    fi
done < <(find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 \
    -type d -name 'snapshot_*' | sort)

mkdir "$TEMP"

echo "======================================"
echo " UNIVERSITY INCREMENTAL BACKUP"
echo "======================================"

if [ -n "$PREVIOUS" ]; then
    echo "Using previous snapshot: $PREVIOUS"
    rsync -a --link-dest="$PREVIOUS" "$SOURCE" "$TEMP/"
else
    echo "Creating initial snapshot..."
    rsync -a "$SOURCE" "$TEMP/"
fi

echo "Generating SHA-256 manifest..."

(
    cd "$TEMP"
    find . -type f \
        ! -name 'SHA256SUMS' \
        ! -name '.backup_complete' \
        -print0 |
    sort -z |
    xargs -0 -r sha256sum > SHA256SUMS
)

touch "$TEMP/.backup_complete"
mv "$TEMP" "$FINAL"

echo "[$(date)] SUCCESS: $FINAL" >> "$LOG_FILE"

echo "Backup completed: $FINAL"
echo "Checksum manifest: $FINAL/SHA256SUMS"


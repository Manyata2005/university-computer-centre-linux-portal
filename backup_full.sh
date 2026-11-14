
#!/bin/bash

# University Computer Centre - Full Backup

SOURCE="/srv/university"
BACKUP_DIR="/var/backups/university/full"
LOG_FILE="/var/log/university/backup.log"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/university_full_$TIMESTAMP.tar.gz"

echo "======================================"
echo " UNIVERSITY FULL BACKUP"
echo "======================================"

sudo mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"

echo "Starting full backup..."

if sudo tar -czf "$BACKUP_FILE" -C /srv university; then

    sudo sha256sum "$BACKUP_FILE" | sudo tee "$BACKUP_FILE.sha256" >/dev/null

    echo "Backup created successfully!"
    echo "File: $BACKUP_FILE"

    echo "[$(date)] SUCCESS: Full backup created: $BACKUP_FILE" \
        | sudo tee -a "$LOG_FILE" >/dev/null

else
    echo "Backup failed!"

    echo "[$(date)] ERROR: Full backup failed" \
        | sudo tee -a "$LOG_FILE" >/dev/null

    exit 1
fi

echo "Backup checksum generated."
echo "Full backup completed."

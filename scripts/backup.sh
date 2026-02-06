#!/bin/bash

# Manuscript Workbench Backup Script
# Run daily via crontab: 0 2 * * * /var/www/apps/manuscript-workbench/scripts/backup.sh

set -e

# Configuration
PROJECT_DIR="/var/www/apps/manuscript-workbench"
BACKUP_DIR="/var/backups/manuscript-workbench"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Change to project directory
cd "$PROJECT_DIR"

echo "[$(date)] Starting backup..."

# Backup database
echo "[$(date)] Backing up database..."
docker-compose -f docker-compose.prod.yml exec -T db \
    pg_dump -U manuscript_user manuscript_db | \
    gzip > "$BACKUP_DIR/database_$DATE.sql.gz"

if [ $? -eq 0 ]; then
    echo "[$(date)] Database backup completed: database_$DATE.sql.gz"
else
    echo "[$(date)] ERROR: Database backup failed!"
    exit 1
fi

# Backup storage files
echo "[$(date)] Backing up storage files..."
if [ -d "$PROJECT_DIR/backend/storage" ]; then
    tar -czf "$BACKUP_DIR/storage_$DATE.tar.gz" \
        -C "$PROJECT_DIR/backend" storage

    if [ $? -eq 0 ]; then
        echo "[$(date)] Storage backup completed: storage_$DATE.tar.gz"
    else
        echo "[$(date)] ERROR: Storage backup failed!"
        exit 1
    fi
else
    echo "[$(date)] WARNING: Storage directory not found, skipping..."
fi

# Calculate backup sizes
DB_SIZE=$(du -h "$BACKUP_DIR/database_$DATE.sql.gz" | cut -f1)
if [ -f "$BACKUP_DIR/storage_$DATE.tar.gz" ]; then
    STORAGE_SIZE=$(du -h "$BACKUP_DIR/storage_$DATE.tar.gz" | cut -f1)
    echo "[$(date)] Backup sizes - Database: $DB_SIZE, Storage: $STORAGE_SIZE"
else
    echo "[$(date)] Backup sizes - Database: $DB_SIZE"
fi

# Delete old backups (older than retention days)
echo "[$(date)] Cleaning up old backups (retention: $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "database_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "storage_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# List remaining backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/database_*.sql.gz 2>/dev/null | wc -l)
echo "[$(date)] Total backups retained: $BACKUP_COUNT"

# Check disk space
DISK_USAGE=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $5}')
echo "[$(date)] Backup disk usage: $DISK_USAGE"

echo "[$(date)] Backup completed successfully!"
echo "----------------------------------------"

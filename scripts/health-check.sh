#!/bin/bash

# Manuscript Workbench Health Check Script
# Run periodically via crontab: */5 * * * * /var/www/apps/manuscript-workbench/scripts/health-check.sh

set -e

# Configuration
PROJECT_DIR="/var/www/apps/manuscript-workbench"
DOMAIN="manuscript-workbench.codebnb.me"
LOG_FILE="/var/log/manuscript-workbench-health.log"

# Exit codes
EXIT_OK=0
EXIT_ERROR=1

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check HTTP status
check_http() {
    local url=$1
    local expected=$2
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)

    if [ "$response" = "$expected" ]; then
        return 0
    else
        log "ERROR: $url returned $response (expected $expected)"
        return 1
    fi
}

log "Starting health check..."

# Check 1: Backend health endpoint
log "Checking backend health endpoint..."
if check_http "https://$DOMAIN/health" "200"; then
    log "✓ Backend health check passed"
else
    log "✗ Backend health check failed"
    exit $EXIT_ERROR
fi

# Check 2: Database connection (via Docker)
log "Checking database connection..."
cd "$PROJECT_DIR"
DB_CHECK=$(docker-compose -f docker-compose.prod.yml exec -T db \
    psql -U manuscript_user manuscript_db -c "SELECT 1;" 2>&1)

if echo "$DB_CHECK" | grep -q "1 row"; then
    log "✓ Database connection successful"
else
    log "✗ Database connection failed: $DB_CHECK"
    exit $EXIT_ERROR
fi

# Check 3: Container status
log "Checking container status..."
BACKEND_STATUS=$(docker-compose -f docker-compose.prod.yml ps backend | grep -c "Up" || echo "0")
DB_STATUS=$(docker-compose -f docker-compose.prod.yml ps db | grep -c "Up" || echo "0")

if [ "$BACKEND_STATUS" = "1" ] && [ "$DB_STATUS" = "1" ]; then
    log "✓ All containers running"
else
    log "✗ Container status check failed (Backend: $BACKEND_STATUS, DB: $DB_STATUS)"
    exit $EXIT_ERROR
fi

# Check 4: Storage disk usage
log "Checking storage disk usage..."
if [ -d "$PROJECT_DIR/backend/storage" ]; then
    STORAGE_SIZE=$(du -sh "$PROJECT_DIR/backend/storage" | cut -f1)
    DISK_USAGE=$(df -h "$PROJECT_DIR/backend/storage" | tail -1 | awk '{print $5}' | sed 's/%//')

    log "Storage size: $STORAGE_SIZE, Disk usage: ${DISK_USAGE}%"

    if [ "$DISK_USAGE" -gt 90 ]; then
        log "WARNING: Disk usage above 90%!"
    fi
else
    log "WARNING: Storage directory not found"
fi

# Check 5: Frontend accessibility
log "Checking frontend accessibility..."
if check_http "https://$DOMAIN/" "200"; then
    log "✓ Frontend accessible"
else
    log "✗ Frontend check failed"
    exit $EXIT_ERROR
fi

# Check 6: API documentation
log "Checking API documentation..."
if check_http "https://$DOMAIN/docs" "200"; then
    log "✓ API docs accessible"
else
    log "WARNING: API docs not accessible (non-critical)"
fi

log "All health checks passed successfully!"
exit $EXIT_OK

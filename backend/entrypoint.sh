#!/bin/bash
set -e

echo "Starting Manuscript Workbench Backend..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
max_retries=30
retry_count=0

while ! pg_isready -h db -p 5432 -U ${POSTGRES_USER:-manuscript_user} -d ${POSTGRES_DB:-manuscript_db} > /dev/null 2>&1; do
    retry_count=$((retry_count + 1))
    if [ $retry_count -ge $max_retries ]; then
        echo "ERROR: Database did not become ready in time"
        exit 1
    fi
    echo "Database is unavailable - sleeping (attempt $retry_count/$max_retries)"
    sleep 2
done

echo "Database is ready!"

# Run Alembic migrations
echo "Running database migrations..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "Migrations completed successfully!"
else
    echo "ERROR: Migrations failed!"
    exit 1
fi

# Start the application
echo "Starting uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

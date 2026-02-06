#!/bin/bash
# Database setup script - run this after starting Docker services

set -e

echo "======================================"
echo "Database Setup Script"
echo "======================================"
echo ""

echo "Step 1: Creating migration..."
alembic revision --autogenerate -m "initial_schema"

echo ""
echo "Step 2: Running migrations..."
alembic upgrade head

echo ""
echo "Step 3: Seeding database..."
python scripts/init_db.py

echo ""
echo "======================================"
echo "✓ Database setup complete!"
echo "======================================"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@manuscript.local"
echo "  Password: admin123"

#!/usr/bin/env python3
"""
Database initialization script
Run this after starting Docker services to create tables and seed data
"""
import sys
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.db.seed import run_seeds


def init_db():
    """Initialize database with seed data"""
    print("Initializing database...")

    db = SessionLocal()
    try:
        run_seeds(db)
        print("✓ Database initialized successfully!")
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()

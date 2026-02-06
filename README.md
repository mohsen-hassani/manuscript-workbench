# Manuscript Workbench

A web application for scientific writers to manage manuscripts, sync with Obsidian, and get AI assistance.

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and update values if needed
3. Start services:
   ```bash
   docker-compose up --build
   ```
4. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

## Project Structure

- `backend/` - FastAPI backend application
- `frontend/` - React + TypeScript frontend application
- `docker-compose.yml` - Docker orchestration configuration

## Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations
```bash
docker-compose exec backend alembic upgrade head
```

## Tech Stack

**Backend:**
- FastAPI 0.109+
- PostgreSQL 15
- SQLAlchemy 2.0
- Alembic

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS

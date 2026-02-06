import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import api_router

app = FastAPI(
    title="Manuscript Workbench API",
    description="API for Manuscript Workbench - Integrated Obsidian & Claude Code Environment",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Run database seeds on startup"""
    from app.database import SessionLocal
    from app.db.seed import run_seeds

    db = SessionLocal()
    try:
        run_seeds(db)
    finally:
        db.close()

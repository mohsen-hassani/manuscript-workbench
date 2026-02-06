from fastapi import APIRouter
from app.api.routes import auth, users, projects, files, chat

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(files.router)
api_router.include_router(chat.router)

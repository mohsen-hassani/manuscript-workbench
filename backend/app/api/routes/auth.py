from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import Token, LoginRequest, RegisterRequest, UserResponse
from app.services.user_service import UserService
from app.core.security import create_access_token
from app.config import get_settings
from app.api.deps import CurrentUser
from app.models import RoleName
from app.schemas.user import UserCreate

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token"""
    user_service = UserService(db)
    user = user_service.authenticate(login_data.email, login_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )

    return Token(access_token=access_token)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(register_data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user (default role: writer)"""
    user_service = UserService(db)

    # Check if email already exists
    existing = user_service.get_by_email(register_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user with default writer role
    user_create = UserCreate(
        email=register_data.email,
        password=register_data.password,
        full_name=register_data.full_name,
        role_name=RoleName.WRITER
    )

    user = user_service.create(user_create)
    return user


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: CurrentUser):
    """Get current authenticated user information"""
    return current_user

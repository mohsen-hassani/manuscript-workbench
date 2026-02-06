from fastapi import APIRouter, HTTPException, status
from app.api.deps import AdminUser, DbSession, CurrentUser
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.user_service import UserService
from app.models import RoleName

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    current_user: AdminUser,
    db: DbSession,
    skip: int = 0,
    limit: int = 100
):
    """List all users (Admin only)"""
    user_service = UserService(db)
    return user_service.get_all(skip=skip, limit=limit)


@router.get("/writers", response_model=list[UserResponse])
def list_writers(current_user: AdminUser, db: DbSession):
    """List all users with writer role (Admin only)"""
    user_service = UserService(db)
    return user_service.get_by_role(RoleName.WRITER)


@router.get("/statisticians", response_model=list[UserResponse])
def list_statisticians(current_user: AdminUser, db: DbSession):
    """List all users with statistician role (Admin only)"""
    user_service = UserService(db)
    return user_service.get_by_role(RoleName.STATISTICIAN)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    current_user: AdminUser,
    db: DbSession
):
    """Create a new user (Admin only)"""
    user_service = UserService(db)

    existing = user_service.get_by_email(user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    return user_service.create(user_data)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, current_user: AdminUser, db: DbSession):
    """Get user by ID (Admin only)"""
    user_service = UserService(db)
    user = user_service.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: AdminUser,
    db: DbSession
):
    """Update user (Admin only)"""
    user_service = UserService(db)
    user = user_service.update(user_id, user_data)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, current_user: AdminUser, db: DbSession):
    """Delete user (Admin only)"""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    user_service = UserService(db)
    if not user_service.delete(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

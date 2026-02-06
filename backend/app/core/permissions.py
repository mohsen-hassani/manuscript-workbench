from functools import wraps
from typing import Callable, List
from fastapi import HTTPException, status
from app.models import User, Project, ProjectMember, RoleName


def has_permission(user: User, permission: str) -> bool:
    """Check if user has a specific permission"""
    if not user.role or not user.role.permissions:
        return False
    return permission in user.role.permissions


def is_admin(user: User) -> bool:
    """Check if user is admin"""
    return user.role and user.role.name == RoleName.ADMIN.value


def get_user_project_role(user: User, project_id: int, db) -> ProjectMember | None:
    """Get user's membership in a project"""
    return (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user.id
        )
        .first()
    )


def can_access_project(user: User, project_id: int, db) -> bool:
    """Check if user can access a project"""
    # Admins can access all projects
    if is_admin(user):
        return True

    # Check if user is a member of the project
    membership = get_user_project_role(user, project_id, db)
    return membership is not None


def can_write_files(user: User, project_id: int, db) -> bool:
    """Check if user can write files in a project"""
    # Admins can write anywhere
    if is_admin(user):
        return True

    # Check project membership
    membership = get_user_project_role(user, project_id, db)
    if not membership:
        return False

    # Only writers can create/update files
    from app.models.enums import ProjectRole
    return membership.role == ProjectRole.WRITER


class PermissionChecker:
    """
    Dependency class for checking permissions.
    Usage: Depends(PermissionChecker(["permission1", "permission2"]))
    """

    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions

    def __call__(self, user: User) -> bool:
        for permission in self.required_permissions:
            if not has_permission(user, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied. Required: {permission}"
                )
        return True


class AdminRequired:
    """
    Dependency that requires admin role.
    Usage: Depends(AdminRequired())
    """

    def __call__(self, user: User) -> User:
        if not is_admin(user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        return user


class ProjectAccessChecker:
    """
    Dependency for checking project access.
    Usage: Depends(ProjectAccessChecker(write_access=True))
    """

    def __init__(self, write_access: bool = False):
        self.write_access = write_access

    def __call__(self, project_id: int, user: User, db) -> bool:
        if self.write_access:
            if not can_write_files(user, project_id, db):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Write access denied for this project"
                )
        else:
            if not can_access_project(user, project_id, db):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied for this project"
                )
        return True

from fastapi import APIRouter, HTTPException, status
from app.api.deps import (
    CurrentUser,
    DbSession,
    AdminUser,
    ProjectWithAccess
)
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectDetailResponse,
    ProjectMemberCreate,
    ProjectMemberResponse,
    TeamAssignment
)
from app.services.project_service import ProjectService
from app.core.permissions import is_admin

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    current_user: CurrentUser,
    db: DbSession,
    skip: int = 0,
    limit: int = 100
):
    """
    List projects.
    - Admin: sees all projects
    - Writer/Statistician: sees only assigned projects
    """
    project_service = ProjectService(db)
    projects = project_service.get_user_projects(current_user, skip, limit)

    # Add creator_name to response
    result = []
    for project in projects:
        project_dict = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "word_count": project.word_count,
            "created_by": project.created_by,
            "creator_name": project.creator.full_name if project.creator else "Unknown",
            "base_folder_path": project.base_folder_path,
            "created_at": project.created_at,
            "updated_at": project.updated_at
        }
        result.append(ProjectResponse(**project_dict))

    return result


@router.get("/statistics")
def get_project_statistics(current_user: AdminUser, db: DbSession):
    """Get project statistics (Admin only)"""
    project_service = ProjectService(db)
    return project_service.get_statistics()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    current_user: AdminUser,
    db: DbSession
):
    """Create a new project (Admin only)"""
    project_service = ProjectService(db)
    project = project_service.create(project_data, current_user.id)

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        word_count=project.word_count,
        created_by=project.created_by,
        creator_name=current_user.full_name,
        base_folder_path=project.base_folder_path,
        created_at=project.created_at,
        updated_at=project.updated_at
    )


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(
    project: ProjectWithAccess,
    current_user: CurrentUser,
    db: DbSession
):
    """Get project details with team members"""
    project_service = ProjectService(db)
    members = project_service.get_project_members(project.id)
    file_count = project_service.get_file_count(project.id)

    return ProjectDetailResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        word_count=project.word_count,
        created_by=project.created_by,
        creator_name=project.creator.full_name if project.creator else "Unknown",
        base_folder_path=project.base_folder_path,
        created_at=project.created_at,
        updated_at=project.updated_at,
        members=[ProjectMemberResponse(**m) for m in members],
        file_count=file_count
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: AdminUser,
    db: DbSession
):
    """Update project (Admin only)"""
    project_service = ProjectService(db)
    project = project_service.update(project_id, project_data)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        word_count=project.word_count,
        created_by=project.created_by,
        creator_name=project.creator.full_name if project.creator else "Unknown",
        base_folder_path=project.base_folder_path,
        created_at=project.created_at,
        updated_at=project.updated_at
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, current_user: AdminUser, db: DbSession):
    """Delete project (Admin only)"""
    project_service = ProjectService(db)

    if not project_service.delete(project_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )


# Team Management Endpoints

@router.post("/{project_id}/team", response_model=list[ProjectMemberResponse])
def assign_team(
    project_id: int,
    team: TeamAssignment,
    current_user: AdminUser,
    db: DbSession
):
    """Assign team members to a project (Admin only)"""
    project_service = ProjectService(db)

    # Verify project exists
    project = project_service.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    project_service.assign_team(project_id, team.members)
    members = project_service.get_project_members(project_id)

    return [ProjectMemberResponse(**m) for m in members]


@router.post("/{project_id}/members", response_model=ProjectMemberResponse)
def add_project_member(
    project_id: int,
    member_data: ProjectMemberCreate,
    current_user: AdminUser,
    db: DbSession
):
    """Add a team member to a project (Admin only)"""
    project_service = ProjectService(db)

    # Verify project exists
    project = project_service.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    member = project_service.add_member(project_id, member_data)
    members = project_service.get_project_members(project_id)

    # Find the just-added member
    for m in members:
        if m["user_id"] == member_data.user_id:
            return ProjectMemberResponse(**m)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to add member"
    )


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    project_id: int,
    user_id: int,
    current_user: AdminUser,
    db: DbSession
):
    """Remove a team member from a project (Admin only)"""
    project_service = ProjectService(db)

    if not project_service.remove_member(project_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in project"
        )


@router.get("/{project_id}/members", response_model=list[ProjectMemberResponse])
def get_project_members(
    project: ProjectWithAccess,
    current_user: CurrentUser,
    db: DbSession
):
    """Get project team members"""
    project_service = ProjectService(db)
    members = project_service.get_project_members(project.id)
    return [ProjectMemberResponse(**m) for m in members]

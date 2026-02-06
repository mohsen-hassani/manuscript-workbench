from datetime import datetime
from pydantic import BaseModel
from app.models.enums import ProjectStatus, ProjectRole


class ProjectMemberBase(BaseModel):
    user_id: int
    role: ProjectRole


class ProjectMemberCreate(ProjectMemberBase):
    pass


class ProjectMemberResponse(ProjectMemberBase):
    id: int
    user_email: str
    user_full_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    name: str
    description: str | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: ProjectStatus | None = None
    base_folder_path: str | None = None


class ProjectResponse(ProjectBase):
    id: int
    status: ProjectStatus
    word_count: int
    created_by: int
    creator_name: str
    base_folder_path: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectDetailResponse(ProjectResponse):
    members: list[ProjectMemberResponse] = []
    file_count: int = 0


class TeamAssignment(BaseModel):
    """Assign multiple team members to a project"""
    members: list[ProjectMemberCreate]

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models import Project, ProjectMember, User, File
from app.models.enums import ProjectStatus
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectMemberCreate,
    ProjectMemberResponse
)
from app.core.permissions import is_admin


class ProjectService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, project_id: int) -> Project | None:
        return (
            self.db.query(Project)
            .options(joinedload(Project.members).joinedload(ProjectMember.user))
            .filter(Project.id == project_id)
            .first()
        )

    def get_all(self, skip: int = 0, limit: int = 100) -> list[Project]:
        return (
            self.db.query(Project)
            .options(joinedload(Project.creator))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_user_projects(self, user: User, skip: int = 0, limit: int = 100) -> list[Project]:
        """Get projects accessible by user"""
        if is_admin(user):
            return self.get_all(skip, limit)

        # Get projects where user is a member
        return (
            self.db.query(Project)
            .join(ProjectMember)
            .options(joinedload(Project.creator))
            .filter(ProjectMember.user_id == user.id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, project_data: ProjectCreate, created_by: int) -> Project:
        project = Project(
            name=project_data.name,
            description=project_data.description,
            status=ProjectStatus.DRAFT,
            created_by=created_by
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update(self, project_id: int, project_data: ProjectUpdate) -> Project | None:
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None

        update_data = project_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        self.db.commit()
        self.db.refresh(project)
        return project

    def delete(self, project_id: int) -> bool:
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return False
        self.db.delete(project)
        self.db.commit()
        return True

    def add_member(self, project_id: int, member_data: ProjectMemberCreate) -> ProjectMember | None:
        """Add a team member to a project"""
        # Check if user is already a member
        existing = (
            self.db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == member_data.user_id
            )
            .first()
        )

        if existing:
            # Update role if already exists
            existing.role = member_data.role
            self.db.commit()
            self.db.refresh(existing)
            return existing

        member = ProjectMember(
            project_id=project_id,
            user_id=member_data.user_id,
            role=member_data.role
        )
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        return member

    def remove_member(self, project_id: int, user_id: int) -> bool:
        """Remove a team member from a project"""
        member = (
            self.db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id
            )
            .first()
        )

        if not member:
            return False

        self.db.delete(member)
        self.db.commit()
        return True

    def get_project_members(self, project_id: int) -> list[dict]:
        """Get all members of a project with user details"""
        members = (
            self.db.query(ProjectMember)
            .options(joinedload(ProjectMember.user))
            .filter(ProjectMember.project_id == project_id)
            .all()
        )

        return [
            {
                "id": m.id,
                "user_id": m.user_id,
                "role": m.role,
                "user_email": m.user.email,
                "user_full_name": m.user.full_name,
                "created_at": m.created_at
            }
            for m in members
        ]

    def assign_team(self, project_id: int, members: list[ProjectMemberCreate]) -> list[ProjectMember]:
        """Assign a team to a project (replaces existing members)"""
        # Remove existing members
        self.db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id
        ).delete()

        # Add new members
        new_members = []
        for member_data in members:
            member = ProjectMember(
                project_id=project_id,
                user_id=member_data.user_id,
                role=member_data.role
            )
            self.db.add(member)
            new_members.append(member)

        self.db.commit()

        for m in new_members:
            self.db.refresh(m)

        return new_members

    def get_file_count(self, project_id: int) -> int:
        """Get the number of files in a project"""
        return self.db.query(func.count(File.id)).filter(File.project_id == project_id).scalar()

    def get_statistics(self) -> dict:
        """Get project statistics for dashboard"""
        total = self.db.query(func.count(Project.id)).scalar()

        by_status = (
            self.db.query(Project.status, func.count(Project.id))
            .group_by(Project.status)
            .all()
        )

        status_counts = {status.value: 0 for status in ProjectStatus}
        for status, count in by_status:
            status_counts[status.value] = count

        return {
            "total": total,
            "draft": status_counts.get("draft", 0),
            "in_progress": status_counts.get("in_progress", 0),
            "under_review": status_counts.get("under_review", 0),
            "completed": status_counts.get("completed", 0)
        }

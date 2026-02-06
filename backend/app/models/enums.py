import enum


class RoleName(str, enum.Enum):
    ADMIN = "admin"
    WRITER = "writer"
    STATISTICIAN = "statistician"


class ProjectStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    UNDER_REVIEW = "under_review"
    COMPLETED = "completed"


class ProjectRole(str, enum.Enum):
    """Role within a specific project"""
    WRITER = "writer"
    STATISTICIAN = "statistician"

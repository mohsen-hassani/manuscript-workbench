from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class FileBase(BaseModel):
    filename: str


class FileCreate(FileBase):
    content_type: str | None = None


class FileResponse(FileBase):
    id: int
    project_id: int
    original_filename: str
    storage_path: str
    content_type: str | None
    size: int
    uploaded_by: int
    uploader_name: str
    version: int = 0
    created_at: datetime
    updated_at: datetime
    download_url: str

    class Config:
        from_attributes = True


class FileListResponse(BaseModel):
    files: list[FileResponse]
    total: int


class FileContentResponse(BaseModel):
    """Response when reading file content"""
    filename: str
    content: str
    content_type: str | None


class FileCreateRequest(BaseModel):
    """Request to create a new file with content (no upload required)"""
    filename: str = Field(..., min_length=1, max_length=255)
    content: str = ""

    @field_validator('filename')
    def validate_filename(cls, v):
        # Ensure .md extension
        if not v.endswith('.md'):
            v = f"{v}.md"
        # Sanitize filename
        v = v.replace('/', '_').replace('\\', '_')
        return v

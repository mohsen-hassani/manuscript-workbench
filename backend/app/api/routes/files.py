from fastapi import APIRouter, HTTPException, status, UploadFile, File as FastAPIFile, Form
from fastapi.responses import Response
from datetime import datetime
from app.api.deps import (
    CurrentUser,
    DbSession,
    ProjectWithAccess,
    ProjectWithWriteAccess
)
from app.schemas.file import FileResponse, FileListResponse, FileContentResponse, FileCreateRequest
from app.services.file_service import FileService
from app.services.storage import get_storage
from app.core.permissions import can_access_project, can_write_files
from app.models import File

router = APIRouter(prefix="/projects/{project_id}/files", tags=["Files"])


def _file_to_response(file: File) -> FileResponse:
    """Convert File model to FileResponse"""
    storage = get_storage()
    return FileResponse(
        id=file.id,
        project_id=file.project_id,
        filename=file.filename,
        original_filename=file.original_filename,
        storage_path=file.storage_path,
        content_type=file.content_type,
        size=file.size,
        uploaded_by=file.uploaded_by,
        uploader_name=file.uploader.full_name if file.uploader else "Unknown",
        version=file.version,
        created_at=file.created_at,
        updated_at=file.updated_at,
        download_url=storage.get_file_url(file.storage_path)
    )


@router.get("", response_model=FileListResponse)
def list_project_files(
    project: ProjectWithAccess,
    current_user: CurrentUser,
    db: DbSession
):
    """List all files in a project"""
    file_service = FileService(db)
    files = file_service.get_project_files(project.id)

    return FileListResponse(
        files=[_file_to_response(f) for f in files],
        total=len(files)
    )


@router.post("", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    project: ProjectWithWriteAccess,
    current_user: CurrentUser,
    db: DbSession,
    file: UploadFile = FastAPIFile(...)
):
    """
    Upload a file to a project.
    Only Admin and Writers can upload files.
    """
    # Read file content
    content = await file.read()

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )

    file_service = FileService(db)
    file_record = file_service.upload_file(
        project_id=project.id,
        filename=file.filename,
        content=content,
        content_type=file.content_type or "application/octet-stream",
        uploaded_by=current_user.id
    )

    return _file_to_response(file_record)


@router.post("/create", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
def create_file(
    request: FileCreateRequest,
    project: ProjectWithWriteAccess,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Create a new markdown file without uploading.
    Only Admin and Writers can create files.
    """
    file_service = FileService(db)
    file = file_service.create_file(
        project_id=project.id,
        filename=request.filename,
        content=request.content,
        created_by=current_user.id
    )

    return _file_to_response(file)


@router.get("/{file_id}", response_model=FileResponse)
def get_file_info(
    project: ProjectWithAccess,
    file_id: int,
    current_user: CurrentUser,
    db: DbSession
):
    """Get file metadata"""
    file_service = FileService(db)
    file_record = file_service.get_by_id(file_id)

    if not file_record or file_record.project_id != project.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return _file_to_response(file_record)


@router.get("/{file_id}/download")
def download_file(
    project: ProjectWithAccess,
    file_id: int,
    current_user: CurrentUser,
    db: DbSession
):
    """Download file content"""
    file_service = FileService(db)

    try:
        content, file_record = file_service.download_file(file_id)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    if file_record.project_id != project.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return Response(
        content=content,
        media_type=file_record.content_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{file_record.original_filename}"'
        }
    )


@router.get("/{file_id}/content", response_model=FileContentResponse)
def get_file_content(
    project: ProjectWithAccess,
    file_id: int,
    current_user: CurrentUser,
    db: DbSession
):
    """Get file content as text (for markdown viewing)"""
    file_service = FileService(db)

    try:
        content, file_record = file_service.get_file_content_as_text(file_id)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is not a text file"
        )

    if file_record.project_id != project.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return FileContentResponse(
        filename=file_record.filename,
        content=content,
        content_type=file_record.content_type
    )


@router.put("/{file_id}", response_model=FileResponse)
async def update_file(
    project: ProjectWithWriteAccess,
    file_id: int,
    current_user: CurrentUser,
    db: DbSession,
    file: UploadFile = FastAPIFile(...),
    version: int = Form(...)
):
    """
    Update file content with version check for optimistic locking.
    Only Admin and Writers can update files.
    """
    file_service = FileService(db)

    # Check file exists and belongs to project
    file_record = file_service.get_by_id(file_id)
    if not file_record or file_record.project_id != project.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Version check for optimistic concurrency control
    if version <= file_record.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Version conflict. Server version is {file_record.version}, "
                   f"your version is {version}. Download the latest version first."
        )

    # Read and save new content
    content = await file.read()
    file_service.storage.save(content, file_record.storage_path)

    # Update file metadata
    file_record.version = version
    file_record.size = len(content)
    file_record.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(file_record)

    return _file_to_response(file_record)


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    project: ProjectWithWriteAccess,
    file_id: int,
    current_user: CurrentUser,
    db: DbSession
):
    """
    Delete a file from the project.
    Only Admin and Writers can delete files.
    """
    file_service = FileService(db)

    # Check file exists and belongs to project
    file_record = file_service.get_by_id(file_id)
    if not file_record or file_record.project_id != project.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    if not file_service.delete_file(file_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

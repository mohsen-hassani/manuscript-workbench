import uuid
from sqlalchemy.orm import Session, joinedload
from app.models import File, Project
from app.services.storage import get_storage


class FileService:
    def __init__(self, db: Session):
        self.db = db
        self.storage = get_storage()

    def get_by_id(self, file_id: int) -> File | None:
        return (
            self.db.query(File)
            .options(joinedload(File.uploader))
            .filter(File.id == file_id)
            .first()
        )

    def get_project_files(self, project_id: int) -> list[File]:
        return (
            self.db.query(File)
            .options(joinedload(File.uploader))
            .filter(File.project_id == project_id)
            .all()
        )

    def upload_file(
        self,
        project_id: int,
        filename: str,
        content: bytes,
        content_type: str,
        uploaded_by: int
    ) -> File:
        """Upload a file to storage and create database record"""
        # Generate unique storage path
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        storage_path = f"projects/{project_id}/{unique_filename}"

        # Save to storage
        self.storage.save(content, storage_path)

        # Create database record
        file_record = File(
            project_id=project_id,
            filename=filename,
            original_filename=filename,
            storage_path=storage_path,
            content_type=content_type,
            size=len(content),
            uploaded_by=uploaded_by
        )

        self.db.add(file_record)
        self.db.commit()
        self.db.refresh(file_record)

        return file_record

    def download_file(self, file_id: int) -> tuple[bytes, File]:
        """Download a file from storage"""
        file_record = self.get_by_id(file_id)
        if not file_record:
            raise FileNotFoundError(f"File not found: {file_id}")

        content = self.storage.read(file_record.storage_path)
        return content, file_record

    def update_file_content(self, file_id: int, content: bytes) -> File:
        """Update file content (re-upload after local editing)"""
        file_record = self.get_by_id(file_id)
        if not file_record:
            raise FileNotFoundError(f"File not found: {file_id}")

        # Overwrite in storage
        self.storage.save(content, file_record.storage_path)

        # Update size
        file_record.size = len(content)
        self.db.commit()
        self.db.refresh(file_record)

        return file_record

    def delete_file(self, file_id: int) -> bool:
        """Delete file from storage and database"""
        file_record = self.get_by_id(file_id)
        if not file_record:
            return False

        # Delete from storage
        self.storage.delete(file_record.storage_path)

        # Delete from database
        self.db.delete(file_record)
        self.db.commit()

        return True

    def get_file_content_as_text(self, file_id: int) -> tuple[str, File]:
        """Get file content as text (for markdown files)"""
        content, file_record = self.download_file(file_id)
        return content.decode('utf-8'), file_record

    def create_file(
        self,
        project_id: int,
        filename: str,
        content: str,
        created_by: int
    ) -> File:
        """Create a new file with content (no upload required)"""
        # Generate storage path
        unique_id = str(uuid.uuid4())
        storage_filename = f"{unique_id}_{filename}"
        storage_path = f"projects/{project_id}/{storage_filename}"

        # Save content to storage
        content_bytes = content.encode('utf-8')
        self.storage.save(content_bytes, storage_path)

        # Create database record (version starts at 0)
        file_obj = File(
            project_id=project_id,
            filename=storage_filename,
            original_filename=filename,
            storage_path=storage_path,
            content_type="text/markdown",
            size=len(content_bytes),
            uploaded_by=created_by,
            version=0
        )

        self.db.add(file_obj)
        self.db.commit()
        self.db.refresh(file_obj)

        return file_obj

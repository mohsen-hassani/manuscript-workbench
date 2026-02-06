import os
import shutil
from pathlib import Path
from typing import List
from app.services.storage.base import BaseStorage
from app.config import get_settings


class LocalStorage(BaseStorage):
    """
    Local filesystem storage implementation.
    Files are stored in the configured storage path.
    """

    def __init__(self, base_path: str = None):
        settings = get_settings()
        self.base_path = Path(base_path or settings.storage_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _full_path(self, path: str) -> Path:
        """Convert relative path to absolute path"""
        return self.base_path / path

    def save(self, file_data: bytes, path: str) -> str:
        """Save file to local filesystem"""
        full_path = self._full_path(path)

        # Create parent directories if needed
        full_path.parent.mkdir(parents=True, exist_ok=True)

        with open(full_path, 'wb') as f:
            f.write(file_data)

        return path

    def read(self, path: str) -> bytes:
        """Read file from local filesystem"""
        full_path = self._full_path(path)

        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {path}")

        with open(full_path, 'rb') as f:
            return f.read()

    def delete(self, path: str) -> bool:
        """Delete file from local filesystem"""
        full_path = self._full_path(path)

        if not full_path.exists():
            return False

        full_path.unlink()
        return True

    def exists(self, path: str) -> bool:
        """Check if file exists in local filesystem"""
        return self._full_path(path).exists()

    def list_files(self, prefix: str = "") -> List[str]:
        """List all files with given prefix"""
        prefix_path = self._full_path(prefix)

        if not prefix_path.exists():
            return []

        files = []
        if prefix_path.is_dir():
            for item in prefix_path.rglob('*'):
                if item.is_file():
                    rel_path = item.relative_to(self.base_path)
                    files.append(str(rel_path))

        return files

    def get_file_url(self, path: str) -> str:
        """Get path to access the file (for local, just return the path)"""
        return f"/api/files/download/{path}"

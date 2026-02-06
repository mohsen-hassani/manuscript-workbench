from abc import ABC, abstractmethod
from typing import BinaryIO, List


class BaseStorage(ABC):
    """
    Abstract base class for file storage implementations.
    Follows Strategy pattern to allow different storage backends.
    """

    @abstractmethod
    def save(self, file_data: bytes, path: str) -> str:
        """
        Save file data to storage.

        Args:
            file_data: Binary content of the file
            path: Relative path where to store the file

        Returns:
            The actual path where file was stored
        """
        pass

    @abstractmethod
    def read(self, path: str) -> bytes:
        """
        Read file from storage.

        Args:
            path: Path to the file

        Returns:
            Binary content of the file

        Raises:
            FileNotFoundError: If file doesn't exist
        """
        pass

    @abstractmethod
    def delete(self, path: str) -> bool:
        """
        Delete file from storage.

        Args:
            path: Path to the file

        Returns:
            True if deleted, False if file didn't exist
        """
        pass

    @abstractmethod
    def exists(self, path: str) -> bool:
        """
        Check if file exists in storage.

        Args:
            path: Path to the file

        Returns:
            True if exists, False otherwise
        """
        pass

    @abstractmethod
    def list_files(self, prefix: str = "") -> List[str]:
        """
        List all files with given prefix.

        Args:
            prefix: Path prefix to filter files

        Returns:
            List of file paths
        """
        pass

    @abstractmethod
    def get_file_url(self, path: str) -> str:
        """
        Get URL/path to access the file.

        Args:
            path: Path to the file

        Returns:
            URL or path to access the file
        """
        pass

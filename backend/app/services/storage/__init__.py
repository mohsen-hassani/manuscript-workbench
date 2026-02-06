from app.services.storage.base import BaseStorage
from app.services.storage.local import LocalStorage

# Storage singleton
_storage_instance: BaseStorage | None = None


def get_storage() -> BaseStorage:
    """
    Factory function to get storage instance.
    Currently returns LocalStorage, but can be extended to return
    S3Storage or other implementations based on configuration.
    """
    global _storage_instance

    if _storage_instance is None:
        # In the future, this can check config and return appropriate storage
        # if settings.storage_type == "s3":
        #     _storage_instance = S3Storage()
        # else:
        _storage_instance = LocalStorage()

    return _storage_instance


__all__ = ["BaseStorage", "LocalStorage", "get_storage"]

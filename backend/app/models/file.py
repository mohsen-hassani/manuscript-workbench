from sqlalchemy import Column, Integer, String, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin


class File(Base, TimestampMixin):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    content_type = Column(String(100), nullable=True)
    size = Column(BigInteger, default=0)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    version = Column(Integer, default=0, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="files")
    uploader = relationship("User", back_populates="uploaded_files")

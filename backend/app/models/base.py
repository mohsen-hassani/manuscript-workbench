from datetime import datetime
from sqlalchemy import Column, DateTime
from sqlalchemy.orm import declared_attr
from app.database import Base


class TimestampMixin:
    """Mixin to add created_at and updated_at timestamps"""

    @declared_attr
    def created_at(cls):
        return Column(DateTime, default=datetime.utcnow, nullable=False)

    @declared_attr
    def updated_at(cls):
        return Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

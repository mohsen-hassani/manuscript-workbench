from sqlalchemy.orm import Session
from app.models import User, Role, RoleName
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> list[User]:
        return self.db.query(User).offset(skip).limit(limit).all()

    def get_by_role(self, role_name: RoleName) -> list[User]:
        return (
            self.db.query(User)
            .join(Role)
            .filter(Role.name == role_name.value)
            .all()
        )

    def create(self, user_data: UserCreate) -> User:
        role = self.db.query(Role).filter(Role.name == user_data.role_name.value).first()
        if not role:
            raise ValueError(f"Role {user_data.role_name} not found")

        user = User(
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            full_name=user_data.full_name,
            role_id=role.id
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user_id: int, user_data: UserUpdate) -> User | None:
        user = self.get_by_id(user_id)
        if not user:
            return None

        update_data = user_data.model_dump(exclude_unset=True)

        if "role_name" in update_data:
            role = self.db.query(Role).filter(Role.name == update_data["role_name"].value).first()
            if role:
                user.role_id = role.id
            del update_data["role_name"]

        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user_id: int) -> bool:
        user = self.get_by_id(user_id)
        if not user:
            return False
        self.db.delete(user)
        self.db.commit()
        return True

    def authenticate(self, email: str, password: str) -> User | None:
        user = self.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

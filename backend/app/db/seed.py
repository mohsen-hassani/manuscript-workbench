from sqlalchemy.orm import Session
from app.models import Role, User, RoleName
from app.core.security import get_password_hash


def seed_roles(db: Session) -> dict[str, Role]:
    """Create default roles if they don't exist"""
    roles = {}

    role_permissions = {
        RoleName.ADMIN: [
            "projects:create", "projects:read", "projects:update", "projects:delete",
            "projects:assign_team",
            "users:create", "users:read", "users:update", "users:delete",
            "files:create", "files:read", "files:update", "files:delete",
            "ai:use"
        ],
        RoleName.WRITER: [
            "projects:read",
            "files:create", "files:read", "files:update",
            "ai:use"
        ],
        RoleName.STATISTICIAN: [
            "projects:read",
            "files:read",
            "ai:use"
        ]
    }

    for role_name, permissions in role_permissions.items():
        existing = db.query(Role).filter(Role.name == role_name.value).first()
        if not existing:
            role = Role(name=role_name.value, permissions=permissions)
            db.add(role)
            db.flush()
            roles[role_name.value] = role
        else:
            roles[role_name.value] = existing

    db.commit()
    return roles


def seed_admin_user(db: Session, roles: dict[str, Role]) -> User:
    """Create default admin user if not exists"""
    admin_email = "admin@example.com"
    existing = db.query(User).filter(User.email == admin_email).first()

    if not existing:
        admin = User(
            email=admin_email,
            hashed_password=get_password_hash("admin123"),
            full_name="System Administrator",
            role_id=roles[RoleName.ADMIN.value].id,
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return admin

    return existing


def run_seeds(db: Session):
    """Run all seeders"""
    roles = seed_roles(db)
    seed_admin_user(db, roles)
    print("Database seeded successfully!")

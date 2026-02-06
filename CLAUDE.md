# CLAUDE.md - Manuscript Workbench Demo

## Project Overview

You are building a **demo MVP** of Manuscript Workbench - a web application for scientific writers to manage manuscripts, sync with Obsidian, and get AI assistance. This is a **client demonstration prototype**, not a production system.

### Demo Scope (What to Build)
- ✅ Full authentication with JWT (login, register, logout)
- ✅ Role-based access control (Admin, Writer, Statistician)
- ✅ Project CRUD with team assignment
- ✅ File upload/download with local storage
- ✅ Fake LLM chat with streaming responses
- ✅ Markdown file viewer
- ✅ Dark theme UI matching the provided screenshots

### Excluded from Demo
- ❌ Atlassian Confluence integration (skip entirely)
- ❌ Real S3 storage (use local filesystem)
- ❌ Real AI API calls (use FakeLLM with predefined responses)
- ❌ Real Obsidian sync (simulate with file upload/download)
- ❌ Email verification, password reset
- ❌ Production security hardening

---

## Tech Stack

### Backend
- **Framework**: FastAPI 0.109+
- **Database**: PostgreSQL 15+ with SQLAlchemy 2.0
- **Migrations**: Alembic
- **Auth**: python-jose (JWT), passlib (bcrypt)
- **File Handling**: python-multipart
- **WebSocket**: FastAPI WebSocket + websockets library

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom dark theme
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Markdown**: react-markdown + remark-gfm

### Infrastructure
- **Containerization**: Docker + docker-compose
- **Services**: PostgreSQL, Backend (FastAPI), Frontend (Vite dev server)

---

## Project Structure

```
manuscript-workbench/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── models/
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── project.py
│       │   └── file.py
│       ├── schemas/
│       │   ├── __init__.py
│       │   ├── auth.py
│       │   ├── user.py
│       │   ├── project.py
│       │   ├── file.py
│       │   └── chat.py
│       ├── api/
│       │   ├── deps.py
│       │   └── routes/
│       │       ├── __init__.py
│       │       ├── auth.py
│       │       ├── users.py
│       │       ├── projects.py
│       │       ├── files.py
│       │       └── chat.py
│       ├── services/
│       │   ├── user_service.py
│       │   ├── project_service.py
│       │   ├── file_service.py
│       │   ├── storage/
│       │   │   ├── __init__.py
│       │   │   ├── base.py
│       │   │   └── local.py
│       │   └── llm/
│       │       ├── __init__.py
│       │       ├── base.py
│       │       └── fake.py
│       └── core/
│           ├── security.py
│           └── permissions.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── types/
        │   └── index.ts
        ├── services/
        │   └── api.ts
        ├── contexts/
        │   └── AuthContext.tsx
        ├── components/
        │   ├── ui/
        │   │   ├── Button.tsx
        │   │   ├── Input.tsx
        │   │   ├── Card.tsx
        │   │   └── index.ts
        │   ├── layout/
        │   │   ├── MainLayout.tsx
        │   │   ├── Sidebar.tsx
        │   │   └── Header.tsx
        │   ├── dashboard/
        │   │   ├── StatCard.tsx
        │   │   ├── ProgressBar.tsx
        │   │   ├── RecentManuscript.tsx
        │   │   └── index.ts
        │   ├── projects/
        │   │   ├── ProjectCard.tsx
        │   │   ├── ProjectForm.tsx
        │   │   ├── TeamAssignment.tsx
        │   │   ├── ProjectModal.tsx
        │   │   └── index.ts
        │   └── workspace/
        │       ├── AIChatPanel.tsx
        │       ├── ChatMessage.tsx
        │       ├── FileTree.tsx
        │       ├── FileTreeItem.tsx
        │       ├── MarkdownViewer.tsx
        │       ├── WorkspaceLayout.tsx
        │       └── index.ts
        └── pages/
            ├── LoginPage.tsx
            ├── RegisterPage.tsx
            ├── DashboardPage.tsx
            ├── ProjectsPage.tsx
            ├── WorkspacePage.tsx
            └── index.ts
```

---

## Implementation Order

**Follow these specification files in order:**

1. **Step01_Project_Setup.md** - Docker, project scaffolding, basic configs
2. **Step02_Database_Models.md** - SQLAlchemy models, migrations, seeder
3. **Step03_Authentication.md** - JWT auth, login/register endpoints
4. **Step04_RBAC.md** - Permission system, role-based access
5. **Step05_Projects.md** - Project CRUD, team assignment API
6. **Step06_File_Management.md** - Storage strategy pattern, file endpoints
7. **Step07_Fake_LLM.md** - LLM strategy pattern, WebSocket streaming
8. **Step08_Frontend_Auth.md** - React auth, layout components
9. **Step09_Dashboard.md** - Dashboard with stats and progress
10. **Step10_Projects_UI.md** - Projects list, forms, team management
11. **Step11_Workspace_UI.md** - Split-pane workspace with AI chat

**Each step is self-contained and builds on the previous steps.**

---

## Architecture Patterns

### Strategy Pattern for Extensibility

The demo uses Strategy pattern for components that would have different implementations in production:

```python
from abc import ABC, abstractmethod
from typing import AsyncIterator

# Storage: BaseStorage → LocalStorage (demo) / S3Storage (production)
class BaseStorage(ABC):
    @abstractmethod
    def save(self, file_data: bytes, filename: str) -> str: pass
    @abstractmethod
    def read(self, storage_path: str) -> bytes: pass
    @abstractmethod
    def delete(self, storage_path: str) -> bool: pass

# LLM: BaseLLM → FakeLLM (demo) / ClaudeLLM (production)
class BaseLLM(ABC):
    @abstractmethod
    async def generate(self, prompt: str, context: str = "") -> str: pass
    @abstractmethod
    async def stream(self, prompt: str, context: str = "") -> AsyncIterator[str]: pass
```

### Dependency Injection

Factory functions provide the correct implementation:

```python
def get_storage() -> BaseStorage:
    return LocalStorage(base_path=settings.storage_path)

def get_llm() -> BaseLLM:
    return FakeLLM()  # Would return ClaudeLLM in production
```

### Role-Based Access Control

Three roles with hierarchical permissions:

| Role             | Permissions                                                    |
|------------------|----------------------------------------------------------------|
| **Admin**        | Full access to all projects, can create projects, manage users |
| **Writer**       | Read/write access to assigned projects only                    |
| **Statistician** | Read-only access to assigned projects                          |

---

## Coding Conventions

### Python (Backend)

```python
# Use type hints everywhere
def get_user_by_email(self, email: str) -> User | None:
    return self.db.query(User).filter(User.email == email).first()

# Use Pydantic for validation
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None

# Use dependency injection
@router.get("/projects")
def list_projects(
    current_user: CurrentUser,  # Annotated dependency
    db: DbSession,              # Annotated dependency
):
    ...

# Async for I/O operations
async def stream(self, prompt: str) -> AsyncIterator[str]:
    for word in response.split():
        yield word
        await asyncio.sleep(0.05)
```

### TypeScript (Frontend)

```typescript
// Use interfaces for types
interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
}

// Use functional components with hooks
export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  // ...
}

// Use async/await for API calls
const fetchProjects = async () => {
  try {
    const data = await api.getProjects();
    setProjects(data);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
  }
};
```

### Tailwind CSS

Use the custom dark theme colors defined in tailwind.config.js:

```javascript
// Custom colors
colors: {
  dark: {
    900: '#0f0f14',  // Background
    800: '#16161d',  // Cards
    700: '#1e1e27',  // Elevated surfaces
    600: '#2a2a36',  // Borders
  },
  accent: {
    purple: '#8b5cf6',  // Primary accent
  },
}
```

---

## Key Implementation Details

### Authentication Flow

1. User submits credentials to `POST /api/auth/login`
2. Backend validates and returns JWT token
3. Frontend stores token in localStorage
4. Axios interceptor adds `Authorization: Bearer {token}` to all requests
5. Backend validates token on protected routes via `get_current_user` dependency

### WebSocket Chat Protocol

```
Client → Server: {"message": "Help with intro", "project_id": 1, "file_id": 5}
Server → Client: {"type": "start", "model": "fake-claude-demo"}
Server → Client: {"type": "token", "content": "I'd"}
Server → Client: {"type": "token", "content": " be"}
Server → Client: {"type": "token", "content": " happy"}
...
Server → Client: {"type": "end", "full_response": "I'd be happy to..."}
```

### File Storage

Files are stored in `/app/storage/{project_id}/{uuid}_{filename}`:
- Original filename preserved in database
- UUID prefix prevents collisions
- Project isolation via subdirectories

### FakeLLM Response Selection

The FakeLLM selects responses based on keywords in the prompt:
- "introduction", "intro", "opening" → Introduction help response
- "citation", "reference", "bibliography" → Citation analysis response  
- "summary", "summarize", "abstract" → Summary response
- Default → General help response

---

## Environment Variables

### Backend (.env or docker-compose)
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/manuscript
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
STORAGE_PATH=/app/storage
```

### Frontend (vite.config.ts proxy)
```typescript
proxy: {
  '/api': {
    target: 'http://backend:8000',
    changeOrigin: true,
  },
  '/api/chat/ws': {
    target: 'ws://backend:8000',
    ws: true,
  },
}
```

---

## Testing Credentials

After running the seeder (automatically on app startup):

| Email                  | Password | Role  |
|------------------------|----------|-------|
| admin@manuscript.local | admin123 | Admin |

Create additional users via the register endpoint or admin UI.

---

## Common Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Run migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Access PostgreSQL
docker-compose exec db psql -U postgres -d manuscript

# Rebuild after changes
docker-compose up -d --build

# Frontend only (for faster dev iteration)
cd frontend && npm run dev
```

---

## Verification Checklist

After completing all steps, verify:

### Authentication
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Token persists across page refresh
- [ ] Logout clears token and redirects

### Authorization
- [ ] Admin sees all projects
- [ ] Writer sees only assigned projects
- [ ] Statistician has read-only access
- [ ] Non-admin cannot create projects

### Projects
- [ ] Admin can create/edit/delete projects
- [ ] Admin can assign team members
- [ ] Project list shows correct status badges
- [ ] Search and filter work

### Workspace
- [ ] File tree shows uploaded files
- [ ] Markdown viewer renders content
- [ ] AI chat sends and receives messages
- [ ] Streaming shows word-by-word response
- [ ] File context is passed to chat

### UI/UX
- [ ] Dark theme matches screenshots
- [ ] Responsive on different screen sizes
- [ ] Loading states show spinners
- [ ] Error messages display properly

---

## Troubleshooting

### "Connection refused" on frontend
- Check backend is running: `docker-compose ps`
- Verify proxy config in vite.config.ts

### Database migration errors
- Reset database: `docker-compose down -v && docker-compose up -d`
- Check migration files for conflicts

### WebSocket not connecting
- Verify token is being passed in query string
- Check WebSocket proxy config in vite.config.ts
- Look at browser console for connection errors

### Styles not applying
- Verify Tailwind is processing files in content array
- Check custom colors are defined in tailwind.config.js
- Clear browser cache

---

## Notes for Production (Future)

These would be needed for a real deployment but are **out of scope for this demo**:

1. Replace LocalStorage with S3Storage
2. Replace FakeLLM with ClaudeLLM (Anthropic API)
3. Add real Atlassian OAuth integration
4. Implement proper Obsidian sync protocol
5. Add email verification and password reset
6. Set up proper logging and monitoring
7. Configure HTTPS and secure cookies
8. Add rate limiting and request validation
9. Implement proper error tracking (Sentry)
10. Set up CI/CD pipeline

---

## Quick Reference

| What         | Where                           |
|--------------|---------------------------------|
| API base URL | http://localhost:8000/api       |
| Frontend URL | http://localhost:5173           |
| PostgreSQL   | localhost:5432                  |
| WebSocket    | ws://localhost:8000/api/chat/ws |
| File storage | backend:/app/storage            |
| Migrations   | backend/alembic/versions        |
| API docs     | http://localhost:8000/docs      |

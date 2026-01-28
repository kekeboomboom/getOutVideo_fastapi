# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack FastAPI application template with:
- **Backend**: FastAPI (Python 3.10+) with SQLModel ORM, PostgreSQL database, Alembic migrations
- **Frontend**: React + TypeScript with Vite, TanStack Query/Router, Tailwind CSS, shadcn/ui
- **Infrastructure**: Docker Compose orchestration with Traefik reverse proxy
- **Authentication**: JWT-based auth with password recovery
- **Testing**: Pytest (backend), Playwright (frontend E2E)

## Essential Commands

### Development Environment

Start all services with Docker Compose (recommended):
```bash
docker compose watch
```

Stop specific service:
```bash
docker compose stop backend  # or frontend
```

### Backend Development

From `backend/` directory:

Install dependencies:
```bash
uv sync
```

Activate virtual environment:
```bash
source .venv/bin/activate
```

Run local development server (without Docker):
```bash
cd backend
fastapi dev app/main.py
```

Run tests:
```bash
bash ./scripts/test.sh
```

Run tests inside running container:
```bash
docker compose exec backend bash scripts/tests-start.sh
```

Run tests with specific pytest options (e.g., stop on first error):
```bash
docker compose exec backend bash scripts/tests-start.sh -x
```

Linting and formatting:
```bash
uv run ruff check --fix
uv run ruff format
```

Type checking:
```bash
uv run mypy .
```

### Frontend Development

From `frontend/` directory:

Install dependencies:
```bash
bun install  # or npm install
```

Run local development server (without Docker):
```bash
bun run dev
```

Generate API client from OpenAPI schema:
```bash
bash ./scripts/generate-client.sh  # from project root
# OR manually:
bun run generate-client  # after downloading openapi.json to frontend/
```

Run E2E tests (requires backend running):
```bash
docker compose up -d --wait backend
bunx playwright test
bunx playwright test --ui  # UI mode
docker compose down -v  # cleanup after tests
```

Frontend linting (Biome):
```bash
npm run lint
```

### Database Migrations

From inside backend container:
```bash
docker compose exec backend bash
alembic revision --autogenerate -m "Description of change"
alembic upgrade head
```

### Pre-commit Hooks

Install prek hooks (from `backend/` directory):
```bash
uv run prek install -f
```

Run hooks manually:
```bash
uv run prek run --all-files
```

## Architecture

### Backend Structure

- **Entry point**: `backend/app/main.py` - FastAPI app initialization, CORS, Sentry integration
- **API routes**: `backend/app/api/routes/` - Organized by resource (users, items, login, utils, private)
- **Route aggregation**: `backend/app/api/main.py` - Includes all route modules into `api_router` with `/api/v1` prefix
- **Models**: `backend/app/models.py` - SQLModel models (User, Item) with Base/Create/Update/Public variants
- **CRUD operations**: `backend/app/crud.py` - Database operations layer
- **Configuration**: `backend/app/core/config.py` - Pydantic Settings reading from `../.env`
- **Database setup**: `backend/app/core/db.py` - SQLModel engine and session management
- **Dependencies**: `backend/app/api/deps.py` - FastAPI dependencies (DB sessions, current user)
- **Utilities**: `backend/app/utils.py` - Email sending, password hashing, token generation
- **Migrations**: `backend/app/alembic/` - Alembic migration files
- **Tests**: `backend/tests/` - Pytest test suite with fixtures

The backend uses a prestart service (`scripts/prestart.sh`) that runs Alembic migrations and creates the first superuser before the main backend service starts.

### Frontend Structure

- **Entry point**: `frontend/src/main.tsx` - React app bootstrap with TanStack Router
- **Routes**: `frontend/src/routes/` - File-based routing (TanStack Router convention)
  - `__root.tsx` - Root layout wrapper
  - `_layout.tsx` - Authenticated layout
  - `_layout/` - Authenticated pages (admin, items, settings, etc.)
  - Public routes: `login.tsx`, `signup.tsx`, `recover-password.tsx`, `reset-password.tsx`
- **Components**: `frontend/src/components/` - Organized by feature (Admin, Items, UserSettings, Common)
- **Generated API Client**: `frontend/src/client/` - Auto-generated from OpenAPI (do not edit manually)
- **UI Components**: `frontend/src/components/ui/` - shadcn/ui components
- **Hooks**: `frontend/src/hooks/` - Custom React hooks (auth, toast, clipboard, mobile detection)
- **Sidebar**: `frontend/src/components/Sidebar/` - App navigation sidebar

### Configuration Files

- **Root `.env`**: Contains all environment variables for both frontend and backend
- **`compose.yml`**: Production-like services (db, adminer, prestart, backend, frontend)
- **`compose.override.yml`**: Development overrides (volume mounts, hot reload, local Traefik, mailcatcher)

### Key Design Patterns

1. **Model Separation**: Each entity has Base/Create/Update/Public variants to separate concerns
   - Base: Shared properties
   - Create: API input on creation
   - Update: API input on updates (all optional)
   - Public: API response (includes id, created_at)
   - Database model: Actual SQLModel table with relationships

2. **API Route Structure**: Each route module defines a router with tags, then includes it in `api/main.py`

3. **Authentication Flow**:
   - JWT tokens with configurable expiration (8 days default)
   - Current user dependency in `api/deps.py` extracts user from token
   - Password recovery via email with time-limited tokens

4. **Frontend Client Generation**: OpenAPI schema → TypeScript client via `@hey-api/openapi-ts`
   - Happens automatically in pre-commit hook when backend changes
   - Manual trigger: `bash ./scripts/generate-client.sh`

5. **Private API Routes**: `api/routes/private.py` only included when `ENVIRONMENT=local`
   - Used for testing utilities (e.g., sending test emails)

## Environment Variables

Critical variables in `.env` (must be changed for production):
- `SECRET_KEY` - JWT signing (generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- `FIRST_SUPERUSER_PASSWORD` - Initial admin password
- `POSTGRES_PASSWORD` - Database password
- `DOMAIN` - Base domain for Traefik routing (use `localhost.tiangolo.com` to test subdomain routing locally)

## Service URLs (Development)

With `DOMAIN=localhost`:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Adminer: http://localhost:8080
- Traefik UI: http://localhost:8090
- MailCatcher: http://localhost:1080

With `DOMAIN=localhost.tiangolo.com`:
- Frontend: http://dashboard.localhost.tiangolo.com
- Backend API: http://api.localhost.tiangolo.com

## Testing

Backend tests use pytest with database fixtures. Coverage report generated in `htmlcov/index.html`.

Frontend E2E tests use Playwright with utilities in `frontend/tests/utils/` for:
- Mailcatcher integration (email verification)
- Random data generation
- Private API calls (user creation)
- Auth setup (stored state for authenticated tests)

## Code Quality

Pre-commit hooks run automatically before commits:
- Ruff (Python linting and formatting)
- Biome (Frontend linting)
- OpenAPI client generation (when backend changes)
- File checks (large files, YAML/TOML validation, EOF/whitespace fixes)

Ruff configuration in `backend/pyproject.toml` enforces:
- No print statements (T201)
- No unused arguments (ARG001)
- Comprehensions and modern Python patterns
- Import sorting
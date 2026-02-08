# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack application with:
- **Backend**: FastAPI (Python 3.10+) with SQLModel ORM, PostgreSQL database, Alembic migrations
- **Frontend**: Next.js 14 (TypeScript) with Clerk auth, Drizzle ORM, Tailwind CSS, Stripe
- **Infrastructure**: Docker Compose orchestration (backend + frontend), Nginx reverse proxy, Cloudflare
- **Authentication**: JWT-based auth (backend), Clerk (frontend)
- **Testing**: Pytest (backend), Vitest + Playwright (frontend)

## Essential Commands

### Development Environment

Start all services with Docker Compose (recommended):
```bash
docker compose watch
```

Stop specific service:
```bash
docker compose stop backend
docker compose stop frontend
```

Build and run production stack (backend + frontend):
```bash
docker compose -f compose.yml build
docker compose -f compose.yml up -d
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
- **Migrations**: `backend/app/alembic/` - Alembic migration files
- **Tests**: `backend/tests/` - Pytest test suite with fixtures

The backend uses a prestart service (`scripts/prestart.sh`) that runs Alembic migrations and creates the first superuser before the main backend service starts.

### Frontend Structure

- **Entry point**: `frontend/src/app/layout.tsx` - Root layout
- **Pages**: `frontend/src/app/[locale]/` - Internationalized routes (App Router)
- **API routes**: `frontend/src/app/api/` - Next.js API routes (health, youtube-captions)
- **Components**: `frontend/src/components/` - Reusable UI components
- **Features**: `frontend/src/features/` - Feature-specific components
- **Config**: `frontend/src/libs/Env.ts` - Environment variable validation (Zod + T3 Env)
- **Database**: `frontend/src/models/Schema.ts` - Drizzle ORM schema
- **Dockerfile**: `frontend/Dockerfile` - Multi-stage production build

### Configuration Files

- **Root `.env`**: Contains environment variables for both backend and frontend
- **`compose.yml`**: Production services (prestart, backend, frontend)
- **`compose.override.yml`**: Development overrides (volume mounts, hot reload, local Traefik)

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

4. **Private API Routes**: `api/routes/private.py` only included when `ENVIRONMENT=local`

## Environment Variables

Critical variables in `.env` (must be changed for production):
- `SECRET_KEY` - JWT signing (generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- `FIRST_SUPERUSER_PASSWORD` - Initial admin password
- `POSTGRES_PASSWORD` - Database password
- `DOMAIN` - Base domain for Traefik routing (use `localhost.tiangolo.com` to test subdomain routing locally)

## Deployment

Production deployment docs: [deployment.md](./deployment.md)

Key points:
- Both backend and frontend run as Docker containers via `compose.yml`
- Nginx reverse-proxies `getoutvideo.keboom.ac` → frontend (port 3000) and `api-getoutvideo.keboom.ac` → backend (port 8000)
- `NEXT_PUBLIC_*` variables are baked into the frontend at Docker build time via build args
- CI/CD via GitHub Actions self-hosted runner (push to `master` triggers deploy)

## Service URLs (Development)

With `DOMAIN=localhost`:
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000
- Adminer: http://localhost:8080
- Traefik UI: http://localhost:8090

With `DOMAIN=localhost.tiangolo.com`:
- Backend API: http://api.localhost.tiangolo.com

## Service URLs (Production)

- Frontend: https://getoutvideo.keboom.ac
- Backend API: https://api-getoutvideo.keboom.ac
- Backend API docs: https://api-getoutvideo.keboom.ac/docs

## Testing

Backend tests use pytest with database fixtures. Coverage report generated in `htmlcov/index.html`.

## Code Quality

Pre-commit hooks run automatically before commits:
- Ruff (Python linting and formatting)
- File checks (large files, YAML/TOML validation, EOF/whitespace fixes)

Ruff configuration in `backend/pyproject.toml` enforces:
- No print statements (T201)
- No unused arguments (ARG001)
- Comprehensions and modern Python patterns
- Import sorting

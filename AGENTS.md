# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: FastAPI app, SQLModel models, Alembic migrations, and Pytest tests (`backend/tests/`).
- `frontend/`: Next.js app (TypeScript, App Router), UI components, and API routes.
- `scripts/`: helper scripts (test helpers).
- `compose.yml` + `compose.override.yml`: Docker Compose stack for local and production-like workflows.
- `doc/`: implementation and migration documentation.
- `img/`: documentation screenshots.

## Build, Test, and Development Commands
- `docker compose watch`: start the full local stack (backend, frontend).
- `docker compose logs [service]`: view service logs (e.g., `backend`, `frontend`).
- Backend (from `backend/`):
  - `uv sync`: install Python deps.
  - `fastapi dev app/main.py`: run backend locally without Docker.
  - `bash ./scripts/test.sh`: run backend tests.
  - `uv run ruff check --fix`: lint.
  - `uv run ruff format`: format.
- Frontend (from `frontend/`):
  - `npm install`: install Node deps.
  - `npm run dev`: run Next.js dev server.
  - `npm run lint`: lint.
  - `npm run test`: run Vitest.
  - `npm run test:e2e`: run Playwright.

## Coding Style & Naming Conventions
- Python: 4-space indentation, type hints, `ruff` + `ruff-format` via `uv run ruff check --fix` and `uv run ruff format`.
- Frontend: TypeScript/Next.js; use `npm run lint`.

## Testing Guidelines
- Backend: Pytest in `backend/tests/` (run via `bash ./scripts/test.sh`). Coverage HTML output is under `backend/htmlcov/`.
- Frontend: Vitest (`npm run test`) and Playwright (`npm run test:e2e`).

## Commit & Pull Request Guidelines
- Commit messages in this repo are descriptive, sentence-case statements (not strict Conventional Commits).
- PRs should include: a short summary and testing performed (commands + results).

## Security & Configuration Tips
- Update secrets in `.env` (`SECRET_KEY`, `FIRST_SUPERUSER_PASSWORD`, `POSTGRES_PASSWORD`, `OPENAI_API_KEY`).
- After changing `.env`, restart `docker compose watch`.

## Agent-Specific Notes
- See `CLAUDE.md` for a fuller command reference and architecture map.

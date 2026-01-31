# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: FastAPI app, SQLModel models, Alembic migrations, and Pytest tests (`backend/tests/`).
- `frontend/`: React + TypeScript app (Vite) with UI components and generated API client (`frontend/src/client/`).
- `scripts/`: helper scripts (e.g., `generate-client.sh`, test helpers).
- `compose.yml` + `compose.override.yml`: Docker Compose stack for local and production-like workflows.
- `img/`: documentation screenshots.

## Build, Test, and Development Commands
- `docker compose watch`: start the full local stack (backend, frontend, db, mailcatcher).
- `docker compose logs [service]`: view service logs (e.g., `backend`).
- Backend (from `backend/`):
  - `uv sync`: install Python deps.
  - `fastapi dev app/main.py`: run backend locally without Docker.
  - `bash ./scripts/test.sh`: run backend tests.
- Frontend (from `frontend/`):
  - `bun install` then `bun run dev`: run Vite dev server.
  - `bun run build`: typecheck and build production assets.
  - `bun run test` / `bun run test:ui`: Playwright E2E tests.

## Coding Style & Naming Conventions
- Python: 4-space indentation, type hints, `ruff` + `ruff-format` via `uv run ruff check --fix` and `uv run ruff format`.
- Frontend: Biome for formatting/linting via `bun run lint`.
- Generated client lives in `frontend/src/client/`—do not edit manually.

## Testing Guidelines
- Backend: Pytest in `backend/tests/` (run via `bash ./scripts/test.sh`). Coverage HTML output is under `backend/htmlcov/`.
- Frontend: Playwright tests (requires backend running). Example:
  - `docker compose up -d --wait backend`
  - `bunx playwright test`

## Commit & Pull Request Guidelines
- Commit messages in this repo are descriptive, sentence-case statements (not strict Conventional Commits).
- PRs should include: a short summary, testing performed (commands + results), and any relevant screenshots for UI changes.

## Security & Configuration Tips
- Update secrets in `.env` (`SECRET_KEY`, `FIRST_SUPERUSER_PASSWORD`, `POSTGRES_PASSWORD`).
- For local subdomain routing, set `DOMAIN=localhost.tiangolo.com` and restart `docker compose watch`.

## Agent-Specific Notes
- See `CLAUDE.md` for a fuller command reference and architecture map.

# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: FastAPI app, SQLModel models, Alembic migrations, and Pytest tests (`backend/tests/`).
- `scripts/`: helper scripts (test helpers).
- `compose.yml` + `compose.override.yml`: Docker Compose stack for local and production-like workflows.
- `img/`: documentation screenshots.

## Build, Test, and Development Commands
- `docker compose watch`: start the full local stack (backend, db).
- `docker compose logs [service]`: view service logs (e.g., `backend`).
- Backend (from `backend/`):
  - `uv sync`: install Python deps.
  - `fastapi dev app/main.py`: run backend locally without Docker.
  - `bash ./scripts/test.sh`: run backend tests.

## Coding Style & Naming Conventions
- Python: 4-space indentation, type hints, `ruff` + `ruff-format` via `uv run ruff check --fix` and `uv run ruff format`.

## Testing Guidelines
- Backend: Pytest in `backend/tests/` (run via `bash ./scripts/test.sh`). Coverage HTML output is under `backend/htmlcov/`.

## Commit & Pull Request Guidelines
- Commit messages in this repo are descriptive, sentence-case statements (not strict Conventional Commits).
- PRs should include: a short summary and testing performed (commands + results).

## Security & Configuration Tips
- Update secrets in `.env` (`SECRET_KEY`, `FIRST_SUPERUSER_PASSWORD`, `POSTGRES_PASSWORD`).
- For local subdomain routing, set `DOMAIN=localhost.tiangolo.com` and restart `docker compose watch`.

## Agent-Specific Notes
- See `CLAUDE.md` for a fuller command reference and architecture map.

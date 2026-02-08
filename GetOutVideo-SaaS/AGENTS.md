# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router pages and API routes (localized routes live under `src/app/[locale]/`).
- `src/components/`: shared UI components (base UI in `src/components/ui/`).
- `src/features/`: feature-level composition and domain modules.
- `src/libs/`: core services (env validation, logging, i18n, DB helpers).
- `src/models/Schema.ts`: Drizzle ORM schema definitions.
- `src/templates/`, `src/styles/`, `src/utils/`, `src/hooks/`, `src/types/`: supporting app layers.
- `public/`: static assets; `migrations/`: generated Drizzle migrations; `tests/`: E2E and integration tests.

## Build, Test, and Development Commands
- `npm run dev`: start local dev (Spotlight sidecar + Next dev server).
- `npm run build` / `npm run start`: build and run production bundle.
- `npm run lint` / `npm run lint:fix`: ESLint checks and autofixes.
- `npm run check-types`: strict TypeScript checks (no emit).
- `npm test`: run unit tests with Vitest.
- `npm run test:e2e`: run Playwright E2E tests.
- `npm run db:generate`, `npm run db:migrate`, `npm run db:studio`: manage Drizzle migrations and DB studio.
- `npm run storybook`: component dev environment.

## Coding Style & Naming Conventions
- TypeScript-first, strict settings; use `type` instead of `interface`.
- 2-space indentation, semicolons enforced by ESLint.
- Import ordering is enforced via `simple-import-sort`.
- Components use `PascalCase` filenames; hooks follow `useX` naming.
- Prefer path aliases: `@/` maps to `src/` (see `tsconfig.json`).

## Testing Guidelines
- Unit tests: Vitest + React Testing Library, name as `*.test.ts(x)`.
- E2E tests: Playwright under `tests/e2e/`, name as `*.e2e.ts`.
- Checkly monitors `*.check.e2e.ts` tests for deployed environments.
- Add tests for new UI flows and critical API behavior; keep failures actionable.

## Commit & Pull Request Guidelines
- Conventional Commits are enforced (examples in history: `feat:`, `fix:`, `chore:`, `docs:`, `ci:`). Use `npm run commit` for Commitizen prompts.
- Husky runs `lint-staged` and `commitlint`; ensure lint and type checks pass before pushing.
- PRs should include a clear summary, linked issues, and test results; add screenshots for UI changes.

## Configuration & Secrets
- Environment variables are validated in `src/libs/Env.ts`; keep `.env` and `.env.production` local and never commit real secrets.
- Database schema changes should update `src/models/Schema.ts` and regenerate migrations.

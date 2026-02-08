# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SaaS project for parsing and summarizing video content, particularly YouTube videos. Users can extract captions from YouTube videos and get text summaries instead of watching lengthy content (interviews, tutorials, etc.).

Built on Next.js 14 SaaS boilerplate with modern web development stack including:
- Next.js 14 with App Router
- TypeScript with strict configuration
- Drizzle ORM with PostgreSQL
- Clerk authentication
- Tailwind CSS + Radix UI components
- Stripe integration for billing
- Next-intl for internationalization

## Development Commands

### Core Development
- `npm run dev` - Start development server with Spotlight sidecar
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run clean` - Clean build artifacts

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix auto-fixable lint issues
- `npm run check-types` - TypeScript type checking
- `npm test` - Run unit tests with Vitest
- `npm run test:e2e` - Run Playwright end-to-end tests

### Database Operations
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Apply migrations to production DB
- `npm run db:studio` - Open Drizzle Studio

### Storybook
- `npm run storybook` - Start Storybook dev server
- `npm run storybook:build` - Build Storybook
- `npm run serve-storybook` - Build and serve Storybook

## Project Architecture

### Directory Structure
- `src/app/` - Next.js App Router pages and API routes
  - `[locale]/` - Internationalized routes
  - `api/youtube-captions/` - YouTube caption extraction API
- `src/components/` - Reusable UI components
  - `ui/` - Base UI components (buttons, forms, tables)
  - `YouTubeCaptionExtractor.tsx` - Main feature component
- `src/features/` - Feature-specific components grouped by domain
- `src/libs/` - Core utilities (DB, Env, Logger, i18n)
- `src/models/Schema.ts` - Drizzle database schema definitions
- `src/utils/` - Helper functions and app configuration

### Key Features
- **YouTube Caption Extraction**: Extract and format video captions as markdown
- **Multi-tenant Authentication**: Clerk-based auth with organization support
- **Database Schema**: Organizations and todos tables with Stripe integration
- **Internationalization**: Support for English and Chinese locales

### Configuration Files
- `drizzle.config.ts` - Database configuration
- `next.config.mjs` - Next.js config with Sentry, bundle analyzer, and intl
- `src/libs/Env.ts` - Environment variable validation with Zod
- TypeScript path aliases: `@/*` maps to `src/*`

### Environment Variables
Required environment variables are validated in `src/libs/Env.ts`:
- Clerk authentication keys
- Stripe keys and webhook secret
- Database URL (optional for development)
- Logging and monitoring tokens

### Database Schema
Located in `src/models/Schema.ts`:
- `organizationSchema` - Organizations with Stripe subscription data
- `todoSchema` - User todos with ownership tracking

### Testing Strategy
- Unit tests: Vitest with React Testing Library
- E2E tests: Playwright
- Storybook for component documentation
- Type checking enforced with strict TypeScript config

### Development Workflow
1. Database changes: Update `Schema.ts` → run `npm run db:generate`
2. Migrations are auto-applied on next DB interaction
3. Use `npm run check-types` before committing
4. Conventional commits enforced with Commitizen

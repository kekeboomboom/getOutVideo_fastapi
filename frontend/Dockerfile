# syntax=docker/dockerfile:1.7

# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --prefer-offline

# ---- Stage 2: Build the application ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for NEXT_PUBLIC_* variables (baked into the client bundle at build time)
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_VIDEO_API_BASE
ARG SKIP_ENV_VALIDATION=
ARG LOGTAIL_SOURCE_TOKEN=
ARG NEXT_DISABLE_ESLINT=0
ARG NEXT_DISABLE_TYPECHECK=0
ARG NODE_OPTIONS=--max-old-space-size=1024

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_VIDEO_API_BASE=$NEXT_PUBLIC_VIDEO_API_BASE
ENV SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION
ENV LOGTAIL_SOURCE_TOKEN=$LOGTAIL_SOURCE_TOKEN
ENV NEXT_DISABLE_ESLINT=$NEXT_DISABLE_ESLINT
ENV NEXT_DISABLE_TYPECHECK=$NEXT_DISABLE_TYPECHECK
ENV NODE_OPTIONS=$NODE_OPTIONS

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ---- Stage 3: Production runner ----
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

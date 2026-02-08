# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: Build the application ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for NEXT_PUBLIC_* variables (baked into the client bundle at build time)
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_VIDEO_API_BASE
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live
ARG NEXT_PUBLIC_SENTRY_DSN=

# Server-side variables required by the build validation (src/libs/Env.ts)
ARG CLERK_SECRET_KEY
ARG STRIPE_SECRET_KEY=placeholder_replaced_at_runtime
ARG STRIPE_WEBHOOK_SECRET=placeholder_replaced_at_runtime
ARG BILLING_PLAN_ENV=prod

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_VIDEO_API_BASE=$NEXT_PUBLIC_VIDEO_API_BASE
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
ENV BILLING_PLAN_ENV=$BILLING_PLAN_ENV

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ---- Stage 3: Production runner ----
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# next-intl plugin config referenced from next.config.mjs
COPY --from=builder /app/src/libs/i18n.ts ./src/libs/i18n.ts
COPY --from=builder /app/src/libs/Env.ts ./src/libs/Env.ts

# Copy migration files (needed if migrations run at startup)
COPY --from=builder /app/migrations ./migrations

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]

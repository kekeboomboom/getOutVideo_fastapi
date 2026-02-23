# Production Deployment (Docker Compose + Nginx + Cloudflare, Single Domain)

This guide covers production deployment of **both the backend (FastAPI) and frontend (Next.js)** using Docker Compose, behind Nginx + Cloudflare, with a **single public frontend domain**.

It is tailored to `getoutvideo.keboom.ac` on a single Lightsail instance.

## Architecture

```
Internet
  │
  ▼
Cloudflare (DNS + CDN + TLS termination to origin)
  │
  └── getoutvideo.keboom.ac  ──► Nginx ──► 127.0.0.1:3000 (frontend)

Docker Compose Stack:
  ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ prestart │──►│ backend  │◄──│ frontend │
  │ (migrate)│   │ :8000    │   │ :3000    │
  └──────────┘   └──────────┘   └──────────┘
        │                   │
        ▼                   ▼
Supabase PostgreSQL   Next.js rewrites /api/v1/* to http://backend:8000
```

> **Frontend API routing note**: The frontend issues requests to `/api/v1/...` on
> `getoutvideo.keboom.ac`. Next.js rewrites those requests to the backend container
> using `NEXT_PUBLIC_VIDEO_API_BASE` (default: `http://backend:8000` in `compose.yml`).

## Preparation

* **Lightsail**: assign a static IP to the instance.
* **Lightsail firewall**: open ports **22**, **80**, **443**.
* **DNS**: create one A record pointing to your static IP:
  * `getoutvideo.keboom.ac` → static IP (frontend)
* **Docker** and **Docker Compose** are already installed on the server.

## Database Connectivity (Supabase + GitHub Actions, IPv4)

GitHub Actions runners are IPv4-only. Supabase direct connections are IPv6 by default,
so use the Supabase pooler connection string (Session or Transaction pooler) or enable
the Supabase IPv4 add-on if you must use direct connections.

For the pooler, set:

* `POSTGRES_SERVER` to the pooler host, e.g. `aws-1-ap-southeast-1.pooler.supabase.com`
* `POSTGRES_USER` to `postgres.<project-ref>` (the pooler username)
* `POSTGRES_PORT=5432`, `POSTGRES_DB=postgres`, `POSTGRES_PASSWORD` as provided by Supabase

IPv6 is disabled on the default Compose network in `compose.yml`, so no host IPv6 setup is required.

## Docker Compose Services

The `compose.yml` defines three services:

| Service    | Image / Dockerfile          | Port             | Description                                      |
|------------|-----------------------------|------------------|--------------------------------------------------|
| `prestart` | `backend/Dockerfile`        | none             | Runs Alembic migrations + creates superuser      |
| `backend`  | `backend/Dockerfile`        | `127.0.0.1:8000` | FastAPI application server                       |
| `frontend` | `frontend/Dockerfile`       | `127.0.0.1:3000` | Next.js production server                        |

Startup order: `prestart` → `backend` (waits for prestart) → `frontend` (waits for backend health check).

### Frontend Docker Build

The frontend uses a **multi-stage Docker build** (`frontend/Dockerfile`):

1. **deps** -- Installs npm dependencies (cached layer).
2. **builder** -- Copies source and runs `npm run build`. `NEXT_PUBLIC_*` variables are passed as
   build args because they are baked into the client-side JavaScript bundle at build time. This
   includes `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_VIDEO_API_BASE`, and
   `NEXT_PUBLIC_CLERK_SIGN_IN_URL`.
3. **runner** -- Minimal production image. Copies built `.next/`, `node_modules/`, and `public/`.

> **Important**: `NEXT_PUBLIC_*` environment variables must be provided at **build time** via
> Docker build args. They cannot be changed at runtime because Next.js inlines them into the
> client bundle during `next build`.
>
> **Important**: Set `NEXT_PUBLIC_VIDEO_API_BASE` at build time so the Next.js rewrite
> for `/api/v1/...` is generated correctly. For single-domain deployments, a good value
> is `http://backend:8000` (container-to-container traffic on the Compose network).
>
> **Compose note**: `compose.yml` already passes `NEXT_PUBLIC_APP_URL` and
> `NEXT_PUBLIC_VIDEO_API_BASE` as build args. If `NEXT_PUBLIC_VIDEO_API_BASE` is not set,
> it defaults to `http://backend:8000`.

## Reverse Proxy (Nginx + Cloudflare)

Docker Compose exposes services **only on localhost**:

* Frontend: `127.0.0.1:3000`
* Backend API: `127.0.0.1:8000`

Nginx terminates TLS (using Cloudflare Origin Cert or Let's Encrypt) and proxies only the
frontend service. The backend stays private and is consumed internally by the frontend container.

> **No extra `/api/v1` Nginx route is required**: Next.js rewrites `/api/v1/...` to
> `NEXT_PUBLIC_VIDEO_API_BASE` and forwards the request server-side.

### Nginx Configuration

```nginx
# ---- Frontend: getoutvideo.keboom.ac ----

server {
  listen 80;
  server_name getoutvideo.keboom.ac;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name getoutvideo.keboom.ac;

  ssl_certificate     /etc/ssl/certs/origin.pem;
  ssl_certificate_key /etc/ssl/private/origin.key;

  # Allow larger request bodies (file uploads, etc.)
  client_max_body_size 10M;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}

```

Save this as `/etc/nginx/sites-available/getoutvideo` and symlink to `sites-enabled/`:

```bash
sudo ln -s /etc/nginx/sites-available/getoutvideo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Required Environment Variables

### Backend Secrets (GitHub Actions repository secrets)

| Secret                       | Example / Notes                                           |
|------------------------------|-----------------------------------------------------------|
| `DOMAIN_PRODUCTION`          | `getoutvideo.keboom.ac`                                    |
| `STACK_NAME_PRODUCTION`      | `getoutvideo-keboom-ac`                                    |
| `BACKEND_CORS_ORIGINS`       | `https://getoutvideo.keboom.ac`                           |
| `SECRET_KEY`                 | Generate: `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `FIRST_SUPERUSER`            | Email, e.g. `admin@example.com`                            |
| `FIRST_SUPERUSER_PASSWORD`   | Strong password                                            |
| `POSTGRES_SERVER`            | Supabase pooler host                                       |
| `POSTGRES_PORT`              | `5432`                                                     |
| `POSTGRES_DB`                | `postgres`                                                 |
| `POSTGRES_USER`              | `postgres.<project-ref>`                                   |
| `POSTGRES_PASSWORD`          | From Supabase                                              |
| `DOCKER_IMAGE_BACKEND`       | `backend`                                                  |

### Frontend Secrets (GitHub Actions repository secrets)

| Secret                              | Example / Notes                          |
|-------------------------------------|------------------------------------------|
| `DOCKER_IMAGE_FRONTEND`             | `frontend`                                |
| `NEXT_PUBLIC_APP_URL`               | `https://getoutvideo.keboom.ac`           |
| `NEXT_PUBLIC_VIDEO_API_BASE`        | Optional. For single-domain use `http://backend:8000` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk Dashboard                      |
| `CLERK_SECRET_KEY`                  | From Clerk Dashboard                      |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`     | Usually `/sign-in`                        |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`| From Stripe Dashboard (live key)          |
| `STRIPE_SECRET_KEY`                 | From Stripe Dashboard                     |
| `STRIPE_WEBHOOK_SECRET`             | From Stripe webhook setup                 |
| `DATABASE_URL`                      | `postgresql://user:pass@host:5432/db`     |

> These frontend values are used as **build args** for the Docker image. In this repository,
> `NEXT_PUBLIC_VIDEO_API_BASE` defaults to `http://backend:8000` if not provided.

### Optional Secrets

| Secret              | Notes                                     |
|---------------------|-------------------------------------------|
| `SMTP_HOST`         | For email sending                          |
| `SMTP_USER`         | SMTP username                              |
| `SMTP_PASSWORD`     | SMTP password                              |
| `EMAILS_FROM_EMAIL` | From address                               |
| `SENTRY_DSN`        | Backend error monitoring                   |
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend error monitoring             |
| `SENTRY_AUTH_TOKEN`  | Source map uploads                         |
| `LOGTAIL_SOURCE_TOKEN` | Frontend logging (Better Stack)         |

### Generate Secret Keys

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Run once for `SECRET_KEY` and again for `FIRST_SUPERUSER_PASSWORD` (or use a password manager).

## Deploy Manually (One-off)

If you want a one-off deploy before CI/CD is set up:

```bash
# Sync code to server
rsync -av --filter=":- .gitignore" ./ root@your-server:/root/code/app/

# SSH into the server
ssh root@your-server
cd /root/code/app/

# Build and start all services (backend + frontend)
docker compose -f compose.yml build
docker compose -f compose.yml up -d

# Check that services are running
docker compose -f compose.yml ps
docker compose -f compose.yml logs frontend --tail 50
docker compose -f compose.yml logs backend --tail 50
```

## Continuous Deployment (GitHub Actions)

### 1) Install a self-hosted runner on the Lightsail server

```bash
sudo adduser github
sudo usermod -aG docker github
sudo su - github
```

Follow the official guide to add a **self-hosted runner** to this repository.
When asked for labels, add: `production`.

Install it as a service:

```bash
exit            # back to root
sudo su
cd /home/github/actions-runner
./svc.sh install github
./svc.sh start
./svc.sh status
```

### 2) Add repository secrets

Add all required backend + frontend secrets listed above in your GitHub repository settings
under **Settings > Secrets and variables > Actions**.

### 3) Deploy

Push to `master` and GitHub Actions will automatically:

1. Check out the code on the self-hosted runner.
2. Write a `.env` file from secrets.
3. Build both `backend` and `frontend` Docker images.
4. Start all services with `docker compose up -d`.

## Health Checks

Both services expose health check endpoints:

* **Backend**: `GET http://localhost:8000/api/v1/utils/health-check/`
* **Frontend**: `GET http://localhost:3000/api/health`

Docker Compose uses these to determine service health. The frontend waits for the backend
to be healthy before starting.

## URLs

| Service           | URL                                              |
|-------------------|--------------------------------------------------|
| Frontend          | `https://getoutvideo.keboom.ac`                   |
| Backend API (internal) | `http://backend:8000` (inside Compose network) |
| Backend API docs (internal) | `http://127.0.0.1:8000/docs` (on server host) |

## Troubleshooting

### Frontend build fails during Docker build

* Ensure all required `NEXT_PUBLIC_*` and server-side env vars are passed as build args.
* The Next.js build validates environment variables via `src/libs/Env.ts` using Zod.
  Missing required variables (e.g. `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
  will cause the build to fail.
* Check build logs: `docker compose -f compose.yml logs --no-color frontend`

### CORS errors from the frontend

* Ensure `BACKEND_CORS_ORIGINS` includes `https://getoutvideo.keboom.ac`.
* Format: comma-separated list of allowed origins (no trailing slashes).

### Frontend shows "502 Bad Gateway"

* Check if the frontend container is running: `docker compose ps`
* Check frontend logs: `docker compose logs frontend --tail 100`
* Verify Nginx is proxying to `127.0.0.1:3000`.

### Video extractor errors / 404 on `/api/v1/...`

* Verify `NEXT_PUBLIC_VIDEO_API_BASE` is set correctly **at build time** (single-domain
  default is `http://backend:8000`).
* Confirm the backend is reachable from the frontend container:
  `docker compose exec frontend wget -qO- http://backend:8000/api/v1/utils/health-check/`

### Database connection issues

* Verify `DATABASE_URL` is correctly formatted for the frontend (Drizzle ORM).
* Verify individual `POSTGRES_*` variables are correct for the backend (SQLModel).
* For Supabase: ensure you are using the pooler connection string (IPv4).

### Container startup order issues

* `prestart` must complete successfully before `backend` starts.
* `backend` must pass its health check before `frontend` starts.
* If `prestart` fails, check migration logs: `docker compose logs prestart`

# FastAPI Project - Production Deployment (Nginx + Cloudflare)

This guide is production-only and uses Docker Compose behind **your existing Nginx + Cloudflare**.
It is tailored to `getoutvideo.keboom.ac` and a single environment.

## Preparation

* Lightsail: assign a static IP to the instance.
* Lightsail firewall: open **22**, **80**, **443**.
* DNS: create A records:
  * `getoutvideo.keboom.ac` → your static IP
  * `api-getoutvideo.keboom.ac` → your static IP
* Docker is already installed on the server.

## Database Connectivity (Supabase + GitHub Actions, IPv4)

GitHub Actions runners are IPv4-only. Supabase direct connections are IPv6 by default,
so use the Supabase pooler connection string (Session or Transaction pooler) or enable
the Supabase IPv4 add-on if you must use direct connections.

For the pooler, set:

* `POSTGRES_SERVER` to the pooler host, e.g. `aws-1-ap-southeast-1.pooler.supabase.com`
* `POSTGRES_USER` to `postgres.<project-ref>` (the pooler username)
* `POSTGRES_PORT=5432`, `POSTGRES_DB=postgres`, `POSTGRES_PASSWORD` as provided by Supabase

IPv6 is disabled on the default Compose network in `compose.yml`, so no host IPv6 setup is required.

## Reverse Proxy (Nginx + Cloudflare)

Docker Compose will expose services **only on localhost**:

* Backend API: `127.0.0.1:8000`

Your Nginx will terminate TLS (using Cloudflare Origin Cert or Let’s Encrypt) and proxy:

* `api-getoutvideo.keboom.ac` → `http://127.0.0.1:8000`

### Example Nginx config

```nginx
server {
  listen 80;
  server_name api-getoutvideo.keboom.ac;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api-getoutvideo.keboom.ac;

  ssl_certificate     /etc/ssl/certs/origin.pem;
  ssl_certificate_key /etc/ssl/private/origin.key;

  location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Required Environment Variables

For production, set these as GitHub Actions **repository secrets**:

* `DOMAIN_PRODUCTION` = `getoutvideo.keboom.ac`
* `STACK_NAME_PRODUCTION` = e.g. `getoutvideo-keboom-ac`
* `BACKEND_CORS_ORIGINS` = `https://your-client.example.com`
* `SECRET_KEY` (generate a strong value)
* `FIRST_SUPERUSER` (email)
* `FIRST_SUPERUSER_PASSWORD`
* `POSTGRES_SERVER`
* `POSTGRES_PORT`
* `POSTGRES_DB`
* `POSTGRES_USER`
* `POSTGRES_PASSWORD`
* `DOCKER_IMAGE_BACKEND` = e.g. `backend`

Optional (only if you use them):

* `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAILS_FROM_EMAIL`
* `SENTRY_DSN`

### Generate secret keys

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Run it once for `SECRET_KEY` and again for `FIRST_SUPERUSER_PASSWORD` (or use a password manager).

## Deploy Manually (Optional)

If you want a one-off deploy before CI/CD:

```bash
rsync -av --filter=":- .gitignore" ./ root@your-server.example.com:/root/code/app/
ssh root@your-server.example.com
cd /root/code/app/
docker compose -f compose.yml build
docker compose -f compose.yml up -d
```

## Continuous Deployment (GitHub Actions, Production Only)

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
exit
sudo su
cd /home/github/actions-runner
./svc.sh install github
./svc.sh start
./svc.sh status
```

### 2) Add repository secrets

Add all the required secrets listed above.

### 3) Deploy

Push to `master` and GitHub Actions will deploy automatically.

## URLs

* Backend API docs: `https://api-getoutvideo.keboom.ac/docs`
* Backend API base: `https://api-getoutvideo.keboom.ac`

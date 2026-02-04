# FastAPI Project - Production Deployment (Nginx + Cloudflare)

This guide is production-only and uses Docker Compose behind **your existing Nginx + Cloudflare**.
It is tailored to `getoutvideo.keboom.ac` and a single environment.

## Preparation

* Lightsail: assign a static IP to the instance.
* Lightsail firewall: open **22**, **80**, **443**.
* DNS: create A records:
  * `getoutvideo.keboom.ac` → your static IP
  * `api.getoutvideo.keboom.ac` → your static IP
* Docker is already installed on the server.

## Reverse Proxy (Nginx + Cloudflare)

Docker Compose will expose services **only on localhost**:

* Frontend: `127.0.0.1:8080`
* Backend API: `127.0.0.1:8000`

Your Nginx will terminate TLS (using Cloudflare Origin Cert or Let’s Encrypt) and proxy:

* `getoutvideo.keboom.ac` → `http://127.0.0.1:8080`
* `api.getoutvideo.keboom.ac` → `http://127.0.0.1:8000`

### Example Nginx config

```nginx
server {
  listen 80;
  server_name getoutvideo.keboom.ac;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name getoutvideo.keboom.ac;

  # Use Cloudflare Origin Cert or Let's Encrypt certs here
  ssl_certificate     /etc/ssl/certs/origin.pem;
  ssl_certificate_key /etc/ssl/private/origin.key;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 80;
  server_name api.getoutvideo.keboom.ac;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.getoutvideo.keboom.ac;

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
* `FRONTEND_HOST` = `https://getoutvideo.keboom.ac`
* `BACKEND_CORS_ORIGINS` = `https://getoutvideo.keboom.ac`
* `SECRET_KEY` (generate a strong value)
* `FIRST_SUPERUSER` (email)
* `FIRST_SUPERUSER_PASSWORD`
* `POSTGRES_PASSWORD`

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

* Frontend: `https://getoutvideo.keboom.ac`
* Backend API docs: `https://api.getoutvideo.keboom.ac/docs`
* Backend API base: `https://api.getoutvideo.keboom.ac`

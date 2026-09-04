# Deployment guide (Coolify + Traefik on a VPS)

This guide deploys Winning Kart on a generic VPS (Hostinger / AWS EC2 / DigitalOcean) with
Coolify managing Traefik and automatic Let's Encrypt SSL. Postgres runs on the VPS host or
as a Coolify postgres resource.

## Architecture

One domain serves everything:

- `Host(<domain>) && PathPrefix(/api)` routes to the api container (Bun, port 3000).
- `Host(<domain>)` routes to the dashboard container (nginx, port 80) serving the built SPA.
- The dashboard's nginx also proxies `/api` and `/health` to the api via `API_UPSTREAM`
  (default `api:3000`), a fallback when the SPA is not configured with `VITE_API_URL`.
- The api service has a compose healthcheck hitting `/health`; the dashboard waits for it.

## Prerequisites

1. A VPS with at least 2 vCPU / 4 GB RAM and Docker installed.
2. Coolify installed on the VPS (docs at coolify.io) with its Traefik proxy running.
3. A DNS A record pointing your domain (for example `wk.example.com`) at the VPS IP.
4. Bun available on your operator machine (for migrations and key generation).

## Postgres 18 on the host

Neon runs PostgreSQL 18, and a custom-format dump made by pg_dump 18 restores only with
pg_restore 18 or newer — the distro's stock `postgresql` package is older. Install from PGDG:

```bash
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc
. /etc/os-release && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $VERSION_CODENAME-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
sudo apt update && sudo apt install -y postgresql-18
sudo -u postgres psql -c "CREATE ROLE winningkart WITH LOGIN PASSWORD 'STRONG_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE winningkart OWNER winningkart;"
```

Allow connections from Docker containers while keeping the port off the public internet
(firewall port 5432 externally):

```text
postgresql.conf:  listen_addresses = 'localhost,172.17.0.1'
pg_hba.conf:      host  winningkart  winningkart  172.17.0.0/16  scram-sha-256
```

Then `sudo systemctl restart postgresql`. The app connects as
`postgresql://winningkart:STRONG_PASSWORD@172.17.0.1:5432/winningkart` from inside containers.
`172.17.0.1` is the default Docker bridge gateway; adjust if your setup differs.

## Deploy as two Dockerfile apps (recommended)

Deploy the two applications as separate Coolify Dockerfile resources rather than one
compose stack. With Cloudflare proxying in front, compose-based deploys in Coolify
restart containers instead of recreating them, so the proxy keeps hitting a stale target
and you see 504s until you redeploy several times; per-app Dockerfile deploys do not
hit this.

Both Dockerfiles COPY from the repository root workspace, so set the build context to
`/` in each resource:

1. **api**: New Resource -> App -> Dockerfile. Dockerfile path `apps/api/Dockerfile`,
   build context `/`, port 3000, domain `https://<domain>/api`, health check path
   `/health`. Paste the environment from `.env.production.example` in the environment
   editor. Generate the secrets on your operator machine:

   ```bash
   bun -e "console.log(crypto.randomBytes(32).toString('hex'))"
   ```

   Use one output for `ENCRYPTION_KEY` and a second for `JWT_SECRET`. Set `DATABASE_URL`
   to the VPS Postgres URL from the previous section.
2. **dashboard**: New Resource -> App -> Dockerfile. Dockerfile path
   `apps/dashboard/Dockerfile`, build context `/`, port 80, domain `https://<domain>`.

`WK_HOST` is not needed in this mode (routing comes from the domains set per app; it is
only read by the compose file's Traefik labels). With per-app subdomains, skip docker
DNS entirely: set the dashboard's build-time `VITE_API_URL=https://<api-domain>` so the
SPA calls the api directly, and the api's runtime
`CORS_ORIGINS=https://<dashboard-domain>` to allow the dashboard origin with
credentials (`CORS_ORIGINS` is read once at api boot, so changing it needs a
redeploy). The dashboard's nginx `/api` proxy (`API_UPSTREAM`, default `api:3000`)
remains as a same-origin fallback for deployments that keep one domain. The api's
`DATABASE_URL` should point at the postgres resource's container name on a shared
docker network (Coolify container names carry a per-deploy suffix, so use the postgres
resource's name, which is stable).

### docker compose alternative

New Resource -> App -> Docker Compose, import this Git repository; Coolify builds from
the root `docker-compose.yml`. Set the same environment variables, set `WK_HOST` to your
domain (the compose Traefik labels read it), and deploy. Subject to the Cloudflare 504
issue described above — prefer the two-app path. Coolify's proxy (Traefik) exposes the
`websecure` entrypoint and the `letsencrypt` resolver; the certificate is issued
automatically on first deploy for both deploy modes. No certificate action is needed
beyond correct DNS.

## First run: migrate, then decide about seed

Apply Drizzle migrations from a checkout of this repository on your operator machine, pointing
at the VPS Postgres (drizzle reads `DIRECT_DATABASE_URL`, falling back to `DATABASE_URL`):

```bash
DIRECT_DATABASE_URL='postgresql://winningkart:STRONG_PASSWORD@<VPS_IP>:5432/winningkart' bun run db:migrate
```

If port 5432 is not exposed publicly, tunnel first: `ssh -L 5433:localhost:5432 root@<VPS_IP>`
and use `...@localhost:5433/...`.

Seed decision:

- **WARN: `bun run db:seed` inserts demo clients, ad accounts, insights, and demo users.
  Production should SKIP db:seed.**
- The first admin user is created either by running the seed (which also brings demo data) or
  by inserting the user row manually with a bcrypt password hash.
- TODO: a bootstrap admin CLI (`wk:create-admin`) lands post-MVP; until then the seed path is
  the documented way to get a first login.

## Verify

1. `curl https://<domain>/health` returns `{"data":{"ok":true}}`.
2. Log in to the dashboard at `https://<domain>` with the admin credentials.
3. Trigger or wait for one ad account sync (hourly by default) and check the Scheduler page
   under Settings.

## Backups

Nightly dump to an off-host location (example cron at 02:00):

```cron
0 2 * * * postgres pg_dump -Fc winningkart -f /var/backups/winningkart-$(date +\%F).dump
```

Copy the dumps off the VPS daily (rclone, restic, or rsync to object storage or another
machine). Dumps that live only on the same disk as the database are not backups.

Recommended: add WAL archiving with pgBackRest or wal-g to an off-host target so you get
point-in-time recovery on top of the nightly dumps.

Restore test: at least once per quarter, restore the newest dump into a scratch database,
point a checkout of this repo at it, and verify login plus a synced ad account. A backup that
has never been restored is unverified.

## Updating

1. Push to the repository branch Coolify tracks.
2. Redeploy from Coolify; both images rebuild and restart.
3. Run `bun run db:migrate` (as above) when the release includes migrations, before or
   immediately after the redeploy. Single-operator downtime of a few seconds is expected.

For moving existing data from Neon to this VPS, follow `docs/migration-runbook.md`.

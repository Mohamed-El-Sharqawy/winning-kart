# Migration runbook: Neon -> self-hosted Postgres

Cutover for an existing Winning Kart instance from Neon (dev) to self-hosted Postgres on the
VPS. Total expected downtime: minutes. Run it in a quiet window.

Placeholders used below: `<vps-ip>`, `<dump-path>`, and Neon values `<neon-user>`,
`<neon-password>`, `<neon-host>`, `<neon-db>`.

## 1. Provision Postgres 18 on the VPS

Neon runs PostgreSQL 18, and a custom-format dump made by pg_dump 18 restores only with
pg_restore 18 or newer. Ubuntu's stock `postgresql` package is older, so install from PGDG:

```bash
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc
. /etc/os-release && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $VERSION_CODENAME-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
sudo apt update && sudo apt install -y postgresql-18
sudo -u postgres psql -c "CREATE ROLE winningkart WITH LOGIN PASSWORD 'STRONG_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE winningkart OWNER winningkart;"
```

Configure `listen_addresses = 'localhost,172.17.0.1'` in `postgresql.conf` and add
`host  winningkart  winningkart  172.17.0.0/16  scram-sha-256` to `pg_hba.conf`, then
`sudo systemctl restart postgresql`. Full details in `docs/deployment.md`.

## 2. Stop the api (Coolify pause)

In Coolify, stop the api application (with per-app Dockerfile deploys: stop the api
resource; with the compose stack: stop the api service or the whole stack). This stops
all writes so the dump is consistent with what the app last saw. Skip this on a first
deploy before anything has run.

## 3. Dump Neon and restore into self-hosted Postgres

On the operator machine (needs `pg_dump` 18+ on PATH and `DIRECT_DATABASE_URL` in `.env`),
run the dump script. It uses the **direct** (non-pooler) Neon host, strips the
`channel_binding=require` parameter, keeps `sslmode=require`, and writes `wk-neon.dump`
at the repo root:

```bash
pwsh scripts/db/dump-neon.ps1
```

Manual equivalent, with both gotchas applied by hand:

```bash
pg_dump "postgresql://<neon-user>:<neon-password>@<neon-host>/<neon-db>?sslmode=require" \
  --format=custom --no-owner --no-privileges --file=wk-neon.dump
```

Transfer and restore on the VPS. `--no-owner` drops the source role (Neon's
`neondb_owner` does not exist here — without it the restore spews 21 `role "neondb_owner"
does not exist` errors) and `--role=winningkart` creates every object owned by the app
role. Without `--role`, objects land under `postgres` and the api gets permission denied
on first query:

```bash
scp wk-neon.dump root@<vps-ip>:/tmp/wk-neon.dump
ssh root@<vps-ip>
sudo -u postgres pg_restore --dbname=winningkart --role=winningkart --no-owner --no-privileges /tmp/wk-neon.dump
sudo -u postgres psql -d winningkart -c '\dt public.*' -c 'SELECT count(*) FROM users;' -c 'SELECT count(*) FROM drizzle.__drizzle_migrations;'
```

The restore targets a fresh empty database. To re-run it, recreate the database first:

```bash
sudo -u postgres psql -c 'DROP DATABASE winningkart;' -c 'CREATE DATABASE winningkart OWNER winningkart;'
```

## 4. Update DATABASE_URL in Coolify

Set the api application's environment to the self-hosted URL, with all Neon query
parameters removed (no `sslmode`, no `channel_binding` — the connection stays on the VPS):

```text
DATABASE_URL=postgresql://winningkart:STRONG_PASSWORD@172.17.0.1:5432/winningkart
```

## 5. Resume the api

Start the api service in Coolify. The scheduler resumes with the next hourly run.

## 6. Verify

1. `curl https://<domain>/health` returns `{"data":{"ok":true}}`.
2. Log in to the dashboard with existing credentials.
3. Run or wait for one sync and confirm new rows on the Scheduler page. Existing clients,
   campaigns, and insights should all be present from the restore.

## 7. Rollback

Point `DATABASE_URL` back to the Neon **pooler** URL (the `DATABASE_URL` value from `.env`,
with its original query parameters) in Coolify and restart the api.

Caveat: any writes that landed in Neon after the dump in step 3 are not in the restored copy,
and any writes that landed in self-hosted Postgres after the cutover are not in Neon. Prefer a
quiet window immediately after a fresh dump, and keep the Neon project paused-but-alive for at
least a week before deleting it.

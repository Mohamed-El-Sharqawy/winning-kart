# Migration runbook: Neon -> self-hosted Postgres

Cutover for an existing Winning Kart instance from Neon (dev) to self-hosted Postgres on the
VPS. Total expected downtime: minutes. Run it in a quiet window.

Placeholders used below: `<vps-ip>`, `<dump-path>`, and Neon values `<neon-user>`,
`<neon-password>`, `<neon-host>`, `<neon-db>`.

## 1. Provision Postgres on the VPS

```bash
sudo apt update && sudo apt install -y postgresql
sudo -u postgres psql -c "CREATE ROLE winningkart WITH LOGIN PASSWORD 'STRONG_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE winningkart OWNER winningkart;"
```

Configure `listen_addresses = 'localhost,172.17.0.1'` in `postgresql.conf` and add
`host  winningkart  winningkart  172.17.0.0/16  scram-sha-256` to `pg_hba.conf`, then
`sudo systemctl restart postgresql`. Full details in `docs/deployment.md`.

## 2. Stop the api (Coolify pause)

In Coolify, stop the api service (or the whole stack). This stops all writes so the dump is
consistent with what the app last saw.

## 3. Dump Neon and restore into self-hosted Postgres

Dump using the **direct** (non-pooler) Neon URL from `.env`: `DIRECT_DATABASE_URL` is the one
whose host has **no `-pooler` segment** (for example `ep-small-morning-b2ntckch.c-6...neon.tech`,
not `ep-small-morning-b2ntckch-pooler.c-6...neon.tech`).

Strip the `channel_binding=require` query parameter before running `pg_dump`: Neon URLs carry
`?sslmode=require&channel_binding=require`, and self-hosted tooling and Postgres do not need
or use channel binding — unknown parameters make libpq fail. Keep `sslmode=require` for the
Neon connection.

On the operator machine:

```bash
pg_dump "postgresql://<neon-user>:<neon-password>@<neon-host>/<neon-db>?sslmode=require" \
  --format=custom --no-owner --no-privileges --file=wk-neon.dump
```

Transfer and restore on the VPS:

```bash
scp wk-neon.dump root@<vps-ip>:/tmp/wk-neon.dump
ssh root@<vps-ip>
sudo -u postgres pg_restore --dbname=winningkart --no-owner --no-privileges /tmp/wk-neon.dump
```

## 4. Update DATABASE_URL in Coolify

Set the api service environment to the self-hosted URL, with all Neon query parameters
removed (no `sslmode`, no `channel_binding` — the connection stays on the VPS):

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

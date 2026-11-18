# Deployment: Cloudflare (frontend) + boat (backend)

Split deployment for a zero-cost frontend and a per-second backend VM.

```
   browser
     │
     ├─ HTML / JS / CSS ──▶ Cloudflare Pages (free)          https://kindminds.pages.dev
     │      built with PUBLIC_API_URL inlined at build time
     │
     └─ fetch() ─────────▶ boat sandbox (small VM, EU)       https://<sandbox>-8001.on.boat.dev
                            FastAPI + uvicorn on :8001
                            SQLite file on the sandbox disk
                            Groq API for AI features (outbound)
```

Why it is split this way: the frontend is 20 fully static Astro pages and costs nothing to serve
at the edge; the Python/FastAPI backend cannot run on Cloudflare Workers, so it runs on a boat
VM that bills only while it is running.

---

## Current deployment

| Piece | Value |
|---|---|
| Frontend | **https://kindminds.pages.dev** — Pages project `kindminds`, account `d43fc4fc…` |
| Backend | **https://box-node-ae85e685a8e7b1b4-8001.on.boat.dev** — sandbox `bx_7jusua79`, `small` |
| Build variable | `PUBLIC_API_URL=https://box-node-ae85e685a8e7b1b4-8001.on.boat.dev/api` |
| Plan | 7-day trial (ends 2026-11-25), 25 compute hours, auto-stop max 2 h |
| AI | `GROQ_API_KEY` empty → SOP summaries and thought reframing return fallback text |

Redeploy after a code change:

```bash
# backend (existing sandbox — does not create a new one)
SANDBOX=bx_7jusua79 ./deploy/boat/deploy-api.sh

# frontend, against whatever API URL the backend is on
./deploy/cloudflare/deploy-frontend.sh https://box-node-ae85e685a8e7b1b4-8001.on.boat.dev
```

When the sandbox has auto-stopped (every 2 h on the trial):

```bash
./deploy/boat/wake.sh bx_7jusua79
```

The Pages URL does not change between deployments; each `wrangler pages deploy` also prints a
per-deployment preview URL such as `https://997dea29.kindminds.pages.dev`.

---

## Read this before you deploy: cost and limits

**boat has no free tier.** It has a 7-day trial, then a **$20/month minimum**.

| Item | Reality |
|---|---|
| Trial | 7 days, 25 compute hours, 2 sandboxes at once, auto-stop capped at 2 h |
| Plan | $20/month minimum; the plan is VM time at list rates |
| Always-on `small` (2 vCPU / 4 GB, $0.018/h) | ~$13/month for 730 h — fits inside the $20 plan |
| Always-on `default` (4 vCPU / 8 GB, $0.036/h) | ~$26/month — about $6 overage from the wallet |
| Billing | Per second, only while the sandbox runs; a stopped sandbox is free |
| Auto-stop | 1 h after create/resume by default; `boat extend <id> --no-auto-stop` needs a paid plan |
| Regions | Germany, Finland, France only — no US/Asia region (adds ~120–200 ms from India) |
| Public URL | `https://<sandbox>-8001.on.boat.dev` — **stable across stop/resume**, no custom domain |
| Disk retention | Stopped sandbox keeps its disk ≥14 days; `boat snapshot <id> <name>` keeps it longer |
| Ports boat reserves | `22, 6080, 8090, 8911, 47984-48010` — `8001` is free to use |

Cloudflare Pages free plan: unlimited requests and bandwidth, 500 builds/month — plenty here.

**Two consequences you must design around:**

1. **A sleeping sandbox means a dead API.** Every API call from the frontend fails until it is
   resumed. For a live demo or real users, run it always-on (`small` size keeps you inside $20).
2. **The public URL must be token-free.** boat URLs are token-gated by default, and the auth
   cookie is third-party when your pages.dev origin calls it — browsers block that, so the
   `fetch()` fails. Always expose the API with `--public`.

---

## Prerequisites

- boat account + CLI: `curl -fsSL https://boat.dev/install | sh`
  (Windows: `irm https://boat.dev/install.ps1 | iex`, then run the deploy script from Git Bash or WSL)
- Cloudflare account (free) and this repo pushed to GitHub
- Optional: a Groq API key from <https://console.groq.com/keys> for AI summaries/reframing

---

## Step 1 — Backend on boat

### Option A: one command (recommended)

```bash
./deploy/boat/deploy-api.sh
```

It creates a `small` sandbox, clones the repo into `/root/kindminds`, builds the venv, installs
[dependencies](backend/requirements.txt), writes `.env`, installs and starts the systemd unit,
waits for the health check, and prints the public URL.

Variants:

```bash
./deploy/boat/deploy-api.sh --local              # push this working tree instead of cloning GitHub
SANDBOX=bx_xxxx ./deploy/boat/deploy-api.sh      # update an existing sandbox
TYPE=default ./deploy/boat/deploy-api.sh         # 4 vCPU / 8 GB instead of small
```

### Option B: manual

```bash
ID=$(boat new --type small | tail -n1)
boat ssh "$ID" -- "APP_DIR=/root/kindminds PORT=8001 bash -s" < deploy/boat/provision-api.sh
boat host "$ID" 8001 --public --title "KindMinds API"
```

`boat host` prints `https://<sandbox>-8001.on.boat.dev` — that is your API origin. Note it down.

### Keep it awake / let it sleep

> **Trial accounts (the current setup):** auto-stop is capped at **2 hours** and cannot be
> disabled. After each stop the API URL is unreachable and the frontend renders empty lists.
> Wake it with `./deploy/boat/wake.sh <sandbox-id>` — the enabled systemd unit brings the API
> back by itself, and the public URL does not change. The trial includes 25 compute hours, so
> roughly 12 two-hour sessions.

```bash
boat extend "$ID" --no-auto-stop    # always-on (needs the $20 plan)
boat stop "$ID"                     # stop billing, disk is kept
boat resume "$ID"                   # back in seconds; the systemd service starts itself
```

Because the unit is enabled in systemd, the API comes back by itself after a stop/resume —
you only need to re-run `boat host` if the mapping was never created.

### Configure it

Edit `.env` on the sandbox (it is created once on first provision):

```bash
boat ssh "$ID"
nano /root/kindminds/.env
sudo systemctl restart kindminds-api
```

```dotenv
DATABASE_URL=sqlite:///./kindminds_dev.db   # resolves inside /root/kindminds, survives snapshots
GROQ_API_KEY=                               # empty = safe built-in fallback text, no crash
JWT_SECRET_KEY=<random hex, generated on first provision>
```

To tighten CORS away from the default wildcard, add the Pages origin(s) as JSON:

```dotenv
BACKEND_CORS_ORIGINS=["https://kindminds.pages.dev","https://kindminds.org"]
```

---

## Step 2 — Frontend on Cloudflare Pages

The API URL is inlined into the bundle at build time by
[api.ts](frontend/src/lib/api.ts), so it must be set as a **build-time** variable.

### Dashboard

1. Workers & Pages → Create → Pages → Connect to Git → pick the repo.
2. Settings:

   | Setting | Value |
   |---|---|
   | Framework preset | Astro |
   | Root directory | `frontend` |
   | Build command | `pnpm install && pnpm run build` |
   | Build output directory | `dist` |
   | Environment variable | `PUBLIC_API_URL=https://<sandbox>-8001.on.boat.dev/api` |
   | Environment variable | `NODE_VERSION=20` |

3. Save and deploy. Every push to `main` redeploys.

### CLI

```bash
cd frontend
PUBLIC_API_URL=https://<sandbox>-8001.on.boat.dev/api node node_modules/astro/astro.js build
npx wrangler pages deploy dist --project-name kindminds
```

The build is pure static output (20 pages, no adapter, no SSR), so nothing else is needed.

---

## Step 3 — Verify end to end

```bash
API=https://<sandbox>-8001.on.boat.dev

curl -s "$API/api/health"                      # {"status":"healthy",...}
curl -s "$API/api/disasters?limit=1"           # seeded India reference data
curl -s "$API/api/analytics/overview"          # live computed metrics
curl -sI "https://kindminds.pages.dev" | head -1
```

Then in the browser, on the Pages URL:

- `/needer/find-help` lists shelters/hospitals (proves the API base URL is right)
- `/helper/requests` shows triage data
- `/disaster/map` renders Leaflet tiles
- `/helper/sop` summarises without a Groq key (fallback text) and with one (live AI)

If pages load but lists are empty, open DevTools → Network: a CORS error or a 5xx from the
`on.boat.dev` URL means the sandbox is asleep or the API URL was wrong at build time.

---

## Data, secrets and retention

- The SQLite database is `/root/kindminds/kindminds_dev.db`. It is captured by boat's
  once-a-minute disk snapshot, so it survives stop/resume.
- A stopped sandbox keeps its disk for **at least 14 days**. For anything you care about, run
  `boat snapshot "$ID" kindminds-data` (10 saved snapshots are included per $20 of plan).
- `.env` (including `GROQ_API_KEY` and `JWT_SECRET_KEY`) is also on that disk — chmod 600.
- India reference data re-seeds automatically when the database is empty, so a fresh sandbox is
  immediately usable. Delete the `.db` file to reset.
- The API is currently unauthenticated: `JWT_SECRET_KEY` is defined but no route enforces auth,
  and assistance requests are accepted from anyone. Keep the URL unlisted and treat it as
  sensitive; add auth before inviting real users.

---

## Optional: put a custom domain in front of the API

boat does not support custom domains, and it routes on the `on.boat.dev` host name. A
Cloudflare Worker can proxy a custom domain to it while keeping the request host correct:

```bash
npx wrangler deploy --config deploy/cloudflare/wrangler.jsonc
```

Set `UPSTREAM` in [wrangler.jsonc](deploy/cloudflare/wrangler.jsonc) to your API URL and the
`routes` pattern to your hostname. Free plan covers 100k Worker requests/day. This gives you a
stable, branded API origin (and hides the sandbox id) but does **not** reduce origin latency.
Server-Sent Events from the AI endpoints stream through this proxy unchanged.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Permission denied` creating `/root/kindminds` | The sandbox login user is `user`, not root. The scripts resolve `$HOME` themselves; don't hardcode `/root`. |
| A path 308-redirects to the same path with a trailing slash | Normal Cloudflare Pages pretty-URL behaviour, not an error |
| API returns 502/503, or pages load with empty lists | Sandbox auto-stopped (2 h on the trial): `./deploy/boat/wake.sh <sandbox-id>` |
| `fetch` fails only from the Pages site | URL is token-gated: re-run `boat host <id> 8001 --public` |
| Empty lists, no console error | `PUBLIC_API_URL` missing at build time — rebuild Pages with it set |
| CORS error in console | Set `BACKEND_CORS_ORIGINS` in `.env`, restart the service |
| Service won't start | `boat ssh <id> -- 'systemctl status kindminds-api; journalctl -u kindminds-api -n 50'` |
| Port already in use | Another process holds 8001; use `PORT=8080` in both scripts |
| AI features return fallback text | `GROQ_API_KEY` is empty on the sandbox |
| Data disappeared after weeks | Sandbox disk expired after 14+ days stopped — restore a saved snapshot |

---

## Local development (no boat, no Cloudflare)

```bash
# backend — http://localhost:8001
python -m venv backend/.venv
backend/.venv/Scripts/pip install -r backend/requirements.txt      # Windows
backend/.venv/Scripts/python -m uvicorn backend.app.main:app --port 8001 --reload

# frontend — http://localhost:4321
cd frontend && pnpm install && pnpm run dev
```

`./start.sh` (macOS/Linux) does both. The frontend falls back to `http://localhost:8001/api`
when `PUBLIC_API_URL` is unset, so local dev needs no configuration.

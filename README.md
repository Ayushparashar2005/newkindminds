# KindMinds
### AI-Powered Mental Health Support & Humanitarian Disaster Response Platform

KindMinds is a unified humanitarian platform designed to support individuals in distress, survivors of natural disasters, displaced populations, humanitarian NGOs, search-and-rescue teams, and medical professionals.

---

## 🏛️ Absolute Architectural Requirement: Exactly Two User Panels

KindMinds maintains exactly two primary user panels:

1. **Helper Panel (`/helper`)**: For all assistance providers (NGOs, medical responders, search groups, relief workers, shelter providers).
2. **Needer Panel (`/needer`)**: For all individuals and communities seeking assistance (shelter, water, food, medical, evacuation, mental health).

Both panels share unified infrastructure for:
- Geospatial Disaster Resource Map (`/disaster/map`)
- NGO & Humanitarian Agency Directory (`/disaster/organizations`)
- Disaster Standard Operating Procedures & Guidance (`/disaster/sop`)
- Household Preparedness & 72-Hour Survival Kits (`/disaster/preparedness`)
- Humanitarian Impact & Relief Analytics (`/disaster/impact`)

---

## 🛠️ Technology Stack

- **Frontend**: Astro 4, React 18, TypeScript, Tailwind CSS, TanStack Query, Lucide icons.
- **Design System**: Humanitarian Bauhaus × Neumorphism (warm off-white surfaces, charcoal typography, terracotta, dusty blue, soft sage, warm sand).
- **Backend**: FastAPI (Python), SQLAlchemy 2.0, Pydantic v2, Uvicorn.
- **Database**: SQLite by default (PostgreSQL supported via `DATABASE_URL`).
- **AI Integration**: Groq LLM API with strict safety guardrails and crisis detection.

---

## 🚀 Quick Start Guide

**Requirements:** Python 3.10+ and Node.js 18+.

```bash
./start.sh
```

That's it. On first run it creates `backend/.venv`, installs Python packages and frontend packages (via pnpm 10), then starts:

- **Frontend:** http://localhost:4321
- **Backend API:** http://localhost:8001 (Swagger docs at `/docs`, health check at `/api/health`)

Press `Ctrl+C` to stop both. India reference data (real agencies, hospitals, NDRF battalions, helplines and NDMA guidance) is seeded automatically into a local SQLite file (`kindminds_dev.db`) on first startup; delete that file to reset.

### Optional: enable AI features

Copy `.env.example` to `.env` and set `GROQ_API_KEY` (free at https://console.groq.com/keys). Without a key, SOP summaries and thought reframing use safe built-in fallback text.

### Running the parts manually

```bash
# Backend (from project root)
python3.12 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
backend/.venv/bin/python backend/run.py

# Frontend (in another terminal)
cd frontend
npx pnpm@10 install
npx pnpm@10 run dev
```

---

## ☁️ Deployment

The frontend is static and the backend is Python, so they deploy to different places:

- **Frontend → Cloudflare Pages** (free): 20 static pages, built with `PUBLIC_API_URL` pointing at the API.
- **Backend → boat sandbox** (per-second VM, `$20/month` minimum): FastAPI on port 8001 behind a stable `on.boat.dev` HTTPS URL, SQLite persisted in the sandbox snapshot.

**Live:** <https://kindminds.pages.dev> · API <https://box-node-ae85e685a8e7b1b4-8001.on.boat.dev/api/health> (trial sandbox — auto-stops after 2 h, wake with `./deploy/boat/wake.sh bx_7jusua79`)

Full runbook, cost limits and troubleshooting: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.
One-command deploys: `./deploy/boat/deploy-api.sh` and `./deploy/cloudflare/deploy-frontend.sh <api-origin>`.

---

## 🗺️ Key Routes

| Route | Description |
|---|---|
| `/` | Landing Portal & Panel Selector |
| `/needer` | Needer Panel Dashboard |
| `/needer/find-help` | Search verified shelters, hospitals, food, and water |
| `/needer/request` | 3-step calm assistance request form |
| `/needer/my-requests` | Track submitted requests and responder notes |
| `/needer/guidance` | Verified emergency safety procedures |
| `/needer/mental-health` | 5-4-3-2-1 grounding, breathing, private journal, crisis helplines |
| `/needer/preparedness` | Interactive 72-hour survival kit checklist |
| `/helper` | Helper Panel Operations Center |
| `/helper/requests` | Request triage desk (accept, assign, fulfill, refer) |
| `/helper/resources` | Warehouses, bunker depots, and stockpile inventory |
| `/helper/search-groups`| Search-and-rescue squads and capabilities |
| `/helper/sop` | Helper SOP library with Groq AI 3-step summarizer |
| `/helper/profile` | Editable responder profile (saved in the browser) |
| `/disaster/map` | Geospatial interactive relief map |
| `/disaster/organizations`| Verified humanitarian NGO directory |
| `/disaster/sop` | Verified Standard Operating Procedures |
| `/disaster/preparedness` | Disaster preparedness center |
| `/disaster/impact` | Humanitarian relief and resource flow analytics |

---

## 🔒 Safety & Privacy Principles

1. **Not Emergency Dispatch**: KindMinds is an informational coordination tool and does not claim to replace 112 / 911 emergency services.
2. **AI Guardrails**: AI cannot diagnose mental illnesses or fabricate emergency dispatches.
3. **Location Privacy**: Exact private household locations are never published.
4. **Calculated Metrics**: All dashboard figures are computed live from active database records.
5. **Real Public Data Only**: Seeded agencies, facilities and helplines are real Indian public services with no invented phone numbers. Sample requests carry no personal details.


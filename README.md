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
- **Database**: Neon PostgreSQL with PostGIS (supports local SQLite fallback).
- **AI Integration**: Groq LLM API with strict safety guardrails and crisis detection.

---

## 🚀 Quick Start Guide

### 1. Start the FastAPI Backend

```bash
cd backend
# Activate virtual environment
.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Linux/Mac

# Install dependencies (already installed)
pip install -r requirements.txt

# Launch API server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend starts at `http://localhost:8000`.
- Swagger Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`
- Initial demo data is seeded automatically on startup.

### 2. Start the Astro Frontend

```bash
cd frontend

# Install dependencies (already installed)
pnpm install

# Run Astro development server
pnpm run dev
```

The frontend launches at `http://localhost:4321`.

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
| `/helper/profile` | Responder profile and verification status |
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
5. **Clear DEMO Labeling**: Seeded development data is explicitly labeled with amber [DEMO] banners.


# KindMinds Platform Architecture
## AI-Powered Mental Health Support & Humanitarian Disaster Response Platform

### 1. The Exactly Two Primary Panels Model

KindMinds is intentionally structured with exactly two primary user panels:

```
                                  [ KindMinds Platform ]
                                             │
                   ┌─────────────────────────┴─────────────────────────┐
                   ▼                                                   ▼
           [ HELPER PANEL ]                                    [ NEEDER PANEL ]
            Route: /helper                                      Route: /needer
                   │                                                   │
  • NGOs & Humanitarian Agencies                      • Disaster-Affected Individuals
  • Search & Rescue (SAR) Teams                       • Evacuated Families
  • Medical Personnel & Mobile Clinics                • Displaced Persons
  • Logistics Warehouses & Bunker Depots              • People Needing Food/Clean Water
  • Relief Workers & Volunteers                       • Trauma Survivors & Mental Distress
                   │                                                   │
                   └─────────────────────────┬─────────────────────────┘
                                             ▼
                             [ Shared Universal Infrastructure ]
                     • Disaster Map (/disaster/map)
                     • Verified Organizations (/disaster/organizations)
                     • Standard Operating Procedures (/disaster/sop)
                     • 72-Hour Preparedness (/disaster/preparedness)
                     • Humanitarian Impact Analytics (/disaster/impact)
```

- **Panel 1 — Helper (`/helper`)**: Unifies all assistance providers (NGOs, medical responders, search groups, relief workers, shelter providers). Permissions and sensitive data access are governed by verified helper roles.
- **Panel 2 — Needer (`/needer`)**: Unifies all assistance seekers (flood/cyclone victims, families needing clean water/shelter/food, displaced people, psychological trauma recovery).
- **Shared Infrastructure**: Disaster maps, organization directories, SOP libraries, preparedness kits, and regional analytics are shared, adapting visible actions and permissions based on the active panel.

---

### 2. Technology Stack

- **Frontend**: Astro 4, React 18, TypeScript, Tailwind CSS, TanStack Query, Lucide icons.
- **Design System**: Humanitarian Bauhaus × Neumorphism (warm off-white `#F5F0E8`, charcoal `#2C2824`, terracotta `#B5674D`, dusty blue `#5C7A8E`, soft sage `#7A9B82`, warm sand `#C9A96E`).
- **Backend**: FastAPI (Python 3.10+), SQLAlchemy 2.0, Pydantic v2, Uvicorn.
- **Database**: Neon PostgreSQL with PostGIS for spatial coordinates and geographic queries (with local SQLite fallback).
- **AI Integration**: Groq LLM API for trauma-informed thought reframing, 5-4-3-2-1 grounding exercises, and verified SOP summarization.

---

### 3. Application Directory Structure

```
d:\opuimquake\
├── backend/
│   ├── app/
│   │   ├── api/             # Modular API routes (disasters, resources, orgs, sar, assistance, sop, analytics, mental_health)
│   │   ├── core/            # Config, database engine, settings
│   │   ├── models/          # SQLAlchemy entities (User, Organization, DisasterEvent, Resource, Request, SOP, Journal)
│   │   ├── schemas/         # Pydantic request & response validation schemas
│   │   ├── ai/              # Groq client & safety guardrails
│   │   └── main.py          # FastAPI application entrypoint & startup seeder
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Neumorphic cards, StatusBadges, DemoBanner, AlertBanner, DataFreshness
│   │   │   ├── layout/      # AppHeader, Sidebar, PanelSwitcher
│   │   │   ├── helper/      # HelperDashboard, HelperRequests, HelperResources, HelperSearchGroups
│   │   │   ├── needer/      # NeederDashboard, FindHelp, RequestAssistanceModal, MyRequests, MentalHealthModule, PreparednessModule
│   │   │   └── shared/      # DisasterMapViewer, OrganizationDirectory, SOPLibrary, ImpactAnalytics
│   │   ├── layouts/         # Layout.astro
│   │   ├── pages/           # Astro file-based routing (/helper/*, /needer/*, /disaster/*)
│   │   └── styles/          # globals.css (Bauhaus & Neumorphism tokens)
│   └── package.json
├── shared/                  # Shared TypeScript interfaces
├── docs/                    # Architecture, API & Security Documentation
└── .env.example             # Environment configuration template
```


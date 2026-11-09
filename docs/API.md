# KindMinds REST API Documentation

Base URL: `http://localhost:8000/api`

---

## 1. Disasters (`/disasters`)

- `GET /api/disasters`: List all active/monitoring disaster events. Query params: `category`, `status`, `severity`.
- `GET /api/disasters/{id}`: Detailed information about a specific disaster event.
- `POST /api/disasters`: Register new disaster event.

## 2. Humanitarian Resources (`/resources`)

- `GET /api/resources`: List resources. Query params: `category`, `status`, `disaster_id`, `search`, `visibility`.
- `GET /api/resources/nearby`: Haversine / PostGIS proximity query. Params: `lat`, `lng`, `radius_km`.
- `GET /api/resources/{id}`: Retrieve single resource including its active inventory items.
- `POST /api/resources`: Register new humanitarian facility (shelter, hospital, water depot, warehouse).
- `PATCH /api/resources/{id}`: Update resource status or availability.
- `POST /api/resources/{id}/inventory`: Add or update stockpile inventory item.

## 3. Organizations (`/organizations`)

- `GET /api/organizations`: Directory of verified humanitarian organizations. Query params: `verification`, `status`.
- `GET /api/organizations/{id}`: Detailed organization profile and capabilities.
- `POST /api/organizations`: Register organization.

## 4. Search and Rescue Groups (`/search-groups`)

- `GET /api/search-groups`: List active SAR teams. Query params: `disaster_id`, `status`.
- `GET /api/search-groups/{id}`: Single group details.
- `POST /api/search-groups`: Register new search group.
- `PATCH /api/search-groups/{id}/status`: Update deployment status (`preparing`, `active`, `unavailable`, `completed`).

## 5. Assistance Requests (`/assistance-requests`)

- `POST /api/assistance-requests`: Submit new assistance request (Needer).
- `GET /api/assistance-requests`: List requests. Query params: `user_id`, `disaster_id`, `category`, `status`.
- `GET /api/assistance-requests/{id}`: Retrieve request details.
- `PATCH /api/assistance-requests/{id}`: Update request status and log field notes.
- `POST /api/assistance-requests/{id}/assign`: Assign verified organization and responder name.

## 6. Standard Operating Procedures (`/sops`)

- `GET /api/sops`: List verified SOPs. Query params: `disaster_type`, `lifecycle_stage`, `audience`.
- `GET /api/sops/{id}`: SOP full text, instructions, and safety warnings.
- `POST /api/sops/{id}/summarize`: Groq-powered 3-step action summary with safety disclaimers.
- `GET /api/sops/checklists/all`: Preparedness survival kit checklists.

## 7. Humanitarian Impact Analytics (`/analytics`)

- `GET /api/analytics/overview`: Direct DB counts of active disasters, total/available resources, active SAR groups, and request progression (submitted, assigned, in progress, fulfilled).
- `GET /api/analytics/regional`: Regional assistance demand vs fulfillment.
- `GET /api/analytics/resource-flow`: Supply levels and availability by facility category.

## 8. Mental Health Support (`/mental-health`)

- `GET /api/mental-health/helplines`: Verified 24/7 national and crisis helpline numbers.
- `POST /api/mental-health/grounding`: Get 5-4-3-2-1 sensory grounding or gentle breathing steps.
- `POST /api/mental-health/reframe`: Cognitive thought reframing with trauma validation and crisis detection.
- `POST /api/mental-health/journal`: Private encrypted journal entry storage.
- `GET /api/mental-health/journal`: Retrieve private entries for authenticated user.
- `POST /api/mental-health/assessment`: Wellbeing self-reflection scoring with strict non-diagnosis disclaimer.

## 9. Seed Demo Data (`/seed`)

- `POST /api/seed/demo`: Populates realistic DEMO data (disasters, orgs, resources, inventory, requests, SOPs).


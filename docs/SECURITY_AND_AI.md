# KindMinds Security, Privacy & AI Safety Architecture

---

## 1. AI Safety Guardrails (Groq LLM Integration)

KindMinds employs Groq LLM under strict humanitarian guardrails:

### Allowed Use Cases
1. Grounding guidance generation (5-4-3-2-1 sensory grounding, gentle box breathing).
2. Trauma-sensitive thought reflection (validating real distress, offering alternative perspectives without forced toxic positivity).
3. Plain-language summaries and translations of official, verified SOPs from NDMA, Red Cross, or WHO.

### Non-Negotiable AI Restrictions
The model is strictly prohibited from:
- Fabricating disaster alerts, evacuations, shelter availability, or emergency contacts.
- Diagnosing any mental illness (PTSD, clinical depression, anxiety disorders).
- Making emergency dispatch claims (e.g. "We have dispatched a rescue boat/helicopter to your location").
- Generating dangerous rescue instructions.
- Storing or exposing private journal entries.

### Crisis Detection
All incoming mental-health reflection requests are evaluated for active self-harm or imminent physical danger keywords (`check_for_immediate_crisis`). When triggered, the AI immediately defers to emergency services (112 / 911 / KIRAN 1800-599-0019 / 988) and explicitly informs the user that KindMinds is not an emergency dispatch provider.

---

## 2. Privacy by Design

- **Location Protection**: Exact private household coordinates are never collected or displayed publicly. Approximate location markers and prominent landmarks are used instead.
- **Sensitive Facilities**: Storage bunkers, staging areas, and sensitive warehouses have restricted visibility levels (`verified_helpers` or `restricted`), hiding them from public maps.
- **Private Journaling**: Mental health journal entries are stored privately per user, isolated from organization or helper views.
- **Volunteer Safety**: Individual volunteer live GPS tracking is not publicly exposed.

---

## 3. Data Freshness & Verification

- Every resource, organization, search group, and SOP record maintains `last_verified_at` timestamps and source attribution.
- If data has not been recently verified, the interface alerts users with verification status tags and disclaimers.
- All seeded demonstration records carry `is_demo: true` and are displayed with high-visibility amber DEMO banners.


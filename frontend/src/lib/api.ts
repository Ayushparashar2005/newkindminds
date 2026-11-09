import type {
  DisasterEvent,
  HumanitarianResource,
  Organization,
  SearchGroup,
  AssistanceRequest,
  SOPDocument,
  CrisisHelpline,
  MentalHealthJournalEntry
} from '../types';

// Use PUBLIC_API_URL env var if set, fallback to localhost for dev
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_API_URL) ||
  'http://localhost:8001/api';

async function fetchJSON<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${await res.text()}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`Fetch error for ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Disasters
  getDisasters: (params?: { category?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchJSON<DisasterEvent[]>(`/disasters${query ? '?' + query : ''}`);
  },
  getDisaster: (id: string) => fetchJSON<DisasterEvent>(`/disasters/${id}`),

  // Resources
  getResources: (params?: { category?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchJSON<HumanitarianResource[]>(`/resources${query ? '?' + query : ''}`);
  },
  getNearbyResources: (lat: number, lng: number, radiusKm: number = 30) => {
    return fetchJSON<HumanitarianResource[]>(`/resources/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`);
  },
  createResource: (data: Partial<HumanitarianResource>) => {
    return fetchJSON<HumanitarianResource>('/resources', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateResource: (id: string, data: Partial<HumanitarianResource>) => {
    return fetchJSON<HumanitarianResource>(`/resources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Organizations
  getOrganizations: () => fetchJSON<Organization[]>('/organizations'),
  getOrganization: (id: string) => fetchJSON<Organization>(`/organizations/${id}`),

  // Search Groups
  getSearchGroups: (params?: { disaster_id?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchJSON<SearchGroup[]>(`/search-groups${query ? '?' + query : ''}`);
  },
  createSearchGroup: (data: Partial<SearchGroup>) => {
    return fetchJSON<SearchGroup>('/search-groups', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateSearchGroupStatus: (id: string, status: string) => {
    return fetchJSON<SearchGroup>(`/search-groups/${id}/status?status=${encodeURIComponent(status)}`, {
      method: 'PATCH'
    });
  },

  // Assistance Requests
  submitRequest: (data: {
    disaster_id: string;
    assistance_category: string;
    description: string;
    approximate_location: string;
    latitude?: number;
    longitude?: number;
    preferred_contact_method: string;
    contact_value?: string;
    accessibility_needs?: string;
  }) => {
    return fetchJSON<AssistanceRequest>('/assistance-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  getRequests: (params?: { user_id?: string; disaster_id?: string; category?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchJSON<AssistanceRequest[]>(`/assistance-requests${query ? '?' + query : ''}`);
  },
  updateRequestStatus: (id: string, update: { status?: string; notes?: string; assigned_organization_id?: string }) => {
    return fetchJSON<AssistanceRequest>(`/assistance-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update)
    });
  },
  assignResponder: (id: string, orgId: string, helperName: string) => {
    return fetchJSON<AssistanceRequest>(`/assistance-requests/${id}/assign?organization_id=${orgId}&helper_name=${encodeURIComponent(helperName)}`, {
      method: 'POST'
    });
  },

  // SOPs & Guidance
  getSOPs: (params?: { disaster_type?: string; lifecycle_stage?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchJSON<SOPDocument[]>(`/sops${query ? '?' + query : ''}`);
  },
  summarizeSOP: (id: string) => {
    return fetchJSON<{ is_ai_summary: boolean; summary_text: string; disclaimer: string; source_organization: string; source_url: string }>(
      `/sops/${id}/summarize`,
      { method: 'POST' }
    );
  },
  getChecklists: () => fetchJSON<any[]>('/sops/checklists/all'),

  // Analytics (Strictly DB computed)
  getAnalyticsOverview: () => fetchJSON<any>('/analytics/overview'),
  getRegionalAnalytics: () => fetchJSON<any[]>('/analytics/regional'),
  getResourceFlow: () => fetchJSON<any[]>('/analytics/resource-flow'),

  // Mental Health Support
  getHelplines: () => fetchJSON<{ helplines: CrisisHelpline[]; disclaimer: string }>('/mental-health/helplines'),
  getGrounding: (exerciseType: string = '54321') => {
    return fetchJSON<any>('/mental-health/grounding', {
      method: 'POST',
      body: JSON.stringify({ exercise_type: exerciseType })
    });
  },
  reframeThought: (data: { situation: string; current_thought: string; emotion: string }) => {
    return fetchJSON<any>('/mental-health/reframe', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  saveJournalEntry: (data: {
    situation: string;
    thoughts: string;
    emotions: string[];
    emotional_intensity: number;
    physical_sensations?: string;
    needs?: string;
    alternative_perspective?: string;
  }) => {
    return fetchJSON<MentalHealthJournalEntry>('/mental-health/journal', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  getJournalEntries: () => fetchJSON<MentalHealthJournalEntry[]>('/mental-health/journal'),
  submitAssessment: (responses: Record<string, number>) => {
    return fetchJSON<any>('/mental-health/assessment', {
      method: 'POST',
      body: JSON.stringify({ assessment_type: 'wellbeing_check', responses })
    });
  },

  // Neon Services Status
  getNeonStatus: () => fetchJSON<any>('/neon/status'),

  // Public APIs (from public-apis repository)
  getLiveEarthquakes: (minMagnitude: number = 4.0) =>
    fetchJSON<any>(`/external/earthquakes?min_magnitude=${minMagnitude}`),
  getLiveWeather: (lat: number, lng: number) =>
    fetchJSON<any>(`/external/weather?lat=${lat}&lng=${lng}`),
  geocodeLocation: (query: string) =>
    fetchJSON<any>(`/external/geocode?query=${encodeURIComponent(query)}`)
};


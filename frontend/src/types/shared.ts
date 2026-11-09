// KindMinds Platform Shared Types

export type PanelType = 'helper' | 'needer';

export type HelperRoleType =
  | 'ngo'
  | 'volunteer'
  | 'sar'
  | 'medical'
  | 'relief'
  | 'shelter'
  | 'government';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'suspended';

export type DisasterCategory =
  | 'flood'
  | 'earthquake'
  | 'cyclone'
  | 'hurricane'
  | 'wildfire'
  | 'landslide'
  | 'drought'
  | 'heat'
  | 'storm'
  | 'industrial'
  | 'chemical'
  | 'conflict'
  | 'other';

export type DisasterSeverity = 'critical' | 'severe' | 'moderate' | 'minor' | 'advisory';

export type DisasterLifecycleStage =
  | 'prevention'
  | 'preparedness'
  | 'mitigation'
  | 'response'
  | 'recovery';

export type ResourceCategory =
  | 'medical'
  | 'shelter'
  | 'supplies'
  | 'food'
  | 'water'
  | 'warehouse'
  | 'equipment'
  | 'organization'
  | 'search_group';

export type ResourceVisibility = 'public' | 'verified_helpers' | 'organization_only' | 'restricted';

export type ResourceOperationalStatus =
  | 'available'
  | 'limited'
  | 'out_of_stock'
  | 'reserved'
  | 'in_transit'
  | 'closed'
  | 'unknown';

export type AssistanceCategory =
  | 'medical'
  | 'food'
  | 'water'
  | 'shelter'
  | 'evacuation'
  | 'transportation'
  | 'missing_person'
  | 'family_reunification'
  | 'disability'
  | 'mental_health'
  | 'essential_supplies'
  | 'other';

export type AssistanceStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'fulfilled'
  | 'unable_to_fulfill'
  | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  active_panel: PanelType;
  is_verified_helper: boolean;
  helper_type?: HelperRoleType;
  organization_id?: string;
  organization_name?: string;
  created_at: string;
}

export interface DisasterEvent {
  id: string;
  name: string;
  category: DisasterCategory;
  description: string;
  region: string;
  severity: DisasterSeverity;
  status: 'active' | 'monitoring' | 'contained' | 'recovered';
  lifecycle_stage: DisasterLifecycleStage;
  start_date: string;
  end_date?: string;
  source: string;
  verification_status: VerificationStatus;
  last_verified_at: string;
  is_demo: boolean;
  affected_population?: number;
  latitude: number;
  longitude: number;
}

export interface HumanitarianResource {
  id: string;
  name: string;
  category: ResourceCategory;
  sub_category?: string;
  disaster_id?: string;
  disaster_name?: string;
  organization_id?: string;
  organization_name?: string;
  address_approximate: string;
  latitude: number;
  longitude: number;
  operational_status: ResourceOperationalStatus;
  visibility: ResourceVisibility;
  accessibility_features: string[];
  contact_public?: string;
  source_attribution: string;
  verification_status: VerificationStatus;
  last_verified_at: string;
  is_demo: boolean;
  inventory_summary?: {
    item_name: string;
    quantity: number;
    unit: string;
    status: ResourceOperationalStatus;
  }[];
}

export interface SearchGroup {
  id: string;
  name: string;
  organization_id?: string;
  organization_name?: string;
  disaster_id?: string;
  disaster_name?: string;
  capabilities: string[];
  service_region: string;
  approximate_area: string;
  latitude: number;
  longitude: number;
  public_contact: string;
  operational_status: 'preparing' | 'active' | 'unavailable' | 'completed' | 'disbanded';
  verification_status: VerificationStatus;
  last_verified_at: string;
  is_demo: boolean;
}

export interface Organization {
  id: string;
  name: string;
  organization_type: string;
  description: string;
  assistance_categories: AssistanceCategory[];
  geographic_coverage: string[];
  public_contact: string;
  website?: string;
  verification_status: VerificationStatus;
  operational_status: 'active' | 'standby' | 'inactive';
  last_verified_at: string;
  is_demo: boolean;
}

export interface AssistanceRequest {
  id: string;
  disaster_id: string;
  disaster_name?: string;
  user_id: string;
  user_name?: string;
  assistance_category: AssistanceCategory;
  description: string;
  approximate_location: string;
  latitude?: number;
  longitude?: number;
  preferred_contact_method: 'phone' | 'sms' | 'email' | 'in_person' | 'app';
  contact_value?: string;
  accessibility_needs?: string;
  status: AssistanceStatus;
  assigned_organization_id?: string;
  assigned_organization_name?: string;
  assigned_helper_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_demo: boolean;
}

export interface SOPDocument {
  id: string;
  title: string;
  disaster_type: DisasterCategory;
  lifecycle_stage: DisasterLifecycleStage;
  intended_audience: 'public' | 'helpers' | 'volunteers' | 'medical_teams' | 'all';
  geographic_applicability: string;
  source_organization: string;
  source_url: string;
  publication_date: string;
  last_reviewed_at: string;
  verification_status: VerificationStatus;
  summary?: string;
  instructions: string[];
  warnings: string[];
  accessibility_notes?: string;
  is_demo: boolean;
}

export interface PreparednessChecklist {
  id: string;
  title: string;
  category: DisasterCategory;
  items: {
    id: string;
    text: string;
    completed: boolean;
    priority: 'critical' | 'essential' | 'recommended';
  }[];
}

export interface MentalHealthJournalEntry {
  id: string;
  user_id: string;
  situation: string;
  thoughts: string;
  emotions: string[];
  emotional_intensity: number; // 1 - 10
  physical_sensations?: string;
  needs?: string;
  alternative_perspective?: string;
  created_at: string;
}

export interface GroundingExerciseStep {
  step: number;
  sense: string;
  count: number;
  prompt: string;
  instruction: string;
}

export interface CrisisHelpline {
  country: string;
  region?: string;
  service_name: string;
  phone_or_code: string;
  available_hours: string;
  languages: string[];
  service_type: 'emergency' | 'mental_health' | 'disaster' | 'women_child';
  verified_source: string;
  last_verified_at: string;
}


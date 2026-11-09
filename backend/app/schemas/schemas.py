from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- USER & PROFILE ---
class UserBase(BaseModel):
    email: str
    display_name: str
    active_panel: str = "needer" # helper | needer
    helper_type: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    is_verified_helper: bool
    organization_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- DISASTER EVENT ---
class DisasterEventBase(BaseModel):
    name: str
    category: str
    description: str
    region: str
    severity: str = "moderate"
    status: str = "active"
    lifecycle_stage: str = "response"
    source: str
    latitude: float
    longitude: float
    affected_population: int = 0
    is_demo: bool = True

class DisasterEventCreate(DisasterEventBase):
    pass

class DisasterEventResponse(DisasterEventBase):
    id: str
    verification_status: str
    last_verified_at: datetime
    start_date: datetime
    end_date: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- INVENTORY ---
class ResourceInventoryBase(BaseModel):
    item_name: str
    quantity: float
    unit: str = "units"
    reserved_quantity: float = 0.0
    inventory_status: str = "available"

class ResourceInventoryCreate(ResourceInventoryBase):
    pass

class ResourceInventoryResponse(ResourceInventoryBase):
    id: str
    resource_id: str
    updated_at: datetime

    class Config:
        from_attributes = True

# --- HUMANITARIAN RESOURCE ---
class HumanitarianResourceBase(BaseModel):
    name: str
    category: str
    sub_category: Optional[str] = None
    disaster_id: Optional[str] = None
    organization_id: Optional[str] = None
    address_approximate: str
    latitude: float
    longitude: float
    operational_status: str = "available"
    visibility: str = "public"
    accessibility_features: List[str] = []
    contact_public: Optional[str] = None
    source_attribution: str
    is_demo: bool = True

class HumanitarianResourceCreate(HumanitarianResourceBase):
    pass

class HumanitarianResourceUpdate(BaseModel):
    name: Optional[str] = None
    operational_status: Optional[str] = None
    visibility: Optional[str] = None
    contact_public: Optional[str] = None
    accessibility_features: Optional[List[str]] = None

class HumanitarianResourceResponse(HumanitarianResourceBase):
    id: str
    verification_status: str
    last_verified_at: datetime
    inventory_items: List[ResourceInventoryResponse] = []

    class Config:
        from_attributes = True

# --- SEARCH GROUP ---
class SearchGroupBase(BaseModel):
    name: str
    organization_id: Optional[str] = None
    disaster_id: Optional[str] = None
    capabilities: List[str] = []
    service_region: str
    approximate_area: str
    latitude: float
    longitude: float
    public_contact: str
    operational_status: str = "active"
    is_demo: bool = True

class SearchGroupCreate(SearchGroupBase):
    pass

class SearchGroupResponse(SearchGroupBase):
    id: str
    verification_status: str
    last_verified_at: datetime

    class Config:
        from_attributes = True

# --- ORGANIZATION ---
class OrganizationBase(BaseModel):
    name: str
    organization_type: str = "Humanitarian NGO"
    description: str
    assistance_categories: List[str] = []
    geographic_coverage: List[str] = []
    public_contact: str
    website: Optional[str] = None
    operational_status: str = "active"
    is_demo: bool = True

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: str
    verification_status: str
    last_verified_at: datetime

    class Config:
        from_attributes = True

# --- ASSISTANCE REQUEST ---
class AssistanceRequestCreate(BaseModel):
    disaster_id: str
    assistance_category: str
    description: str
    approximate_location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_contact_method: str = "phone"
    contact_value: Optional[str] = None
    accessibility_needs: Optional[str] = None

class AssistanceRequestUpdate(BaseModel):
    status: Optional[str] = None
    assigned_organization_id: Optional[str] = None
    assigned_helper_name: Optional[str] = None
    notes: Optional[str] = None

class AssistanceRequestResponse(BaseModel):
    id: str
    disaster_id: str
    user_id: str
    user_name: Optional[str] = None
    assistance_category: str
    description: str
    approximate_location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_contact_method: str
    contact_value: Optional[str] = None
    accessibility_needs: Optional[str] = None
    status: str
    assigned_organization_id: Optional[str] = None
    assigned_helper_name: Optional[str] = None
    notes: Optional[str] = None
    is_demo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- SOP ---
class SOPDocumentBase(BaseModel):
    title: str
    disaster_type: str
    lifecycle_stage: str
    intended_audience: str = "all"
    geographic_applicability: str = "National / Universal"
    source_organization: str
    source_url: str
    summary: Optional[str] = None
    instructions: List[str] = []
    warnings: List[str] = []
    accessibility_notes: Optional[str] = None
    is_demo: bool = True

class SOPDocumentResponse(SOPDocumentBase):
    id: str
    verification_status: str
    publication_date: datetime
    last_reviewed_at: datetime

    class Config:
        from_attributes = True

# --- MENTAL HEALTH ---
class JournalEntryCreate(BaseModel):
    situation: str
    thoughts: str
    emotions: List[str] = []
    emotional_intensity: int = Field(default=5, ge=1, le=10)
    physical_sensations: Optional[str] = None
    needs: Optional[str] = None
    alternative_perspective: Optional[str] = None

class JournalEntryResponse(JournalEntryCreate):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class GroundingRequest(BaseModel):
    exercise_type: str = "54321" # 54321, gentle_breathing, sensory_orient

class ReframingRequest(BaseModel):
    situation: str
    current_thought: str
    emotion: str

class DistressAssessmentSubmit(BaseModel):
    assessment_type: str = "wellbeing_screen"
    responses: Dict[str, Any]


import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    display_name = Column(String(255), nullable=False)
    active_panel = Column(String(20), default="needer") # helper | needer
    is_verified_helper = Column(Boolean, default=False)
    helper_type = Column(String(50), nullable=True) # ngo, volunteer, sar, medical, relief, shelter, government
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    helper_profile = relationship("HelperProfile", back_populates="user", uselist=False)
    assistance_requests = relationship("AssistanceRequest", back_populates="user")
    journals = relationship("MentalHealthJournal", back_populates="user")


class HelperProfile(Base):
    __tablename__ = "helper_profiles"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    helper_type = Column(String(50), nullable=False)
    verification_status = Column(String(30), default="unverified") # unverified, pending, verified, suspended
    service_categories = Column(JSON, default=list)
    geographic_coverage = Column(JSON, default=list)
    public_contact = Column(String(255), nullable=True)
    accessibility_capabilities = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="helper_profile")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False, index=True)
    organization_type = Column(String(100), default="Humanitarian NGO")
    description = Column(Text, nullable=False)
    assistance_categories = Column(JSON, default=list)
    geographic_coverage = Column(JSON, default=list)
    public_contact = Column(String(255), nullable=False)
    website = Column(String(255), nullable=True)
    verification_status = Column(String(30), default="unverified") # unverified, pending, verified, suspended
    operational_status = Column(String(30), default="active") # active, standby, inactive
    last_verified_at = Column(DateTime, default=datetime.utcnow)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    resources = relationship("HumanitarianResource", back_populates="organization")
    search_groups = relationship("SearchGroup", back_populates="organization")


class DisasterEvent(Base):
    __tablename__ = "disaster_events"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(50), nullable=False) # flood, earthquake, cyclone, etc.
    description = Column(Text, nullable=False)
    region = Column(String(255), nullable=False)
    severity = Column(String(30), default="moderate") # critical, severe, moderate, minor, advisory
    status = Column(String(30), default="active") # active, monitoring, contained, recovered
    lifecycle_stage = Column(String(30), default="response") # prevention, preparedness, mitigation, response, recovery
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    source = Column(String(255), nullable=False)
    verification_status = Column(String(30), default="verified")
    last_verified_at = Column(DateTime, default=datetime.utcnow)
    latitude = Column(Float, default=20.5937)
    longitude = Column(Float, default=78.9629)
    affected_population = Column(Integer, default=0)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    resources = relationship("HumanitarianResource", back_populates="disaster")
    search_groups = relationship("SearchGroup", back_populates="disaster")
    assistance_requests = relationship("AssistanceRequest", back_populates="disaster")


class HumanitarianResource(Base):
    __tablename__ = "humanitarian_resources"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    disaster_id = Column(String(36), ForeignKey("disaster_events.id"), nullable=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(50), nullable=False) # medical, shelter, supplies, food, water, warehouse, equipment
    sub_category = Column(String(100), nullable=True)
    address_approximate = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    operational_status = Column(String(30), default="available") # available, limited, out_of_stock, reserved, in_transit, closed, unknown
    visibility = Column(String(30), default="public") # public, verified_helpers, organization_only, restricted
    accessibility_features = Column(JSON, default=list)
    contact_public = Column(String(255), nullable=True)
    source_attribution = Column(String(255), nullable=False)
    verification_status = Column(String(30), default="verified")
    last_verified_at = Column(DateTime, default=datetime.utcnow)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="resources")
    disaster = relationship("DisasterEvent", back_populates="resources")
    inventory_items = relationship("ResourceInventory", back_populates="resource", cascade="all, delete-orphan")


class ResourceInventory(Base):
    __tablename__ = "resource_inventories"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    resource_id = Column(String(36), ForeignKey("humanitarian_resources.id"), nullable=False)
    item_name = Column(String(255), nullable=False)
    quantity = Column(Float, default=0.0)
    unit = Column(String(50), default="units")
    reserved_quantity = Column(Float, default=0.0)
    inventory_status = Column(String(30), default="available") # available, limited, out_of_stock, reserved
    expiration_date = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    resource = relationship("HumanitarianResource", back_populates="inventory_items")


class SearchGroup(Base):
    __tablename__ = "search_groups"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    disaster_id = Column(String(36), ForeignKey("disaster_events.id"), nullable=True)
    name = Column(String(255), nullable=False)
    capabilities = Column(JSON, default=list)
    service_region = Column(String(255), nullable=False)
    approximate_area = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    public_contact = Column(String(255), nullable=False)
    operational_status = Column(String(30), default="active") # preparing, active, unavailable, completed, disbanded
    verification_status = Column(String(30), default="verified")
    last_verified_at = Column(DateTime, default=datetime.utcnow)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="search_groups")
    disaster = relationship("DisasterEvent", back_populates="search_groups")


class AssistanceRequest(Base):
    __tablename__ = "assistance_requests"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    disaster_id = Column(String(36), ForeignKey("disaster_events.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    user_name = Column(String(255), nullable=True)
    assistance_category = Column(String(50), nullable=False) # medical, food, water, shelter, evacuation, etc.
    description = Column(Text, nullable=False)
    approximate_location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    preferred_contact_method = Column(String(30), default="phone")
    contact_value = Column(String(255), nullable=True)
    accessibility_needs = Column(Text, nullable=True)
    status = Column(String(30), default="submitted") # submitted, under_review, assigned, in_progress, fulfilled, unable_to_fulfill, cancelled
    assigned_organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    assigned_helper_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="assistance_requests")
    disaster = relationship("DisasterEvent", back_populates="assistance_requests")


class SOPDocument(Base):
    __tablename__ = "disaster_sops"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    title = Column(String(255), nullable=False)
    disaster_type = Column(String(50), nullable=False)
    lifecycle_stage = Column(String(30), nullable=False) # prevention, preparedness, mitigation, response, recovery
    intended_audience = Column(String(50), default="all")
    geographic_applicability = Column(String(255), default="National / Universal")
    source_organization = Column(String(255), nullable=False)
    source_url = Column(String(500), nullable=False)
    publication_date = Column(DateTime, default=datetime.utcnow)
    last_reviewed_at = Column(DateTime, default=datetime.utcnow)
    verification_status = Column(String(30), default="verified")
    summary = Column(Text, nullable=True)
    instructions = Column(JSON, default=list)
    warnings = Column(JSON, default=list)
    accessibility_notes = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=False)


class PreparednessChecklistModel(Base):
    __tablename__ = "preparedness_checklists"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    title = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    items = Column(JSON, default=list)


class MentalHealthJournal(Base):
    __tablename__ = "mental_health_journals"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    situation = Column(Text, nullable=False)
    thoughts = Column(Text, nullable=False)
    emotions = Column(JSON, default=list)
    emotional_intensity = Column(Integer, default=5)
    physical_sensations = Column(Text, nullable=True)
    needs = Column(Text, nullable=True)
    alternative_perspective = Column(Text, nullable=True)
    is_encrypted = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="journals")


class MentalHealthAssessment(Base):
    __tablename__ = "mental_health_assessments"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    assessment_type = Column(String(50), default="wellbeing_check")
    responses = Column(JSON, default=dict)
    score = Column(Integer, default=0)
    result_summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    actor_user_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    target_entity = Column(String(100), nullable=False)
    target_id = Column(String(36), nullable=False)
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow)


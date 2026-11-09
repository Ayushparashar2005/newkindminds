from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.entities import (
    DisasterEvent,
    HumanitarianResource,
    AssistanceRequest,
    SearchGroup,
    Organization,
    ResourceInventory
)

router = APIRouter(prefix="/analytics", tags=["Humanitarian Impact Analytics"])

@router.get("/overview")
def get_platform_overview(db: Session = Depends(get_db)):
    """
    Computes real-time totals directly from live DB records.
    """
    active_disasters = db.query(func.count(DisasterEvent.id)).filter(DisasterEvent.status == "active").scalar() or 0
    total_resources = db.query(func.count(HumanitarianResource.id)).scalar() or 0
    available_resources = db.query(func.count(HumanitarianResource.id)).filter(HumanitarianResource.operational_status == "available").scalar() or 0
    active_search_groups = db.query(func.count(SearchGroup.id)).filter(SearchGroup.operational_status == "active").scalar() or 0
    verified_orgs = db.query(func.count(Organization.id)).filter(Organization.verification_status == "verified").scalar() or 0
    
    # Request statuses
    requests_total = db.query(func.count(AssistanceRequest.id)).scalar() or 0
    requests_submitted = db.query(func.count(AssistanceRequest.id)).filter(AssistanceRequest.status == "submitted").scalar() or 0
    requests_assigned = db.query(func.count(AssistanceRequest.id)).filter(AssistanceRequest.status == "assigned").scalar() or 0
    requests_in_progress = db.query(func.count(AssistanceRequest.id)).filter(AssistanceRequest.status == "in_progress").scalar() or 0
    requests_fulfilled = db.query(func.count(AssistanceRequest.id)).filter(AssistanceRequest.status == "fulfilled").scalar() or 0
    requests_unfulfilled = db.query(func.count(AssistanceRequest.id)).filter(AssistanceRequest.status == "unable_to_fulfill").scalar() or 0

    return {
        "active_disasters_count": active_disasters,
        "total_resources_count": total_resources,
        "available_resources_count": available_resources,
        "active_search_groups_count": active_search_groups,
        "verified_organizations_count": verified_orgs,
        "requests": {
            "total": requests_total,
            "submitted": requests_submitted,
            "assigned": requests_assigned,
            "in_progress": requests_in_progress,
            "fulfilled": requests_fulfilled,
            "unable_to_fulfill": requests_unfulfilled
        },
        "last_updated": datetime.utcnow().isoformat(),
        "is_real_calculation": True
    }

@router.get("/regional")
def get_regional_distribution(db: Session = Depends(get_db)):
    """
    Computes regional assistance requests and resource density.
    """
    # Group requests by location/region
    requests = db.query(
        AssistanceRequest.approximate_location,
        AssistanceRequest.assistance_category,
        AssistanceRequest.status
    ).all()

    regional_map = {}
    for r in requests:
        loc = r.approximate_location or "General Region"
        if loc not in regional_map:
            regional_map[loc] = {
                "region": loc,
                "total_requests": 0,
                "fulfilled_requests": 0,
                "categories": {}
            }
        regional_map[loc]["total_requests"] += 1
        if r.status == "fulfilled":
            regional_map[loc]["fulfilled_requests"] += 1
        cat = r.assistance_category
        regional_map[loc]["categories"][cat] = regional_map[loc]["categories"].get(cat, 0) + 1

    return list(regional_map.values())

@router.get("/resource-flow")
def get_resource_flow_data(db: Session = Depends(get_db)):
    """
    Aggregates resource supply levels by category.
    """
    categories = ["medical", "shelter", "supplies", "food", "water", "equipment"]
    breakdown = []
    for cat in categories:
        count = db.query(func.count(HumanitarianResource.id)).filter(HumanitarianResource.category == cat).scalar() or 0
        available = db.query(func.count(HumanitarianResource.id)).filter(
            HumanitarianResource.category == cat,
            HumanitarianResource.operational_status == "available"
        ).scalar() or 0
        breakdown.append({
            "category": cat.capitalize(),
            "total_facilities": count,
            "available_facilities": available,
            "limited_or_out": count - available
        })
    return breakdown


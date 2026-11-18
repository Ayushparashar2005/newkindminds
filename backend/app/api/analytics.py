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
                "awaiting_requests": 0,
                "in_progress_requests": 0,
                "unable_requests": 0,
                "cancelled_requests": 0,
                "categories": {}
            }
        row = regional_map[loc]
        row["total_requests"] += 1
        if r.status == "fulfilled":
            row["fulfilled_requests"] += 1
        elif r.status == "submitted":
            row["awaiting_requests"] += 1
        elif r.status in ("assigned", "in_progress"):
            row["in_progress_requests"] += 1
        elif r.status == "unable_to_fulfill":
            row["unable_requests"] += 1
        elif r.status == "cancelled":
            row["cancelled_requests"] += 1
        cat = r.assistance_category
        row["categories"][cat] = row["categories"].get(cat, 0) + 1

    for row in regional_map.values():
        if row["unable_requests"]:
            row["coverage_status"] = "gap"
        elif row["awaiting_requests"]:
            row["coverage_status"] = "awaiting_response"
        elif row["in_progress_requests"]:
            row["coverage_status"] = "responders_assigned"
        elif row["fulfilled_requests"]:
            row["coverage_status"] = "covered"
        else:
            row["coverage_status"] = "closed"

    # Sectors needing attention first
    order = {"gap": 0, "awaiting_response": 1, "responders_assigned": 2, "covered": 3, "closed": 4}
    return sorted(regional_map.values(), key=lambda r: (order[r["coverage_status"]], -r["total_requests"]))


@router.get("/resource-flow")
def get_resource_flow_data(db: Session = Depends(get_db)):
    """
    Aggregates resource supply levels by category.
    """
    categories = [c for (c,) in db.query(HumanitarianResource.category).distinct().order_by(HumanitarianResource.category).all()]
    breakdown = []
    for cat in categories:
        rows = db.query(HumanitarianResource.operational_status, func.count(HumanitarianResource.id)).filter(
            HumanitarianResource.category == cat
        ).group_by(HumanitarianResource.operational_status).all()
        by_status = {status: n for status, n in rows}
        count = sum(by_status.values())
        available = by_status.get("available", 0)
        limited = by_status.get("limited", 0)
        breakdown.append({
            "category": cat.replace("_", " ").capitalize(),
            "total_facilities": count,
            "available_facilities": available,
            "limited_facilities": limited,
            "unavailable_facilities": count - available - limited,
            "limited_or_out": count - available
        })
    return breakdown


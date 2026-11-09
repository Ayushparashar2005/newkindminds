import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Annotated, List, Optional
from datetime import datetime, timezone
from backend.app.core.database import get_db
from backend.app.models.entities import HumanitarianResource, ResourceInventory
from backend.app.schemas.schemas import (
    HumanitarianResourceResponse,
    HumanitarianResourceCreate,
    HumanitarianResourceUpdate,
    ResourceInventoryCreate,
    ResourceInventoryResponse
)

router = APIRouter(prefix="/resources", tags=["Humanitarian Resources"])

DbSession = Annotated[Session, Depends(get_db)]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two coordinates in kilometres."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get(
    "",
    response_model=List[HumanitarianResourceResponse],
    summary="List humanitarian resources",
    description="Return verified relief resources (shelters, clinics, water points, etc.), with optional filters.",
)
def get_resources(
    db: DbSession,
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    disaster_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None, description="Partial-match name search"),
    visibility: Optional[str] = Query(None),
) -> List[HumanitarianResourceResponse]:
    query = db.query(HumanitarianResource)
    if category:
        query = query.filter(HumanitarianResource.category == category)
    if status:
        query = query.filter(HumanitarianResource.operational_status == status)
    if disaster_id:
        query = query.filter(HumanitarianResource.disaster_id == disaster_id)
    if visibility:
        query = query.filter(HumanitarianResource.visibility == visibility)
    if search:
        query = query.filter(HumanitarianResource.name.ilike(f"%{search}%"))
    return query.order_by(HumanitarianResource.last_verified_at.desc()).all()


@router.get(
    "/nearby",
    response_model=List[HumanitarianResourceResponse],
    summary="Get resources within a radius",
    description="Return resources within `radius_km` kilometres of the given coordinates.",
)
def get_nearby_resources(
    db: DbSession,
    lat: float = Query(..., description="Latitude of the search origin"),
    lng: float = Query(..., description="Longitude of the search origin"),
    radius_km: float = Query(25.0, ge=0.1, le=500, description="Search radius in kilometres"),
    category: Optional[str] = Query(None),
) -> List[HumanitarianResourceResponse]:
    query = db.query(HumanitarianResource)
    if category:
        query = query.filter(HumanitarianResource.category == category)
    return [r for r in query.all() if haversine_km(lat, lng, r.latitude, r.longitude) <= radius_km]


@router.get(
    "/{resource_id}",
    response_model=HumanitarianResourceResponse,
    summary="Get a single humanitarian resource",
)
def get_resource(
    resource_id: str,
    db: DbSession,
) -> HumanitarianResourceResponse:
    res = db.query(HumanitarianResource).filter(HumanitarianResource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    return res


@router.post(
    "",
    response_model=HumanitarianResourceResponse,
    summary="Register a humanitarian resource",
    status_code=201,
)
def create_resource(
    payload: HumanitarianResourceCreate,
    db: DbSession,
) -> HumanitarianResourceResponse:
    res = HumanitarianResource(**payload.dict())
    db.add(res)
    db.commit()
    db.refresh(res)
    return res


@router.patch(
    "/{resource_id}",
    response_model=HumanitarianResourceResponse,
    summary="Update resource details or operational status",
)
def update_resource(
    resource_id: str,
    payload: HumanitarianResourceUpdate,
    db: DbSession,
) -> HumanitarianResourceResponse:
    res = db.query(HumanitarianResource).filter(HumanitarianResource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(res, key, value)
    res.last_verified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(res)
    return res


@router.post(
    "/{resource_id}/inventory",
    response_model=ResourceInventoryResponse,
    summary="Add an inventory line item to a resource",
    status_code=201,
)
def add_inventory_item(
    resource_id: str,
    payload: ResourceInventoryCreate,
    db: DbSession,
) -> ResourceInventoryResponse:
    res = db.query(HumanitarianResource).filter(HumanitarianResource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    inv = ResourceInventory(resource_id=resource_id, **payload.dict())
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv

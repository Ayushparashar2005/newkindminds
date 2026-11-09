from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Annotated, List, Optional
from backend.app.core.database import get_db
from backend.app.models.entities import DisasterEvent
from backend.app.schemas.schemas import DisasterEventResponse, DisasterEventCreate

router = APIRouter(prefix="/disasters", tags=["Disasters"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get(
    "",
    response_model=List[DisasterEventResponse],
    summary="List disaster events",
    description="Return all active or historical disaster events, optionally filtered by category, status or severity.",
)
def get_disasters(
    db: DbSession,
    category: Optional[str] = Query(None, description="e.g. flood, cyclone, earthquake"),
    status: Optional[str] = Query(None, description="e.g. active, resolved"),
    severity: Optional[str] = Query(None, description="e.g. critical, high, moderate"),
) -> List[DisasterEventResponse]:
    query = db.query(DisasterEvent)
    if category:
        query = query.filter(DisasterEvent.category == category)
    if status:
        query = query.filter(DisasterEvent.status == status)
    if severity:
        query = query.filter(DisasterEvent.severity == severity)
    return query.order_by(DisasterEvent.created_at.desc()).all()


@router.get(
    "/{disaster_id}",
    response_model=DisasterEventResponse,
    summary="Get a single disaster event",
)
def get_disaster(
    disaster_id: str,
    db: DbSession,
) -> DisasterEventResponse:
    disaster = db.query(DisasterEvent).filter(DisasterEvent.id == disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster event not found")
    return disaster


@router.post(
    "",
    response_model=DisasterEventResponse,
    summary="Create a disaster event",
    description="Register a new verified disaster event. Requires authorized helper credentials.",
    status_code=201,
)
def create_disaster(
    payload: DisasterEventCreate,
    db: DbSession,
) -> DisasterEventResponse:
    event = DisasterEvent(**payload.dict())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

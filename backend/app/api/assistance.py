from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Annotated, List, Optional
from datetime import datetime, timezone
from backend.app.core.database import get_db
from backend.app.models.entities import AssistanceRequest, User
from backend.app.schemas.schemas import (
    AssistanceRequestCreate,
    AssistanceRequestUpdate,
    AssistanceRequestResponse
)

router = APIRouter(
    prefix="/assistance-requests",
    tags=["Assistance Requests"],
)

DbSession = Annotated[Session, Depends(get_db)]


@router.post(
    "",
    response_model=AssistanceRequestResponse,
    summary="Submit an assistance request",
    description=(
        "Create a new humanitarian assistance request from an affected individual. "
        "If no user_id is provided, a demo needer profile is used for development/testing."
    ),
    status_code=201,
)
def submit_assistance_request(
    payload: AssistanceRequestCreate,
    db: DbSession,
    user_id: Optional[str] = Query(None, description="Authenticated user ID"),
) -> AssistanceRequestResponse:
    # Resolve or create demo needer user when no auth is present
    if not user_id:
        user = db.query(User).filter(User.email == "needer.citizen@kindminds.org").first()
        if not user:
            user = User(
                email="needer.citizen@kindminds.org",
                display_name="Affected Citizen",
                active_panel="needer"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        user_id = user.id

    user = db.query(User).filter(User.id == user_id).first()
    user_name = user.display_name if user else "Community Member"

    req = AssistanceRequest(
        user_id=user_id,
        user_name=user_name,
        disaster_id=payload.disaster_id,
        assistance_category=payload.assistance_category,
        description=payload.description,
        approximate_location=payload.approximate_location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        preferred_contact_method=payload.preferred_contact_method,
        contact_value=payload.contact_value,
        accessibility_needs=payload.accessibility_needs,
        status="submitted",
        is_demo=True,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get(
    "",
    response_model=List[AssistanceRequestResponse],
    summary="List assistance requests",
    description="Return assistance requests, optionally filtered by user, disaster, category, or status.",
)
def get_assistance_requests(
    db: DbSession,
    user_id: Optional[str] = Query(None),
    disaster_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
) -> List[AssistanceRequestResponse]:
    query = db.query(AssistanceRequest)
    if user_id:
        query = query.filter(AssistanceRequest.user_id == user_id)
    if disaster_id:
        query = query.filter(AssistanceRequest.disaster_id == disaster_id)
    if category:
        query = query.filter(AssistanceRequest.assistance_category == category)
    if status:
        query = query.filter(AssistanceRequest.status == status)
    return query.order_by(AssistanceRequest.created_at.desc()).all()


@router.get(
    "/{request_id}",
    response_model=AssistanceRequestResponse,
    summary="Get a single assistance request",
)
def get_assistance_request(
    request_id: str,
    db: DbSession,
) -> AssistanceRequestResponse:
    req = db.query(AssistanceRequest).filter(AssistanceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Assistance request not found")
    return req


@router.patch(
    "/{request_id}",
    response_model=AssistanceRequestResponse,
    summary="Update an assistance request",
    description="Partially update fields on an existing assistance request (e.g. status, notes).",
)
def update_assistance_request(
    request_id: str,
    payload: AssistanceRequestUpdate,
    db: DbSession,
) -> AssistanceRequestResponse:
    req = db.query(AssistanceRequest).filter(AssistanceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Assistance request not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(req, key, value)

    req.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)
    return req


@router.post(
    "/{request_id}/assign",
    response_model=AssistanceRequestResponse,
    summary="Assign a responder to a request",
    description=(
        "Assign a humanitarian organization and named field responder to handle "
        "an open assistance request. Sets status to 'assigned'."
    ),
)
def assign_responder(
    request_id: str,
    db: DbSession,
    organization_id: str = Query(..., description="ID of the responding organization"),
    helper_name: str = Query(..., description="Name of the individual responder or team"),
) -> AssistanceRequestResponse:
    req = db.query(AssistanceRequest).filter(AssistanceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Assistance request not found")

    req.assigned_organization_id = organization_id
    req.assigned_helper_name = helper_name
    req.status = "assigned"
    req.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)
    return req

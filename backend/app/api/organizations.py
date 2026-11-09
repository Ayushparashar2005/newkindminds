from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.models.entities import Organization
from backend.app.schemas.schemas import OrganizationResponse, OrganizationCreate

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("", response_model=List[OrganizationResponse])
def get_organizations(
    verification: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Organization)
    if verification:
        query = query.filter(Organization.verification_status == verification)
    if status:
        query = query.filter(Organization.operational_status == status)
    return query.order_by(Organization.name.asc()).all()

@router.get("/{org_id}", response_model=OrganizationResponse)
def get_organization(org_id: str, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.post("", response_model=OrganizationResponse)
def create_organization(payload: OrganizationCreate, db: Session = Depends(get_db)):
    org = Organization(**payload.dict())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


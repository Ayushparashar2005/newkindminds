from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.entities import SearchGroup
from backend.app.schemas.schemas import SearchGroupResponse, SearchGroupCreate

router = APIRouter(prefix="/search-groups", tags=["Search and Rescue Groups"])

@router.get("", response_model=List[SearchGroupResponse])
def get_search_groups(
    disaster_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(SearchGroup)
    if disaster_id:
        query = query.filter(SearchGroup.disaster_id == disaster_id)
    if status:
        query = query.filter(SearchGroup.operational_status == status)
    return query.order_by(SearchGroup.name.asc()).all()

@router.get("/{group_id}", response_model=SearchGroupResponse)
def get_search_group(group_id: str, db: Session = Depends(get_db)):
    group = db.query(SearchGroup).filter(SearchGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Search group not found")
    return group

@router.post("", response_model=SearchGroupResponse)
def create_search_group(payload: SearchGroupCreate, db: Session = Depends(get_db)):
    group = SearchGroup(**payload.dict())
    db.add(group)
    db.commit()
    db.refresh(group)
    return group

@router.patch("/{group_id}/status", response_model=SearchGroupResponse)
def update_group_status(group_id: str, status: str, db: Session = Depends(get_db)):
    group = db.query(SearchGroup).filter(SearchGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Search group not found")
    group.operational_status = status
    group.last_verified_at = datetime.utcnow()
    db.commit()
    db.refresh(group)
    return group


from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.models.entities import SOPDocument, PreparednessChecklistModel
from backend.app.schemas.schemas import SOPDocumentResponse
from backend.app.ai.groq_client import groq_service

router = APIRouter(prefix="/sops", tags=["Standard Operating Procedures & Guidance"])

@router.get("", response_model=List[SOPDocumentResponse])
def get_sops(
    disaster_type: Optional[str] = Query(None),
    lifecycle_stage: Optional[str] = Query(None),
    audience: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(SOPDocument)
    if disaster_type:
        query = query.filter(SOPDocument.disaster_type == disaster_type)
    if lifecycle_stage:
        query = query.filter(SOPDocument.lifecycle_stage == lifecycle_stage)
    if audience:
        query = query.filter(SOPDocument.intended_audience == audience)
    return query.order_by(SOPDocument.title.asc()).all()

@router.get("/{sop_id}", response_model=SOPDocumentResponse)
def get_sop(sop_id: str, db: Session = Depends(get_db)):
    sop = db.query(SOPDocument).filter(SOPDocument.id == sop_id).first()
    if not sop:
        raise HTTPException(status_code=404, detail="SOP not found")
    return sop

@router.post("/{sop_id}/summarize")
def summarize_sop(sop_id: str, db: Session = Depends(get_db)):
    sop = db.query(SOPDocument).filter(SOPDocument.id == sop_id).first()
    if not sop:
        raise HTTPException(status_code=404, detail="SOP not found")
    
    summary_data = groq_service.summarize_sop(
        title=sop.title,
        instructions=sop.instructions or [],
        audience=sop.intended_audience
    )
    summary_data["source_organization"] = sop.source_organization
    summary_data["source_url"] = sop.source_url
    summary_data["last_reviewed_at"] = sop.last_reviewed_at
    return summary_data

@router.get("/checklists/all")
def get_preparedness_checklists(db: Session = Depends(get_db)):
    checklists = db.query(PreparednessChecklistModel).all()
    return checklists


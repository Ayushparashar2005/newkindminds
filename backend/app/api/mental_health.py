from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.core.database import get_db
from backend.app.models.entities import MentalHealthJournal, MentalHealthAssessment, User
from backend.app.schemas.schemas import (
    JournalEntryCreate,
    JournalEntryResponse,
    GroundingRequest,
    ReframingRequest,
    DistressAssessmentSubmit
)
from backend.app.ai.groq_client import groq_service

router = APIRouter(prefix="/mental-health", tags=["Mental Health Support"])

VERIFIED_HELPLINES = [
    {
        "country": "India",
        "service_name": "KIRAN National Mental Health Helpline",
        "phone_or_code": "1800-599-0019",
        "available_hours": "24/7",
        "languages": ["Hindi", "English", "11 Regional Languages"],
        "service_type": "mental_health",
        "verified_source": "Ministry of Social Justice and Empowerment, Govt. of India",
        "last_verified_at": "2026-01-15T00:00:00Z"
    },
    {
        "country": "India",
        "service_name": "Tele-MANAS Comprehensive Mental Health Helpline",
        "phone_or_code": "14416 / 1800-891-4416",
        "available_hours": "24/7",
        "languages": ["Multilingual across states"],
        "service_type": "mental_health",
        "verified_source": "Ministry of Health and Family Welfare, Govt. of India / NIMHANS",
        "last_verified_at": "2026-02-01T00:00:00Z"
    },
    {
        "country": "India",
        "service_name": "National Emergency Response Support System (ERSS)",
        "phone_or_code": "112",
        "available_hours": "24/7",
        "languages": ["National & State Languages"],
        "service_type": "emergency",
        "verified_source": "Ministry of Home Affairs, Govt. of India",
        "last_verified_at": "2026-01-01T00:00:00Z"
    },
    {
        "country": "International / USA",
        "service_name": "Suicide & Crisis Lifeline",
        "phone_or_code": "988",
        "available_hours": "24/7",
        "languages": ["English", "Spanish", "150+ via interpretation"],
        "service_type": "mental_health",
        "verified_source": "SAMHSA (Substance Abuse and Mental Health Services Administration)",
        "last_verified_at": "2026-01-10T00:00:00Z"
    },
    {
        "country": "International / USA",
        "service_name": "Disaster Distress Helpline",
        "phone_or_code": "1-800-985-5990",
        "available_hours": "24/7",
        "languages": ["Multilingual"],
        "service_type": "disaster",
        "verified_source": "SAMHSA Disaster Behavioral Health",
        "last_verified_at": "2026-01-10T00:00:00Z"
    }
]

@router.get("/helplines")
def get_verified_helplines():
    return {
        "helplines": VERIFIED_HELPLINES,
        "disclaimer": "KindMinds is an informational platform and not an emergency response or clinical service. For life-threatening emergencies, please dial your local emergency number immediately."
    }

@router.post("/grounding")
def get_grounding_exercise(payload: GroundingRequest):
    return groq_service.generate_grounding(payload.exercise_type)

@router.post("/reframe")
def reframe_thought(payload: ReframingRequest):
    return groq_service.reframe_thought(
        situation=payload.situation,
        current_thought=payload.current_thought,
        emotion=payload.emotion
    )

@router.post("/journal", response_model=JournalEntryResponse)
def save_journal_entry(
    payload: JournalEntryCreate,
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not user_id:
        user = db.query(User).first()
        user_id = user.id if user else "demo_user"

    entry = MentalHealthJournal(
        user_id=user_id,
        situation=payload.situation,
        thoughts=payload.thoughts,
        emotions=payload.emotions,
        emotional_intensity=payload.emotional_intensity,
        physical_sensations=payload.physical_sensations,
        needs=payload.needs,
        alternative_perspective=payload.alternative_perspective,
        is_encrypted=True
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.get("/journal", response_model=List[JournalEntryResponse])
def get_journal_entries(
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not user_id:
        user = db.query(User).first()
        user_id = user.id if user else "demo_user"

    entries = db.query(MentalHealthJournal).filter(
        MentalHealthJournal.user_id == user_id
    ).order_by(MentalHealthJournal.created_at.desc()).all()
    return entries

@router.post("/assessment")
def submit_wellbeing_assessment(
    payload: DistressAssessmentSubmit,
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Self-reflection screening tool. Strict disclaimer: NOT a clinical diagnosis.
    """
    if not user_id:
        user = db.query(User).first()
        user_id = user.id if user else "demo_user"

    # Compute a simple self-reflection score
    responses = payload.responses
    total_score = sum(val for val in responses.values() if isinstance(val, (int, float)))
    
    if total_score >= 12:
        interpretation = "Your responses suggest you are experiencing elevated emotional strain. Please prioritize gentle rest and consider reaching out to a professional counselor or trusted support network."
    elif total_score >= 6:
        interpretation = "Your responses suggest mild to moderate stress. Grounding exercises, pacing your day, and staying connected with supportive people can help."
    else:
        interpretation = "Your responses suggest manageable distress levels right now. Continuing self-care routines is recommended."

    record = MentalHealthAssessment(
        user_id=user_id,
        assessment_type=payload.assessment_type,
        responses=responses,
        score=int(total_score),
        result_summary=interpretation
    )
    db.add(record)
    db.commit()

    return {
        "score": total_score,
        "interpretation": interpretation,
        "clinical_disclaimer": "This self-reflection screening is intended purely for personal awareness and stress monitoring. It is NOT a clinical diagnosis or medical evaluation. If you feel overwhelmed, please connect with a qualified mental health practitioner or call a verified helpline."
    }


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

def _line(name, number, hours, languages, kind, source):
    return {
        "country": "India",
        "service_name": name,
        "phone_or_code": number,
        "available_hours": hours,
        "languages": languages,
        "service_type": kind,
        "verified_source": source,
        "last_verified_at": "2026-06-01T00:00:00Z",
    }


VERIFIED_HELPLINES = [
    _line("Emergency Response Support System (ERSS)", "112", "24x7",
          ["Hindi", "English", "State languages"], "emergency", "Ministry of Home Affairs, Govt. of India"),
    _line("Tele-MANAS, National Tele Mental Health Programme", "14416 / 1-800-891-4416", "24x7, free",
          ["20+ Indian languages"], "mental_health", "Ministry of Health & Family Welfare / NIMHANS"),
    _line("Ambulance (National Ambulance Service)", "108", "24x7",
          ["State languages"], "emergency", "National Health Mission, state health departments"),
    _line("NDMA Disaster Management Helpline", "1078", "24x7",
          ["Hindi", "English"], "disaster", "National Disaster Management Authority, Govt. of India"),
    _line("State Emergency Operation Centre / District Control Room", "1070 / 1077", "24x7",
          ["State languages"], "disaster", "State Disaster Management Authorities"),
    _line("Women Helpline", "181", "24x7",
          ["State languages"], "women_child", "Ministry of Women & Child Development, Govt. of India"),
    _line("Childline (Child Helpline)", "1098", "24x7, free",
          ["State languages"], "women_child", "Ministry of Women & Child Development, Govt. of India"),
    _line("Elder Line, National Helpline for Senior Citizens", "14567", "8 AM to 8 PM",
          ["Hindi", "English", "State languages"], "mental_health", "Ministry of Social Justice & Empowerment, Govt. of India"),
    _line("Vandrevala Foundation Mental Health Helpline", "+91 9999 666 555", "24x7, free",
          ["Hindi", "English", "Other languages"], "mental_health", "Vandrevala Foundation (NGO)"),
    _line("iCall Psychosocial Helpline", "9152987821", "Mon to Sat, 10 AM to 8 PM",
          ["Hindi", "English", "Marathi", "Other languages"], "mental_health", "Tata Institute of Social Sciences (TISS), Mumbai"),
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


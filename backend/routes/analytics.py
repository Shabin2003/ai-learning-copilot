"""Analytics API routes."""

from fastapi import APIRouter, HTTPException
from models.schemas import SessionAnalytics
from services.database import get_session_analytics, get_session

router = APIRouter()


@router.get("/{session_id}", response_model=SessionAnalytics)
async def get_analytics(session_id: str):
    """Get comprehensive analytics for a session."""
    data = await get_session_analytics(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionAnalytics(**data)


@router.get("/{session_id}/summary")
async def get_session_summary(session_id: str):
    """Get a quick session summary."""
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    accuracy = (
        session.correct_answers / session.total_questions * 100
        if session.total_questions > 0 else 0
    )
    
    level = max(1, session.xp_points // 100)
    next_level_xp = level * 100
    
    return {
        "session_id": session_id,
        "student_name": session.student_name,
        "questions_answered": session.total_questions,
        "accuracy": round(accuracy, 1),
        "current_streak": session.streak,
        "xp_points": session.xp_points,
        "level": level,
        "current_topic": session.current_topic,
        "difficulty": session.difficulty,
        "weak_areas_count": len(session.weak_areas),
        "completed_topics": len(session.completed_topics),
    }

"""Session management API routes."""

from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime

from models.schemas import (
    CreateSessionRequest, SessionResponse, LearningPathRequest, LearningPathResponse
)
from services.database import create_session, get_session, update_session
from agents.planner import generate_learning_path, _get_fallback_path
from agents.diagnostic import run_diagnostic

router = APIRouter()


@router.post("/", response_model=SessionResponse)
async def create_new_session(request: CreateSessionRequest):
    """Create a new learning session."""
    session_id = str(uuid.uuid4())
    
    # Determine initial topic
    initial_topic = request.initial_topic or _default_topic(
        request.subject.value, request.grade_level
    )
    
    # Get initial learning path
    path_data = _get_fallback_path(request.subject.value, initial_topic)
    
    session_data = {
        "session_id": session_id,
        "student_name": request.student_name,
        "grade_level": request.grade_level,
        "subject": request.subject.value,
        "difficulty": request.difficulty_preference.value,
        "current_topic": initial_topic,
        "learning_path": path_data["topics"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    session = await create_session(session_data)
    
    return SessionResponse(
        session_id=session_id,
        student_name=request.student_name,
        subject=request.subject.value,
        difficulty=request.difficulty_preference.value,
        created_at=session.created_at,
        learning_path=path_data["topics"],
        current_topic=initial_topic,
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session_info(session_id: str):
    """Get session information."""
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionResponse(
        session_id=session.session_id,
        student_name=session.student_name,
        subject=session.subject,
        difficulty=session.difficulty,
        created_at=session.created_at,
        learning_path=session.learning_path,
        current_topic=session.current_topic,
    )


@router.post("/{session_id}/learning-path", response_model=LearningPathResponse)
async def regenerate_learning_path(session_id: str, request: LearningPathRequest):
    """Regenerate the learning path using the Planner agent."""
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Run diagnostic first
    diagnostic = await run_diagnostic(session)
    
    # Generate personalized path
    path_data = await generate_learning_path(session, diagnostic)
    
    # Update session
    current_idx = 0
    if session.current_topic in path_data.get("topics", []):
        current_idx = path_data["topics"].index(session.current_topic)
    
    await update_session(session_id, {
        "learning_path": path_data.get("topics", []),
    })
    
    return LearningPathResponse(
        session_id=session_id,
        topics=path_data.get("topics", []),
        current_index=current_idx,
        estimated_sessions=path_data.get("estimated_sessions", 5),
        personalization_notes=path_data.get("personalization_notes", ""),
    )


def _default_topic(subject: str, grade_level: int) -> str:
    """Get default starting topic based on subject and grade."""
    defaults = {
        "math": {
            range(1, 4): "Addition & Subtraction",
            range(4, 7): "Multiplication & Division",
            range(7, 10): "Algebra Basics",
            range(10, 13): "Advanced Algebra",
        },
        "science": {
            range(1, 5): "Matter & Properties",
            range(5, 8): "Ecosystems",
            range(8, 10): "Chemistry Basics",
            range(10, 13): "Physics",
        },
        "english": {
            range(1, 4): "Grammar Basics",
            range(4, 7): "Reading Comprehension",
            range(7, 10): "Essay Writing",
            range(10, 13): "Literary Analysis",
        },
        "coding": {
            range(1, 5): "Variables & Data Types",
            range(5, 8): "Conditionals & Loops",
            range(8, 10): "Functions",
            range(10, 13): "OOP Concepts",
        },
    }
    
    subject_defaults = defaults.get(subject, {})
    for grade_range, topic in subject_defaults.items():
        if grade_level in grade_range:
            return topic
    
    return "Introduction"

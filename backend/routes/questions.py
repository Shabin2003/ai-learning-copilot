"""
Questions API - The adaptive learning loop.
Question → Answer → Evaluation → Next Question
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
import uuid
from datetime import datetime

from models.schemas import (
    GenerateQuestionRequest, QuestionResponse, QuestionOption,
    SubmitAnswerRequest, AnswerResponse, EvaluationResult,
    ExplainConceptRequest, ExplainConceptResponse
)
from models.documents import QuestionAttempt
from services.database import get_session, update_session, add_attempt
from agents.question_generator import generate_question
from agents.evaluator import evaluate_answer, calculate_xp
from agents.engagement import (
    analyze_engagement, update_session_performance, 
    get_streak_message, calculate_session_health
)
from agents.explainer import explain_concept

router = APIRouter()


@router.post("/generate", response_model=QuestionResponse)
async def get_next_question(request: GenerateQuestionRequest):
    """Generate the next adaptive question for a student."""
    session = await get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Generate question using Question Generator agent
    question_data = await generate_question(
        session=session,
        topic=request.topic,
        difficulty_override=request.difficulty_override,
    )
    
    # Store active question in session
    await update_session(request.session_id, {
        "active_question_id": question_data["question_id"],
        "active_question_data": question_data,
    })
    
    # Format options
    options = None
    if question_data.get("options"):
        options = [
            QuestionOption(id=opt["id"], text=opt["text"])
            for opt in question_data["options"]
        ]
    
    return QuestionResponse(
        question_id=question_data["question_id"],
        session_id=request.session_id,
        question_text=question_data["question_text"],
        question_type=question_data.get("question_type", "short_answer"),
        options=options,
        topic=question_data.get("topic", session.current_topic),
        difficulty=question_data.get("difficulty", session.difficulty),
        hint=question_data.get("hint"),
        estimated_time_seconds=question_data.get("estimated_time_seconds", 60),
    )


@router.post("/submit", response_model=AnswerResponse)
async def submit_answer(request: SubmitAnswerRequest):
    """
    Submit an answer - triggers the full evaluation pipeline:
    1. Evaluate answer
    2. Update session state
    3. Generate next question
    """
    session = await get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get active question data
    question_data = session.active_question_data
    if not question_data or question_data.get("question_id") != request.question_id:
        raise HTTPException(status_code=400, detail="Question not found in active session")
    
    # Calculate topic accuracy for context
    topic = question_data.get("topic", session.current_topic)
    topic_attempts = [a for a in session.attempts if a.topic == topic]
    topic_accuracy = (
        sum(1 for a in topic_attempts if a.is_correct) / len(topic_attempts)
        if topic_attempts else 0.0
    )
    
    # Run Evaluator agent
    evaluation = await evaluate_answer(
        question_data=question_data,
        student_answer=request.student_answer,
        time_taken=request.time_taken_seconds,
        student_name=session.student_name,
        grade_level=session.grade_level,
        subject=session.subject,
        topic_accuracy=topic_accuracy,
    )
    
    # Calculate XP
    xp_earned = calculate_xp(
        is_correct=evaluation.is_correct,
        score=evaluation.score,
        difficulty=question_data.get("difficulty", "intermediate"),
        streak=session.streak,
    )
    
    # Update session performance (Engagement agent)
    perf_updates = update_session_performance(
        session=session,
        is_correct=evaluation.is_correct,
        score=evaluation.score,
        weak_concepts=evaluation.weak_concepts,
        topic=topic,
    )
    
    # Save attempt to DB
    attempt = QuestionAttempt(
        question_id=request.question_id,
        question_text=question_data["question_text"],
        topic=topic,
        difficulty=question_data.get("difficulty", "intermediate"),
        student_answer=request.student_answer,
        correct_answer=evaluation.correct_answer,
        is_correct=evaluation.is_correct,
        score=evaluation.score,
        time_taken_seconds=request.time_taken_seconds,
        weak_concepts=evaluation.weak_concepts,
    )
    await add_attempt(request.session_id, attempt)
    
    # Analyze engagement
    engagement = analyze_engagement(
        session=session,
        latest_time=request.time_taken_seconds,
        expected_time=question_data.get("estimated_time_seconds", 60),
    )
    
    # Handle topic advancement
    should_advance = perf_updates.pop("should_advance_topic", False)
    if should_advance and session.learning_path:
        current_path = session.learning_path
        current_idx = next(
            (i for i, t in enumerate(current_path) if t == session.current_topic), 
            0
        )
        if current_idx + 1 < len(current_path):
            next_topic = current_path[current_idx + 1]
            completed = list(session.completed_topics)
            if session.current_topic not in completed:
                completed.append(session.current_topic)
            perf_updates["current_topic"] = next_topic
            perf_updates["completed_topics"] = completed
    
    # Update XP
    perf_updates["xp_points"] = session.xp_points + xp_earned
    perf_updates["active_question_id"] = None
    perf_updates["active_question_data"] = None
    
    await update_session(request.session_id, perf_updates)
    
    # Reload session for next question generation
    updated_session = await get_session(request.session_id)
    
    # Generate next question
    next_question_data = await generate_question(session=updated_session)
    
    # Store next active question
    await update_session(request.session_id, {
        "active_question_id": next_question_data["question_id"],
        "active_question_data": next_question_data,
    })
    
    # Format next question
    next_options = None
    if next_question_data.get("options"):
        next_options = [
            QuestionOption(id=opt["id"], text=opt["text"])
            for opt in next_question_data["options"]
        ]
    
    next_question = QuestionResponse(
        question_id=next_question_data["question_id"],
        session_id=request.session_id,
        question_text=next_question_data["question_text"],
        question_type=next_question_data.get("question_type", "short_answer"),
        options=next_options,
        topic=next_question_data.get("topic", updated_session.current_topic),
        difficulty=next_question_data.get("difficulty", updated_session.difficulty),
        hint=next_question_data.get("hint"),
        estimated_time_seconds=next_question_data.get("estimated_time_seconds", 60),
    )
    
    return AnswerResponse(
        evaluation=evaluation,
        next_question=next_question,
        session_updated=True,
        streak=perf_updates.get("streak", 0),
        total_score=float(updated_session.xp_points + xp_earned),
    )


@router.post("/explain", response_model=ExplainConceptResponse)
async def explain_topic(request: ExplainConceptRequest):
    """Get a detailed explanation of a concept using the Explainer agent."""
    session = await get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    explanation_data = await explain_concept(
        concept=request.concept,
        grade_level=session.grade_level,
        subject=session.subject,
        weak_areas=session.weak_areas,
        depth=request.depth,
    )
    
    return ExplainConceptResponse(
        concept=request.concept,
        explanation=explanation_data.get("explanation", ""),
        examples=explanation_data.get("examples", []),
        analogies=explanation_data.get("analogies", []),
        practice_suggestion=explanation_data.get("practice_suggestion", ""),
    )

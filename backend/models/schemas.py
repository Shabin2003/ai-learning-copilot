"""Pydantic models for request/response schemas."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum


class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class SubjectArea(str, Enum):
    MATH = "math"
    SCIENCE = "science"
    ENGLISH = "english"
    HISTORY = "history"
    CODING = "coding"
    GENERAL = "general"


# ─── Session Models ────────────────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    student_name: str
    grade_level: int = Field(ge=1, le=12)
    subject: SubjectArea
    initial_topic: Optional[str] = None
    difficulty_preference: DifficultyLevel = DifficultyLevel.INTERMEDIATE


class SessionResponse(BaseModel):
    session_id: str
    student_name: str
    subject: str
    difficulty: str
    created_at: datetime
    learning_path: List[str]
    current_topic: str


# ─── Question Models ───────────────────────────────────────────────────────────

class GenerateQuestionRequest(BaseModel):
    session_id: str
    topic: Optional[str] = None
    difficulty_override: Optional[DifficultyLevel] = None


class QuestionOption(BaseModel):
    id: str
    text: str


class QuestionResponse(BaseModel):
    question_id: str
    session_id: str
    question_text: str
    question_type: Literal["mcq", "short_answer", "true_false", "fill_blank"]
    options: Optional[List[QuestionOption]] = None
    topic: str
    difficulty: DifficultyLevel
    hint: Optional[str] = None
    estimated_time_seconds: int = 60


class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    student_answer: str
    time_taken_seconds: int


class EvaluationResult(BaseModel):
    is_correct: bool
    score: float = Field(ge=0.0, le=1.0)
    feedback: str
    correct_answer: str
    explanation: str
    weak_concepts: List[str]
    encouragement: str


class AnswerResponse(BaseModel):
    evaluation: EvaluationResult
    next_question: Optional[QuestionResponse] = None
    session_updated: bool
    streak: int
    total_score: float


# ─── Analytics Models ─────────────────────────────────────────────────────────

class TopicPerformance(BaseModel):
    topic: str
    attempts: int
    correct: int
    accuracy: float
    avg_time_seconds: float
    trend: Literal["improving", "declining", "stable"]


class SessionAnalytics(BaseModel):
    session_id: str
    student_name: str
    total_questions: int
    correct_answers: int
    overall_accuracy: float
    total_time_minutes: float
    current_difficulty: DifficultyLevel
    streak: int
    weak_areas: List[str]
    strong_areas: List[str]
    topic_performance: List[TopicPerformance]
    learning_path: List[str]
    completed_topics: List[str]
    xp_points: int
    level: int


# ─── Agent Models ──────────────────────────────────────────────────────────────

class AgentRunRequest(BaseModel):
    session_id: str
    agent_type: Literal["diagnostic", "planner", "explainer", "engagement"]
    context: Optional[Dict[str, Any]] = None


class AgentRunResponse(BaseModel):
    agent_type: str
    result: Dict[str, Any]
    tokens_used: int
    duration_ms: int


class LearningPathRequest(BaseModel):
    session_id: str
    force_regenerate: bool = False


class LearningPathResponse(BaseModel):
    session_id: str
    topics: List[str]
    current_index: int
    estimated_sessions: int
    personalization_notes: str


class ExplainConceptRequest(BaseModel):
    session_id: str
    concept: str
    depth: Literal["brief", "detailed", "eli5"] = "detailed"


class ExplainConceptResponse(BaseModel):
    concept: str
    explanation: str
    examples: List[str]
    analogies: List[str]
    practice_suggestion: str

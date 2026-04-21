"""MongoDB document models."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId


class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)


class QuestionAttempt(BaseModel):
    question_id: str
    question_text: str
    topic: str
    difficulty: str
    student_answer: str
    correct_answer: str
    is_correct: bool
    score: float
    time_taken_seconds: int
    weak_concepts: List[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StudentSession(BaseModel):
    session_id: str
    student_name: str
    grade_level: int
    subject: str
    difficulty: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Learning state
    current_topic: str
    learning_path: List[str] = []
    completed_topics: List[str] = []
    weak_areas: List[str] = []
    strong_areas: List[str] = []
    
    # Performance tracking
    attempts: List[QuestionAttempt] = []
    total_questions: int = 0
    correct_answers: int = 0
    streak: int = 0
    max_streak: int = 0
    xp_points: int = 0
    
    # Adaptive difficulty
    current_difficulty_score: float = 0.5  # 0-1 scale
    consecutive_correct: int = 0
    consecutive_wrong: int = 0
    
    # Topic performance cache
    topic_stats: Dict[str, Dict[str, Any]] = {}
    
    # Active question
    active_question_id: Optional[str] = None
    active_question_data: Optional[Dict[str, Any]] = None

    class Config:
        arbitrary_types_allowed = True

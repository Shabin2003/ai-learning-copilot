"""
Question Generator Agent
Creates adaptive questions based on topic, difficulty, and student history.
"""

from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import Dict, Any, Optional, List
import uuid
import json

from services.llm import get_llm
from models.documents import StudentSession
from models.schemas import DifficultyLevel, QuestionResponse, QuestionOption


QUESTION_GENERATOR_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert question generator for adaptive learning.
    Create engaging, educationally sound questions that:
    - Match the exact difficulty level requested
    - Target specific concepts (especially weak ones)  
    - Vary in type to maintain engagement
    - Include helpful hints for struggling students
    - Avoid repeating recent questions
    
    Return ONLY valid JSON in this exact format:
    {{
        "question_text": "The full question text",
        "question_type": "mcq|short_answer|true_false|fill_blank",
        "options": [
            {{"id": "A", "text": "Option text"}},
            {{"id": "B", "text": "Option text"}},
            {{"id": "C", "text": "Option text"}},
            {{"id": "D", "text": "Option text"}}
        ],
        "correct_answer": "A (or the actual answer text for non-MCQ)",
        "topic": "specific topic tested",
        "difficulty": "beginner|intermediate|advanced",
        "hint": "A helpful hint without giving away the answer",
        "estimated_time_seconds": 60,
        "concepts_tested": ["concept1", "concept2"],
        "explanation_preview": "Why this tests an important concept"
    }}
    
    For true_false: options should be [{{"id":"A","text":"True"}},{{"id":"B","text":"False"}}]
    For short_answer/fill_blank: options should be []
    """),
    ("human", """
    Student: {student_name}, Grade {grade_level}
    Subject: {subject}
    Topic to test: {topic}
    Difficulty level: {difficulty}
    
    Student's weak areas: {weak_areas}
    Recent topics covered: {recent_topics}
    Questions to avoid repeating: {avoid_questions}
    
    Preferred question type (vary it): {preferred_type}
    
    Generate ONE adaptive question now.
    """)
])


QUESTION_TYPES = ["mcq", "mcq", "mcq", "short_answer", "true_false", "fill_blank"]


async def generate_question(
    session: StudentSession,
    topic: Optional[str] = None,
    difficulty_override: Optional[DifficultyLevel] = None,
) -> Dict[str, Any]:
    """Generate an adaptive question for the student."""
    llm = get_llm(temperature=0.8)
    parser = JsonOutputParser()
    chain = QUESTION_GENERATOR_PROMPT | llm | parser

    # Determine topic and difficulty
    target_topic = topic or session.current_topic
    
    # Occasionally test weak areas (30% chance)
    import random
    if session.weak_areas and random.random() < 0.3:
        target_topic = random.choice(session.weak_areas)
    
    difficulty = difficulty_override or DifficultyLevel(session.difficulty)
    
    # Vary question types
    q_idx = session.total_questions % len(QUESTION_TYPES)
    preferred_type = QUESTION_TYPES[q_idx]
    
    # Recent topics for context
    recent_topics = list(set([a.topic for a in session.attempts[-5:]])) if session.attempts else []
    
    # Questions to avoid (recent ones)
    avoid_questions = [a.question_text[:60] for a in session.attempts[-3:]] if session.attempts else []

    try:
        result = await chain.ainvoke({
            "student_name": session.student_name,
            "grade_level": session.grade_level,
            "subject": session.subject,
            "topic": target_topic,
            "difficulty": difficulty.value,
            "weak_areas": ", ".join(session.weak_areas[:5]) or "none identified",
            "recent_topics": ", ".join(recent_topics) or "none",
            "avoid_questions": "; ".join(avoid_questions) or "none",
            "preferred_type": preferred_type,
        })
        
        # Add a unique ID
        result["question_id"] = str(uuid.uuid4())
        result["session_id"] = session.session_id
        
        return result
    except Exception as e:
        return _fallback_question(session, target_topic, difficulty)


def _fallback_question(session: StudentSession, topic: str, difficulty: DifficultyLevel) -> Dict:
    """Fallback question if LLM fails."""
    return {
        "question_id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "question_text": f"Explain the concept of {topic} in your own words.",
        "question_type": "short_answer",
        "options": [],
        "correct_answer": f"A clear explanation of {topic}",
        "topic": topic,
        "difficulty": difficulty.value,
        "hint": f"Think about the key properties of {topic}",
        "estimated_time_seconds": 90,
        "concepts_tested": [topic],
        "explanation_preview": "Tests fundamental understanding"
    }

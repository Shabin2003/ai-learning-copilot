"""
Planner Agent
Generates personalized learning paths and adjusts difficulty dynamically.
"""

from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import List, Dict, Any, Optional
import json

from services.llm import get_llm
from models.documents import StudentSession
from models.schemas import DifficultyLevel


PLANNER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert curriculum planner for adaptive learning.
    Create a personalized, sequenced learning path based on the student's current state.
    
    Principles:
    - Start with prerequisites before advanced concepts
    - Interleave weak areas with manageable challenges
    - Include spaced repetition for previously weak areas
    - Limit path to 8-12 topics for manageability
    
    Return ONLY valid JSON:
    {{
        "topics": ["topic1", "topic2", ...],
        "current_index": 0,
        "estimated_sessions": 5,
        "personalization_notes": "Why this path was chosen",
        "difficulty_trajectory": ["beginner", "intermediate", "advanced"],
        "review_topics": ["topic_for_review"]
    }}
    """),
    ("human", """
    Student: {student_name}, Grade {grade_level}
    Subject: {subject}
    Current topic: {current_topic}
    Weak areas: {weak_areas}
    Strong areas: {strong_areas}
    Completed topics: {completed_topics}
    Current difficulty: {difficulty}
    Overall accuracy: {accuracy}%
    
    Diagnostic insights: {diagnostic_insights}
    
    Generate an optimized learning path.
    """)
])


async def generate_learning_path(
    session: StudentSession, 
    diagnostic_result: Optional[Dict] = None
) -> Dict[str, Any]:
    """Generate a personalized learning path."""
    llm = get_llm(temperature=0.4)
    parser = JsonOutputParser()
    chain = PLANNER_PROMPT | llm | parser

    accuracy = (
        session.correct_answers / session.total_questions * 100
        if session.total_questions > 0 else 50
    )

    diagnostic_insights = "No diagnostic run yet"
    if diagnostic_result:
        diagnostic_insights = diagnostic_result.get("diagnostic_summary", "")

    try:
        result = await chain.ainvoke({
            "student_name": session.student_name,
            "grade_level": session.grade_level,
            "subject": session.subject,
            "current_topic": session.current_topic,
            "weak_areas": ", ".join(session.weak_areas) or "none identified",
            "strong_areas": ", ".join(session.strong_areas) or "none identified",
            "completed_topics": ", ".join(session.completed_topics) or "none",
            "difficulty": session.difficulty,
            "accuracy": round(accuracy, 1),
            "diagnostic_insights": diagnostic_insights,
        })
        return result
    except Exception as e:
        # Fallback path based on subject
        return _get_fallback_path(session.subject, session.current_topic)


def _get_fallback_path(subject: str, current_topic: str) -> Dict[str, Any]:
    """Fallback learning paths by subject."""
    paths = {
        "math": [
            "Number Sense", "Addition & Subtraction", "Multiplication",
            "Division", "Fractions", "Decimals", "Percentages",
            "Basic Algebra", "Geometry", "Statistics"
        ],
        "science": [
            "Scientific Method", "Matter & Properties", "Forces & Motion",
            "Energy", "Ecosystems", "Cell Biology", "Chemistry Basics",
            "Physics", "Earth Science", "Space"
        ],
        "english": [
            "Grammar Basics", "Vocabulary", "Reading Comprehension",
            "Writing Structure", "Punctuation", "Essay Writing",
            "Literary Analysis", "Poetry", "Research Skills", "Persuasive Writing"
        ],
        "coding": [
            "Variables & Data Types", "Conditionals", "Loops",
            "Functions", "Arrays & Lists", "Strings",
            "OOP Concepts", "Recursion", "Algorithms", "Data Structures"
        ],
    }
    
    topic_list = paths.get(subject, ["Introduction", "Core Concepts", 
                                      "Practice", "Advanced Topics"])
    
    return {
        "topics": topic_list,
        "current_index": 0,
        "estimated_sessions": len(topic_list),
        "personalization_notes": "Default curriculum path",
        "difficulty_trajectory": ["beginner"] * 3 + ["intermediate"] * 4 + ["advanced"] * 3,
        "review_topics": []
    }


def calculate_adaptive_difficulty(session: StudentSession) -> DifficultyLevel:
    """
    Adaptive difficulty algorithm:
    - 3 consecutive correct → increase difficulty
    - 3 consecutive wrong → decrease difficulty  
    - Otherwise maintain current
    """
    if session.consecutive_correct >= 3:
        if session.difficulty == DifficultyLevel.BEGINNER:
            return DifficultyLevel.INTERMEDIATE
        elif session.difficulty == DifficultyLevel.INTERMEDIATE:
            return DifficultyLevel.ADVANCED
    
    if session.consecutive_wrong >= 3:
        if session.difficulty == DifficultyLevel.ADVANCED:
            return DifficultyLevel.INTERMEDIATE
        elif session.difficulty == DifficultyLevel.INTERMEDIATE:
            return DifficultyLevel.BEGINNER
    
    return DifficultyLevel(session.difficulty)


def calculate_difficulty_score(session: StudentSession) -> float:
    """
    Calculate a 0-1 difficulty score for granular adaptation.
    0 = very easy, 1 = very hard
    """
    if session.total_questions < 3:
        return 0.5
    
    # Recent accuracy (last 5 questions)
    recent = session.attempts[-5:]
    recent_acc = sum(1 for a in recent if a.is_correct) / len(recent)
    
    # Target accuracy is 0.7 (70%) - Vygotsky's Zone of Proximal Development
    # If accuracy > 0.7, increase difficulty; if < 0.7, decrease
    current_score = session.current_difficulty_score
    
    if recent_acc > 0.85:
        new_score = min(1.0, current_score + 0.1)
    elif recent_acc > 0.7:
        new_score = min(1.0, current_score + 0.05)
    elif recent_acc < 0.5:
        new_score = max(0.0, current_score - 0.1)
    elif recent_acc < 0.6:
        new_score = max(0.0, current_score - 0.05)
    else:
        new_score = current_score
    
    return round(new_score, 2)


def score_to_difficulty_level(score: float) -> DifficultyLevel:
    """Convert 0-1 score to difficulty level."""
    if score < 0.35:
        return DifficultyLevel.BEGINNER
    elif score < 0.7:
        return DifficultyLevel.INTERMEDIATE
    else:
        return DifficultyLevel.ADVANCED

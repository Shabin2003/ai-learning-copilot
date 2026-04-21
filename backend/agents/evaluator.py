"""
Evaluator Agent
Assesses student answers with partial scoring and detailed feedback.
"""

from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import Dict, Any, Optional
import json

from services.llm import get_llm
from models.schemas import EvaluationResult


EVALUATOR_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a fair, encouraging educational evaluator.
    Assess the student's answer with:
    - Precise correctness determination
    - Partial credit where reasoning shows understanding
    - Specific, actionable feedback
    - Encouragement that's authentic (not generic)
    
    Scoring guide:
    - 1.0: Fully correct
    - 0.7-0.9: Mostly correct, minor errors
    - 0.4-0.6: Partial understanding shown
    - 0.1-0.3: Some attempt but mostly wrong
    - 0.0: Completely wrong or no attempt
    
    Return ONLY valid JSON:
    {{
        "is_correct": true/false,
        "score": 0.0-1.0,
        "feedback": "Specific feedback on their answer",
        "correct_answer": "The full correct answer",
        "explanation": "Clear explanation of the concept",
        "weak_concepts": ["concept they didn't understand"],
        "encouragement": "Personalized encouraging message",
        "partial_credit_reason": "Why partial credit was given (if any)"
    }}
    """),
    ("human", """
    Student: {student_name} (Grade {grade_level})
    Subject: {subject}, Topic: {topic}
    Difficulty: {difficulty}
    
    Question: {question_text}
    Question Type: {question_type}
    {options_text}
    
    Student's answer: {student_answer}
    Correct answer: {correct_answer}
    Time taken: {time_taken} seconds (expected: ~{expected_time} seconds)
    
    Previous attempts on this topic: {topic_accuracy}% accuracy
    
    Evaluate this answer comprehensively.
    """)
])


async def evaluate_answer(
    question_data: Dict[str, Any],
    student_answer: str,
    time_taken: int,
    student_name: str,
    grade_level: int,
    subject: str,
    topic_accuracy: float = 0.0,
) -> EvaluationResult:
    """Evaluate a student's answer."""
    llm = get_llm(temperature=0.2)
    parser = JsonOutputParser()
    chain = EVALUATOR_PROMPT | llm | parser

    # Format options if MCQ
    options_text = ""
    if question_data.get("options"):
        options_text = "Options:\n" + "\n".join(
            f"{opt['id']}. {opt['text']}" 
            for opt in question_data["options"]
        )

    try:
        result = await chain.ainvoke({
            "student_name": student_name,
            "grade_level": grade_level,
            "subject": subject,
            "topic": question_data.get("topic", ""),
            "difficulty": question_data.get("difficulty", "intermediate"),
            "question_text": question_data.get("question_text", ""),
            "question_type": question_data.get("question_type", "short_answer"),
            "options_text": options_text,
            "student_answer": student_answer,
            "correct_answer": question_data.get("correct_answer", ""),
            "time_taken": time_taken,
            "expected_time": question_data.get("estimated_time_seconds", 60),
            "topic_accuracy": round(topic_accuracy * 100, 1),
        })
        
        return EvaluationResult(
            is_correct=result.get("is_correct", False),
            score=float(result.get("score", 0.0)),
            feedback=result.get("feedback", "Good attempt!"),
            correct_answer=result.get("correct_answer", question_data.get("correct_answer", "")),
            explanation=result.get("explanation", ""),
            weak_concepts=result.get("weak_concepts", []),
            encouragement=result.get("encouragement", "Keep going!"),
        )
    except Exception as e:
        # Fallback: simple string match evaluation
        is_correct = _simple_check(student_answer, question_data.get("correct_answer", ""))
        return EvaluationResult(
            is_correct=is_correct,
            score=1.0 if is_correct else 0.0,
            feedback="Your answer has been recorded." if is_correct else "That's not quite right.",
            correct_answer=question_data.get("correct_answer", ""),
            explanation="Review the concept and try again.",
            weak_concepts=[question_data.get("topic", "")],
            encouragement="Keep practicing!",
        )


def _simple_check(student_answer: str, correct_answer: str) -> bool:
    """Simple string-based correctness check as fallback."""
    s = student_answer.strip().lower()
    c = correct_answer.strip().lower()
    
    # Direct match
    if s == c:
        return True
    
    # For MCQ (A, B, C, D)
    if len(s) == 1 and len(c) >= 1:
        return s == c[0].lower()
    
    # Partial match for longer answers
    if len(c) > 10:
        words = c.split()
        match_count = sum(1 for w in words if w in s)
        return match_count / len(words) > 0.6
    
    return False


def calculate_xp(is_correct: bool, score: float, difficulty: str, streak: int) -> int:
    """Calculate XP points earned."""
    base_xp = {
        "beginner": 10,
        "intermediate": 20,
        "advanced": 35
    }.get(difficulty, 15)
    
    # Score multiplier
    xp = int(base_xp * score)
    
    # Streak bonus
    if streak >= 5:
        xp = int(xp * 1.5)
    elif streak >= 3:
        xp = int(xp * 1.25)
    
    return max(0, xp)

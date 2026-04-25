"""
Diagnostic Agent
Analyzes student responses to identify weak concepts and knowledge gaps.
"""

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import List, Dict, Any
import json

from services.llm import get_llm
from models.documents import StudentSession


DIAGNOSTIC_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert educational diagnostician. 
    Analyze the student's performance data and identify:
    1. Specific concept gaps and weak areas
    2. Common misconceptions
    3. Prerequisite skills that may be missing
    4. Pattern of errors
    
    Respond ONLY with valid JSON in this exact format:
    {{
        "weak_concepts": ["concept1", "concept2"],
        "strong_concepts": ["concept1"],
        "misconceptions": ["description of misconception"],
        "prerequisite_gaps": ["skill1", "skill2"],
        "error_patterns": ["pattern description"],
        "confidence_score": 0.8,
        "diagnostic_summary": "Brief summary of student state"
    }}
    """),
    ("human", """
    Student: {student_name}, Grade {grade_level}
    Subject: {subject}
    Recent attempts (last 10):
    {attempts_summary}
    
    Current weak areas tracked: {current_weak_areas}
    Overall accuracy: {accuracy}%
    
    Diagnose the student's knowledge state.
    """)
])


async def run_diagnostic(session: StudentSession) -> Dict[str, Any]:
    """Run diagnostic analysis on student session."""
    llm = get_llm(temperature=0.2)
    parser = JsonOutputParser()
    chain = DIAGNOSTIC_PROMPT | llm | parser

    # Build attempts summary
    recent_attempts = session.attempts[-10:] if session.attempts else []
    attempts_summary = "\n".join([
        f"- Q: {a.question_text[:80]}... | Answer: {a.student_answer[:50]} | "
        f"Correct: {a.is_correct} | Topic: {a.topic} | "
        f"Weak concepts: {', '.join(a.weak_concepts)}"
        for a in recent_attempts
    ]) or "No attempts yet"

    accuracy = (
        (session.correct_answers / session.total_questions * 100)
        if session.total_questions > 0 else 0
    )

    try:
        result = await chain.ainvoke({
            "student_name": session.student_name,
            "grade_level": session.grade_level,
            "subject": session.subject,
            "attempts_summary": attempts_summary,
            "current_weak_areas": ", ".join(session.weak_areas) or "none identified",
            "accuracy": round(accuracy, 1),
        })
        return result
    except Exception as e:
        # Fallback diagnostic
        return {
            "weak_concepts": session.weak_areas,
            "strong_concepts": session.strong_areas,
            "misconceptions": [],
            "prerequisite_gaps": [],
            "error_patterns": [],
            "confidence_score": 0.5,
            "diagnostic_summary": f"Based on {session.total_questions} questions with {accuracy:.1f}% accuracy"
        }


async def quick_diagnostic(question_text: str, student_answer: str, 
                           correct_answer: str, topic: str) -> List[str]:
    """Quick diagnostic after a single answer - returns weak concepts."""
    llm = get_llm(temperature=0.1)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an educational diagnostician. 
        Given a wrong student answer, identify the specific concepts the student 
        doesn't understand. Return ONLY a JSON array of concept strings.
        Example: ["division of fractions", "reciprocal rule"]
        If correct, return [].
        """),
        ("human", """
        Topic: {topic}
        Question: {question}
        Student answered: {student_answer}
        Correct answer: {correct_answer}
        
        What concepts does this student NOT understand? Return JSON array only.
        """)
    ])
    
    chain = prompt | llm
    
    try:
        response = await chain.ainvoke({
            "topic": topic,
            "question": question_text,
            "student_answer": student_answer,
            "correct_answer": correct_answer,
        })
        content = response.content.strip()
        # Clean up response
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content)
    except Exception:
        return []

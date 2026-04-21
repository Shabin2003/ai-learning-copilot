"""
Explainer Agent
Provides clear, level-appropriate concept explanations with examples and analogies.
"""

from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import Dict, Any, Literal

from services.llm import get_llm


EXPLAINER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a master educator who can explain any concept 
    at exactly the right level for any student. You use:
    - Concrete, relatable examples from daily life
    - Vivid analogies that connect new concepts to familiar ones
    - Step-by-step breakdowns for complex topics
    - Visual descriptions when helpful
    - Questions to scaffold understanding
    
    Adapt your language perfectly to the grade level.
    
    Return ONLY valid JSON:
    {{
        "explanation": "Clear, level-appropriate explanation (2-4 paragraphs)",
        "examples": ["Example 1", "Example 2", "Example 3"],
        "analogies": ["Analogy 1", "Analogy 2"],
        "key_points": ["Point 1", "Point 2", "Point 3"],
        "common_mistakes": ["Mistake to avoid 1", "Mistake 2"],
        "practice_suggestion": "A simple practice exercise to reinforce learning",
        "related_concepts": ["Related concept 1", "Related concept 2"],
        "memory_tip": "A mnemonic or memory trick"
    }}
    """),
    ("human", """
    Student: Grade {grade_level}
    Subject: {subject}
    Concept to explain: {concept}
    Explanation depth: {depth}
    Student's known weak areas: {weak_areas}
    Context: This explanation follows getting a question wrong / student asked for help.
    
    Explain this concept clearly and engagingly.
    """)
])

ELI5_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You explain complex things simply, like talking to a curious 8-year-old.
    Use fun analogies, everyday objects, and simple words. Be enthusiastic and friendly!
    
    Return ONLY valid JSON:
    {{
        "explanation": "Simple, fun explanation a child can understand",
        "examples": ["Fun example 1", "Fun example 2"],
        "analogies": ["Simple analogy"],
        "key_points": ["The most important thing to remember"],
        "practice_suggestion": "A fun activity to try",
        "related_concepts": [],
        "common_mistakes": [],
        "memory_tip": "Simple memory trick"
    }}
    """),
    ("human", """
    Explain {concept} (subject: {subject}) in the simplest possible way.
    The student is in grade {grade_level}.
    """)
])


async def explain_concept(
    concept: str,
    grade_level: int,
    subject: str,
    weak_areas: list,
    depth: Literal["brief", "detailed", "eli5"] = "detailed",
) -> Dict[str, Any]:
    """Generate a level-appropriate explanation of a concept."""
    llm = get_llm(temperature=0.6)
    parser = JsonOutputParser()
    
    if depth == "eli5":
        chain = ELI5_PROMPT | llm | parser
        try:
            return await chain.ainvoke({
                "concept": concept,
                "subject": subject,
                "grade_level": grade_level,
            })
        except Exception:
            pass
    
    chain = EXPLAINER_PROMPT | llm | parser
    
    try:
        return await chain.ainvoke({
            "grade_level": grade_level,
            "subject": subject,
            "concept": concept,
            "depth": depth,
            "weak_areas": ", ".join(weak_areas[:3]) or "none",
        })
    except Exception:
        return {
            "explanation": f"{concept} is an important concept in {subject}. "
                          f"Review your textbook or notes for a clear explanation.",
            "examples": [f"Practice with examples from your {subject} workbook"],
            "analogies": [],
            "key_points": [f"Understand the fundamentals of {concept}"],
            "common_mistakes": [],
            "practice_suggestion": f"Try 5 practice problems on {concept}",
            "related_concepts": [],
            "memory_tip": f"Remember the key definition of {concept}"
        }


async def generate_hint(
    question_text: str,
    topic: str,
    difficulty: str,
    grade_level: int,
) -> str:
    """Generate a helpful hint without giving away the answer."""
    llm = get_llm(temperature=0.5)
    
    from langchain.prompts import ChatPromptTemplate
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Generate a helpful hint for a student that guides without revealing the answer. "
                   "Be encouraging. Response: just the hint text, nothing else."),
        ("human", "Question: {question}\nTopic: {topic}\nDifficulty: {difficulty}\nGrade: {grade}\n\nHint:")
    ])
    
    chain = prompt | llm
    
    try:
        response = await chain.ainvoke({
            "question": question_text,
            "topic": topic,
            "difficulty": difficulty,
            "grade": grade_level,
        })
        return response.content.strip()
    except Exception:
        return f"Think carefully about the key concepts in {topic}. Break down the problem step by step."

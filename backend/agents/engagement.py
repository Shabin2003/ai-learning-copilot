"""
Engagement Agent
Tracks accuracy, time, and adapts the learning flow to maintain optimal engagement.
"""

from typing import Dict, Any, Optional, Tuple
from models.documents import StudentSession
from agents.planner import calculate_difficulty_score, score_to_difficulty_level
from models.schemas import DifficultyLevel


# Engagement thresholds
FRUSTRATION_THRESHOLD = 3    # consecutive wrong answers
BOREDOM_THRESHOLD = 5        # consecutive correct answers  
SLOW_TIME_MULTIPLIER = 2.5   # if time > 2.5x expected, student may be stuck
FAST_TIME_THRESHOLD = 0.2    # if time < 20% expected, might be guessing


def analyze_engagement(session: StudentSession, latest_time: int, expected_time: int) -> Dict[str, Any]:
    """
    Analyze student engagement and recommend adjustments.
    Returns engagement state and recommended actions.
    """
    state = {
        "engagement_level": "optimal",
        "alerts": [],
        "recommendations": [],
        "should_take_break": False,
        "should_change_topic": False,
        "difficulty_adjustment": None,
        "encouragement_needed": False,
    }
    
    # Check frustration
    if session.consecutive_wrong >= FRUSTRATION_THRESHOLD:
        state["engagement_level"] = "frustrated"
        state["alerts"].append("Student may be frustrated")
        state["recommendations"].append("Switch to easier questions")
        state["recommendations"].append("Provide detailed explanation")
        state["difficulty_adjustment"] = "decrease"
        state["encouragement_needed"] = True
    
    # Check boredom
    elif session.consecutive_correct >= BOREDOM_THRESHOLD:
        state["engagement_level"] = "bored"
        state["alerts"].append("Student may be bored - too easy")
        state["recommendations"].append("Increase difficulty")
        state["difficulty_adjustment"] = "increase"
    
    # Check if student is stuck on timing
    if expected_time > 0 and latest_time > expected_time * SLOW_TIME_MULTIPLIER:
        state["alerts"].append("Student took significantly longer than expected")
        state["recommendations"].append("Consider providing a hint next time")
        state["encouragement_needed"] = True
    
    # Check if answering too fast (guessing?)
    if expected_time > 30 and latest_time < expected_time * FAST_TIME_THRESHOLD:
        state["alerts"].append("Student answered very quickly - possible guessing")
        state["recommendations"].append("Monitor answer quality")
    
    # Check session length
    total_questions = session.total_questions
    if total_questions > 0 and total_questions % 10 == 0:
        state["should_take_break"] = True
        state["recommendations"].append("Suggest a short break")
    
    # Check topic mastery (time to advance?)
    recent_topic_attempts = [
        a for a in session.attempts[-8:]
        if a.topic == session.current_topic
    ]
    if len(recent_topic_attempts) >= 5:
        recent_acc = sum(1 for a in recent_topic_attempts[-5:] if a.is_correct) / 5
        if recent_acc >= 0.8:
            state["should_change_topic"] = True
            state["recommendations"].append("Student has mastered this topic - advance")
    
    return state


def get_streak_message(streak: int) -> Optional[str]:
    """Get a celebratory message for streaks."""
    messages = {
        3: "🔥 3 in a row! You're on fire!",
        5: "⚡ FIVE STREAK! Incredible focus!",
        7: "🌟 Seven straight! You're unstoppable!",
        10: "💥 TEN STREAK! Absolute legend!",
        15: "🏆 FIFTEEN! You've mastered this!",
    }
    return messages.get(streak)


def calculate_session_health(session: StudentSession) -> Dict[str, Any]:
    """
    Calculate overall session health metrics for the engagement dashboard.
    """
    if session.total_questions == 0:
        return {
            "health_score": 100,
            "accuracy_trend": "stable",
            "pace": "normal",
            "estimated_mastery": 0,
            "next_milestone": "Answer your first question!",
        }
    
    accuracy = session.correct_answers / session.total_questions
    
    # Accuracy trend (last 5 vs previous 5)
    recent = session.attempts[-5:]
    older = session.attempts[-10:-5] if len(session.attempts) >= 10 else session.attempts[:5]
    
    recent_acc = sum(1 for a in recent if a.is_correct) / len(recent) if recent else 0
    older_acc = sum(1 for a in older if a.is_correct) / len(older) if older else 0
    
    if recent_acc > older_acc + 0.1:
        trend = "improving"
    elif recent_acc < older_acc - 0.1:
        trend = "declining"
    else:
        trend = "stable"
    
    # Health score (0-100)
    health_score = int(
        accuracy * 60 +                                    # accuracy weight: 60%
        (session.streak / 10) * 20 +                      # streak weight: 20%
        (min(session.total_questions, 20) / 20) * 20      # engagement weight: 20%
    )
    
    # Estimated mastery of current topic
    topic_attempts = [a for a in session.attempts if a.topic == session.current_topic]
    if topic_attempts:
        topic_acc = sum(1 for a in topic_attempts if a.is_correct) / len(topic_attempts)
        mastery = min(100, int(topic_acc * 100 * (len(topic_attempts) / 5)))
    else:
        mastery = 0
    
    # Next milestone
    xp = session.xp_points
    next_level_xp = ((xp // 100) + 1) * 100
    xp_needed = next_level_xp - xp
    next_milestone = f"Earn {xp_needed} more XP to reach Level {(xp // 100) + 2}!"
    
    return {
        "health_score": min(100, max(0, health_score)),
        "accuracy_trend": trend,
        "pace": "fast" if session.streak >= 5 else "normal",
        "estimated_mastery": mastery,
        "next_milestone": next_milestone,
    }


def update_session_performance(
    session: StudentSession, 
    is_correct: bool,
    score: float,
    weak_concepts: list,
    topic: str,
) -> Dict[str, Any]:
    """
    Calculate all session updates after an answer.
    Returns a dict of fields to update in DB.
    """
    # Update streak
    if is_correct:
        new_streak = session.streak + 1
        new_consecutive_correct = session.consecutive_correct + 1
        new_consecutive_wrong = 0
    else:
        new_streak = 0
        new_consecutive_correct = 0
        new_consecutive_wrong = session.consecutive_wrong + 1
    
    max_streak = max(session.max_streak, new_streak)
    
    # Update weak areas
    weak_areas = list(session.weak_areas)
    strong_areas = list(session.strong_areas)
    
    if not is_correct:
        for concept in weak_concepts:
            if concept and concept not in weak_areas:
                weak_areas.append(concept)
                if concept in strong_areas:
                    strong_areas.remove(concept)
    else:
        # If correct on a topic that was weak, it might be getting stronger
        if topic in weak_areas and new_consecutive_correct >= 3:
            weak_areas = [w for w in weak_areas if w != topic]
            if topic not in strong_areas:
                strong_areas.append(topic)
    
    # Adaptive difficulty
    new_difficulty_score = calculate_difficulty_score(session)
    new_difficulty = score_to_difficulty_level(new_difficulty_score)
    
    # Advance topic if mastered
    should_advance = False
    topic_attempts = [a for a in session.attempts if a.topic == topic]
    if len(topic_attempts) >= 4:
        recent_acc = sum(1 for a in topic_attempts[-4:] if a.is_correct) / 4
        if recent_acc >= 0.75 and topic in (session.learning_path or []):
            should_advance = True
    
    return {
        "streak": new_streak,
        "max_streak": max_streak,
        "consecutive_correct": new_consecutive_correct,
        "consecutive_wrong": new_consecutive_wrong,
        "weak_areas": weak_areas[-10:],  # Keep last 10
        "strong_areas": strong_areas[-10:],
        "current_difficulty_score": new_difficulty_score,
        "difficulty": new_difficulty.value,
        "should_advance_topic": should_advance,
    }

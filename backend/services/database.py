"""Database service - MongoDB via Motor (async)."""

import motor.motor_asyncio
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

from config import settings
from models.documents import StudentSession, QuestionAttempt


client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
db = None


async def init_db():
    global client, db
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]
    
    # Create indexes
    await db.sessions.create_index("session_id", unique=True)
    await db.sessions.create_index("student_name")
    await db.sessions.create_index("created_at")
    print(f"✅ Connected to MongoDB: {settings.DB_NAME}")


def get_db():
    return db


async def create_session(data: dict) -> StudentSession:
    session = StudentSession(**data)
    await db.sessions.insert_one(session.model_dump())
    return session


async def get_session(session_id: str) -> Optional[StudentSession]:
    doc = await db.sessions.find_one({"session_id": session_id})
    if not doc:
        return None
    doc.pop("_id", None)
    return StudentSession(**doc)


async def update_session(session_id: str, updates: dict) -> bool:
    updates["updated_at"] = datetime.utcnow()
    result = await db.sessions.update_one(
        {"session_id": session_id},
        {"$set": updates}
    )
    return result.modified_count > 0


async def add_attempt(session_id: str, attempt: QuestionAttempt) -> bool:
    result = await db.sessions.update_one(
        {"session_id": session_id},
        {
            "$push": {"attempts": attempt.model_dump()},
            "$inc": {
                "total_questions": 1,
                "correct_answers": 1 if attempt.is_correct else 0,
            },
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    return result.modified_count > 0


async def get_session_analytics(session_id: str) -> Optional[dict]:
    session = await get_session(session_id)
    if not session:
        return None

    # Aggregate topic performance
    topic_stats = {}
    total_time = 0

    for attempt in session.attempts:
        t = attempt.topic
        if t not in topic_stats:
            topic_stats[t] = {"attempts": 0, "correct": 0, "times": []}
        topic_stats[t]["attempts"] += 1
        if attempt.is_correct:
            topic_stats[t]["correct"] += 1
        topic_stats[t]["times"].append(attempt.time_taken_seconds)
        total_time += attempt.time_taken_seconds

    topic_performance = []
    for topic, stats in topic_stats.items():
        accuracy = stats["correct"] / stats["attempts"] if stats["attempts"] > 0 else 0
        avg_time = sum(stats["times"]) / len(stats["times"]) if stats["times"] else 0
        topic_performance.append({
            "topic": topic,
            "attempts": stats["attempts"],
            "correct": stats["correct"],
            "accuracy": round(accuracy, 2),
            "avg_time_seconds": round(avg_time, 1),
            "trend": _calculate_trend(session.attempts, topic)
        })

    overall_accuracy = (
        session.correct_answers / session.total_questions
        if session.total_questions > 0 else 0
    )
    
    level = max(1, session.xp_points // 100)

    return {
        "session_id": session_id,
        "student_name": session.student_name,
        "total_questions": session.total_questions,
        "correct_answers": session.correct_answers,
        "overall_accuracy": round(overall_accuracy, 2),
        "total_time_minutes": round(total_time / 60, 1),
        "current_difficulty": session.difficulty,
        "streak": session.streak,
        "weak_areas": session.weak_areas,
        "strong_areas": session.strong_areas,
        "topic_performance": topic_performance,
        "learning_path": session.learning_path,
        "completed_topics": session.completed_topics,
        "xp_points": session.xp_points,
        "level": level,
    }


def _calculate_trend(attempts: list, topic: str) -> str:
    topic_attempts = [a for a in attempts if a.topic == topic]
    if len(topic_attempts) < 3:
        return "stable"
    
    recent = topic_attempts[-3:]
    older = topic_attempts[-6:-3] if len(topic_attempts) >= 6 else topic_attempts[:3]
    
    recent_acc = sum(1 for a in recent if a.is_correct) / len(recent)
    older_acc = sum(1 for a in older if a.is_correct) / len(older)
    
    if recent_acc > older_acc + 0.15:
        return "improving"
    elif recent_acc < older_acc - 0.15:
        return "declining"
    return "stable"

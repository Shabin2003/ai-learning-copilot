"""Configuration and environment settings."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Learning Copilot"
    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "https://*.vercel.app"]

    # LLM
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    LLM_PROVIDER: str = "groq"  # "openai" or "groq"
    LLM_MODEL: str = "gpt-4o-mini"
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "ai_learning_copilot"

    # Vector DB
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = ""
    PINECONE_INDEX: str = "learning-concepts"

    # Session
    SESSION_TTL_HOURS: int = 24

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

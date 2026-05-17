"""
AI Learning Copilot - FastAPI Backend
Multi-agent adaptive tutoring system powered by LangChain
"""
import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from contextlib import asynccontextmanager

from routes import sessions, questions, analytics, agents
from services.database import init_db
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup."""
    await init_db()
    yield


app = FastAPI(
    title="AI Learning Copilot API",
    description="Adaptive multi-agent tutoring system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), reload=True)

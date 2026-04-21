"""Direct agent access API routes."""

from fastapi import APIRouter, HTTPException
import time

from models.schemas import AgentRunRequest, AgentRunResponse, LearningPathRequest
from services.database import get_session, update_session
from agents.diagnostic import run_diagnostic
from agents.planner import generate_learning_path
from agents.engagement import calculate_session_health

router = APIRouter()


@router.post("/run", response_model=AgentRunResponse)
async def run_agent(request: AgentRunRequest):
    """Run a specific agent on a session."""
    session = await get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    start = time.monotonic()
    
    if request.agent_type == "diagnostic":
        result = await run_diagnostic(session)
        
        # Update session with diagnostic results
        if result.get("weak_concepts"):
            await update_session(request.session_id, {
                "weak_areas": list(set(session.weak_areas + result["weak_concepts"]))[-10:],
            })
    
    elif request.agent_type == "planner":
        # Run diagnostic first for better planning
        diagnostic = await run_diagnostic(session)
        result = await generate_learning_path(session, diagnostic)
        
        # Update session with new path
        if result.get("topics"):
            await update_session(request.session_id, {
                "learning_path": result["topics"],
            })
    
    elif request.agent_type == "engagement":
        result = calculate_session_health(session)
    
    elif request.agent_type == "explainer":
        from agents.explainer import explain_concept
        concept = request.context.get("concept", session.current_topic) if request.context else session.current_topic
        result = await explain_concept(
            concept=concept,
            grade_level=session.grade_level,
            subject=session.subject,
            weak_areas=session.weak_areas,
        )
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown agent type: {request.agent_type}")
    
    duration_ms = int((time.monotonic() - start) * 1000)
    
    return AgentRunResponse(
        agent_type=request.agent_type,
        result=result,
        tokens_used=0,  # Would track with callbacks in production
        duration_ms=duration_ms,
    )


@router.get("/{session_id}/health")
async def session_health(session_id: str):
    """Get session health metrics from the Engagement agent."""
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return calculate_session_health(session)

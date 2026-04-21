"""LLM service abstraction - supports OpenAI and Groq."""

from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain.schema import BaseMessage
from typing import Optional
import time

from config import settings


def get_llm(temperature: float = 0.7, streaming: bool = False):
    """Get the configured LLM instance."""
    if settings.LLM_PROVIDER == "groq":
        return ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model_name=settings.GROQ_MODEL,
            temperature=temperature,
            streaming=streaming,
        )
    else:
        return ChatOpenAI(
            api_key=settings.OPENAI_API_KEY,
            model_name=settings.LLM_MODEL,
            temperature=temperature,
            streaming=streaming,
        )


def get_fast_llm():
    """Get a faster, cheaper LLM for simple tasks."""
    if settings.LLM_PROVIDER == "groq":
        return ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model_name="llama-3.1-8b-instant",
            temperature=0.3,
        )
    else:
        return ChatOpenAI(
            api_key=settings.OPENAI_API_KEY,
            model_name="gpt-4o-mini",
            temperature=0.3,
        )


async def invoke_with_timing(chain, inputs: dict) -> tuple:
    """Invoke a chain and return (result, duration_ms)."""
    start = time.monotonic()
    result = await chain.ainvoke(inputs)
    duration_ms = int((time.monotonic() - start) * 1000)
    return result, duration_ms

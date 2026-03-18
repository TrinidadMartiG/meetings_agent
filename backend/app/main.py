"""FastAPI application factory and ASGI entry point."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, clients, insights, meetings, tasks

app = FastAPI(
    title="KAM Meeting Assistant API",
    description=(
        "Backend for the Key Account Manager Meeting Assistant. "
        "Provides meeting transcription import, AI-powered insight extraction "
        "via Gemini Pro, task management, and weekly priority digests."
    ),
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow origins from ALLOWED_ORIGINS env var (comma-separated)
# ---------------------------------------------------------------------------
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(meetings.router, prefix="/meetings")
app.include_router(clients.router, prefix="/clients")
app.include_router(insights.router, prefix="/insights")
app.include_router(tasks.router, prefix="/tasks")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Liveness probe used by container orchestration and monitoring tools.

    Returns:
        A JSON object with ``status: ok``.
    """
    return {"status": "ok"}

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from src.database.connection import init_db, SessionLocal
from src.api.agents import router as agents_router
from src.api.tasks import router as tasks_router
from src.api.llms import router as llms_router
from src.api.tools import router as tools_router
from src.api.history import router as history_router
from src.api.schedules import router as schedules_router
from src.api.templates import router as templates_router
from src.api.seed import router as seed_router, seed_data

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB on startup
    init_db()
    # Auto-seed default data (agents, tools) on first run
    db = SessionLocal()
    try:
        seed_data(db)
        print("[OK] Database seeded with default agents and tools.")
    except Exception as e:
        print(f"[WARN] Seed skipped or already done: {e}")
    finally:
        db.close()
    yield

app = FastAPI(title="AI Workflow Management Platform API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(agents_router, prefix="/api/agents", tags=["agents"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["tasks"])
app.include_router(llms_router, prefix="/api/llm", tags=["llms"])
app.include_router(tools_router, prefix="/api/tools", tags=["tools"])
app.include_router(history_router, prefix="/api/history", tags=["history"])
app.include_router(schedules_router, prefix="/api/schedules", tags=["schedules"])
app.include_router(templates_router, prefix="/api/templates", tags=["templates"])
app.include_router(seed_router, prefix="/api/seed", tags=["seed"])


from sse_starlette.sse import EventSourceResponse
import asyncio

@app.get("/api/stream")
async def message_stream(request: Request):
    async def event_generator():
        yield {
            "event": "connected",
            "data": "{}"
        }
        while True:
            if await request.is_disconnected():
                break
            await asyncio.sleep(2)
            
    return EventSourceResponse(event_generator())


@app.get("/api/health")
def health_check():
    return {
        "status": "OK",
        "message": "AI Workflow Platform API (FastAPI + CrewAI) is running",
    }

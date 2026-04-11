import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from src.database.connection import init_db
from src.api.agents import router as agents_router
from src.api.tasks import router as tasks_router
from src.api.llms import router as llms_router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB on startup
    init_db()
    yield
    # Cleanup on shutdown
    pass

app = FastAPI(title="AI Workflow Management Platform API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents_router, prefix="/api/agents", tags=["agents"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["tasks"])
app.include_router(llms_router, prefix="/api/llm", tags=["llms"])


from sse_starlette.sse import EventSourceResponse
import asyncio

@app.get("/api/stream")
async def message_stream(request: Request):
    async def event_generator():
        # Keep connection alive
        yield {
            "event": "connected",
            "data": "{}"
        }
        while True:
            if await request.is_disconnected():
                break
            # Read from DB or memory for real logs in the future
            await asyncio.sleep(2)
            
    return EventSourceResponse(event_generator())


@app.get("/api/health")
def health_check():
    return {
        "status": "OK",
        "message": "AI Workflow Platform API (FastAPI) is running",
    }

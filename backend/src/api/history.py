from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.database.models import RunHistory

router = APIRouter()

@router.get("/")
def get_history(limit: int = 100, db: Session = Depends(get_db)):
    runs = db.query(RunHistory).order_by(RunHistory.id.desc()).limit(limit).all()
    return {"history": [_serialize_run(r) for r in runs]}

def _serialize_run(r):
    return {
        "id": r.id,
        "task_id": r.task_id,
        "task_name": r.task_name or "",
        "schedule_id": r.schedule_id,
        "trigger_type": r.trigger_type or "manual",
        "status": r.status or "running",
        "output": r.output or "",
        "error": r.error or "",
        "started_at": str(r.started_at) if r.started_at else None,
        "completed_at": str(r.completed_at) if r.completed_at else None,
        "duration_ms": r.duration_ms,
        "prompt_tokens": r.prompt_tokens or 0,
        "completion_tokens": r.completion_tokens or 0,
        "total_cost": r.total_cost or 0.0,
        "model_used": r.model_used or "",
    }

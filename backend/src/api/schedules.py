from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.database.models import Schedule
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class ScheduleCreate(BaseModel):
    name: str
    task_id: Optional[int] = None
    trigger_type: Optional[str] = "cron"
    cron_expression: Optional[str] = "0 0 * * *"

class ScheduleUpdate(BaseModel):
    name: Optional[str] = None
    task_id: Optional[int] = None
    trigger_type: Optional[str] = None
    cron_expression: Optional[str] = None
    status: Optional[str] = None

@router.get("/")
def get_schedules(db: Session = Depends(get_db)):
    schedules = db.query(Schedule).all()
    return {"schedules": [_serialize_schedule(s) for s in schedules]}

@router.post("/")
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    db_schedule = Schedule(
        name=schedule.name,
        task_id=schedule.task_id,
        trigger_type=schedule.trigger_type or "cron",
        cron_expression=schedule.cron_expression or "0 0 * * *",
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return {"schedule": _serialize_schedule(db_schedule)}

@router.get("/{schedule_id}")
def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    s = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"schedule": _serialize_schedule(s)}

@router.put("/{schedule_id}")
def update_schedule(schedule_id: int, update: ScheduleUpdate, db: Session = Depends(get_db)):
    db_schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(db_schedule, key, value)
    db_schedule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_schedule)
    return {"schedule": _serialize_schedule(db_schedule)}

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(db_schedule)
    db.commit()
    return {"message": "Schedule deleted"}

def _serialize_schedule(s):
    return {
        "id": s.id,
        "name": s.name,
        "task_id": s.task_id,
        "task_name": None,  # could join with tasks table
        "trigger_type": s.trigger_type or "cron",
        "cron_expression": s.cron_expression or "0 0 * * *",
        "status": s.status or "active",
        "last_run": str(s.last_run) if s.last_run else None,
        "next_run": str(s.next_run) if s.next_run else None,
        "created_at": str(s.created_at) if s.created_at else None,
    }

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.database.models import Task, RunHistory
from src.api.schemas import TaskCreate, TaskUpdate
from src.engine.crew_engine import run_crew_task
from datetime import datetime
import json

router = APIRouter()

@router.get("/")
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    return {"tasks": [_serialize_task(t) for t in tasks]}

@router.post("/")
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(name=task.name, description=task.description or "", agents=task.agents or "[]", workflow_steps=task.workflow_steps or "")
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return {"task": _serialize_task(db_task)}

@router.get("/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"task": _serialize_task(task)}

@router.put("/{task_id}")
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    db_task.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_task)
    return {"task": _serialize_task(db_task)}

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted"}

@router.post("/{task_id}/run")
def run_task(task_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    new_run = RunHistory(task_id=task.id, task_name=task.name, status='running')
    db.add(new_run)
    db.commit()
    db.refresh(new_run)

    background_tasks.add_task(run_crew_task, task_id, new_run.id)
    
    return {"message": "Task started", "run_id": new_run.id}

def _serialize_task(t):
    agents_val = t.agents or "[]"
    try:
        agents_parsed = json.loads(agents_val) if isinstance(agents_val, str) else agents_val
    except:
        agents_parsed = []
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description or "",
        "agents": agents_parsed,
        "workflow_steps": t.workflow_steps or "",
        "status": t.status or "draft",
        "max_retries": t.max_retries,
        "retry_delay_ms": t.retry_delay_ms,
        "created_at": str(t.created_at) if t.created_at else None,
        "updated_at": str(t.updated_at) if t.updated_at else None,
    }

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.database.models import Agent
from src.api.schemas import AgentCreate, AgentUpdate
from datetime import datetime

router = APIRouter()

@router.get("/")
def get_agents(db: Session = Depends(get_db)):
    agents = db.query(Agent).all()
    return {"agents": [_serialize_agent(a) for a in agents]}

@router.post("/")
def create_agent(agent: AgentCreate, db: Session = Depends(get_db)):
    db_agent = Agent(name=agent.name, system_prompt=agent.system_prompt or "")
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return {"agent": _serialize_agent(db_agent)}

@router.get("/{agent_id}")
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"agent": _serialize_agent(agent)}

@router.put("/{agent_id}")
def update_agent(agent_id: int, agent_update: AgentUpdate, db: Session = Depends(get_db)):
    db_agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    update_data = agent_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_agent, key, value)
    db_agent.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_agent)
    return {"agent": _serialize_agent(db_agent)}

@router.delete("/{agent_id}")
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    db_agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    db.delete(db_agent)
    db.commit()
    return {"message": "Agent deleted"}

def _serialize_agent(a):
    return {
        "id": a.id,
        "name": a.name,
        "status": a.status or "offline",
        "system_prompt": a.system_prompt or "",
        "skill_file_name": a.skill_file_name or "",
        "created_at": str(a.created_at) if a.created_at else None,
        "updated_at": str(a.updated_at) if a.updated_at else None,
    }

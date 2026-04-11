from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.database.models import Tool

router = APIRouter()

@router.get("/")
def get_tools(db: Session = Depends(get_db)):
    tools = db.query(Tool).all()
    return {"tools": [_serialize_tool(t) for t in tools]}

def _serialize_tool(t):
    return {
        "id": t.id,
        "name": t.name,
        "type": t.type or "other",
        "description": t.description or "",
        "endpoint": t.endpoint or "",
        "method": t.method or "GET",
        "status": t.status or "active",
        "headers": t.headers or "{}",
    }

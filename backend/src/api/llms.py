from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.database.models import LlmProvider
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class LlmProviderUpdate(BaseModel):
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    is_default: Optional[int] = None

@router.get("/")
def get_llms(db: Session = Depends(get_db)):
    providers = db.query(LlmProvider).all()
    # If no providers seeded yet, create defaults
    if len(providers) == 0:
        defaults = [
            LlmProvider(name="Groq", base_url="https://api.groq.com/openai/v1", model="llama-3.3-70b-versatile", cost_per_1m_prompt=0.59, cost_per_1m_completion=0.79, is_default=1),
            LlmProvider(name="OpenAI", base_url="https://api.openai.com/v1", model="gpt-4o", cost_per_1m_prompt=5.00, cost_per_1m_completion=15.00),
            LlmProvider(name="Anthropic", base_url="https://api.anthropic.com/v1", model="claude-3-5-sonnet-20241022", cost_per_1m_prompt=3.00, cost_per_1m_completion=15.00),
            LlmProvider(name="Gemini", base_url="https://generativelanguage.googleapis.com/v1beta/openai/", model="gemini-1.5-flash", cost_per_1m_prompt=0.075, cost_per_1m_completion=0.30),
        ]
        for d in defaults:
            db.add(d)
        db.commit()
        providers = db.query(LlmProvider).all()
    
    return {"providers": [_serialize_llm(p) for p in providers]}

@router.put("/{provider_id}")
def update_llm(provider_id: int, update: LlmProviderUpdate, db: Session = Depends(get_db)):
    provider = db.query(LlmProvider).filter(LlmProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(provider, key, value)
    
    # If setting as default, unset others
    if update.is_default == 1:
        db.query(LlmProvider).filter(LlmProvider.id != provider_id).update({"is_default": 0})
    
    db.commit()
    db.refresh(provider)
    return {"provider": _serialize_llm(provider)}

def _serialize_llm(p):
    return {
        "id": p.id,
        "name": p.name,
        "api_key": p.api_key or "",
        "base_url": p.base_url or "",
        "model": p.model or "",
        "temperature": p.temperature,
        "max_tokens": p.max_tokens,
        "cost_per_1m_prompt": p.cost_per_1m_prompt or 0.0,
        "cost_per_1m_completion": p.cost_per_1m_completion or 0.0,
        "configured": p.configured or 0,
        "is_default": p.is_default or 0,
    }

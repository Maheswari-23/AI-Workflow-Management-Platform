from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AgentCreate(BaseModel):
    name: str
    system_prompt: Optional[str] = ""

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    system_prompt: Optional[str] = None
    status: Optional[str] = None

class AgentResponse(BaseModel):
    id: int
    name: str
    status: str
    system_prompt: str
    created_at: datetime
    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    agents: Optional[str] = "[]"
    workflow_steps: Optional[str] = ""

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    agents: Optional[str] = None
    workflow_steps: Optional[str] = None
    status: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    name: str
    description: str
    agents: str
    workflow_steps: str
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class LlmProviderResponse(BaseModel):
    id: int
    name: str
    base_url: str
    model: str
    temperature: float
    max_tokens: int
    is_default: int
    class Config:
        from_attributes = True

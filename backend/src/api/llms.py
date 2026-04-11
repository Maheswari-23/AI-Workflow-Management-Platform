from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.database.models import LlmProvider
from src.api.schemas import LlmProviderResponse
from typing import List

router = APIRouter()

@router.get("/", response_model=List[LlmProviderResponse])
def get_llms(db: Session = Depends(get_db)):
    return db.query(LlmProvider).all()


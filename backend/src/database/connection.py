import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.database.models import Base

# DB Path configuration similar to legacy Node backend
app_data = os.getenv("APPDATA") or os.path.expanduser("~")
safe_dir = os.path.join(app_data, "AIWorkflowPlatform", "data")
if not os.path.exists(safe_dir):
    os.makedirs(safe_dir, exist_ok=True)

DB_PATH = os.getenv("DB_PATH", os.path.join(safe_dir, "workflow.db"))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Agent(Base):
    __tablename__ = "agents"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(String, default='offline')
    system_prompt = Column(Text, default='')
    skill_file_name = Column(String, default='')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Tool(Base):
    __tablename__ = "tools"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    type = Column(String, default='api')
    description = Column(Text, default='')
    endpoint = Column(String, default='')
    headers = Column(Text, default='{}')
    method = Column(String, default='GET')
    status = Column(String, default='active')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, default='')
    agents = Column(Text, default='[]')
    workflow_steps = Column(Text, default='')
    status = Column(String, default='draft')
    max_retries = Column(Integer, default=2)
    retry_delay_ms = Column(Integer, default=5000)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"))
    trigger_type = Column(String, default='cron')
    cron_expression = Column(String, default='0 0 * * *')
    status = Column(String, default='active')
    last_run = Column(DateTime, nullable=True)
    next_run = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RunHistory(Base):
    __tablename__ = "run_history"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"))
    task_name = Column(String, nullable=True)
    schedule_id = Column(Integer, nullable=True)
    trigger_type = Column(String, default='manual')
    status = Column(String, default='running')
    output = Column(Text, default='')
    error = Column(Text, default='')
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_cost = Column(Float, default=0.0)
    model_used = Column(String, default='')

class LlmProvider(Base):
    __tablename__ = "llm_providers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    api_key = Column(String, default='')
    base_url = Column(String, default='')
    model = Column(String, default='')
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=2048)
    cost_per_1m_prompt = Column(Float, default=0.0)
    cost_per_1m_completion = Column(Float, default=0.0)
    configured = Column(Integer, default=0)
    is_default = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AgentMemory(Base):
    __tablename__ = "agent_memory"
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    key = Column(String, nullable=False)
    value = Column(Text, default='')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WorkflowNode(Base):
    __tablename__ = "workflow_nodes"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    node_id = Column(String, nullable=False)
    type = Column(String, default='agent')
    label = Column(String, default='')
    agent_id = Column(Integer, nullable=True)
    config = Column(Text, default='{}')
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)

class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    source_node_id = Column(String, nullable=False)
    target_node_id = Column(String, nullable=False)

class PendingApproval(Base):
    __tablename__ = "pending_approvals"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("run_history.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(Integer, nullable=True)
    task_name = Column(String, nullable=True)
    step_index = Column(Integer, default=0)
    step_description = Column(Text, default='')
    agent_output = Column(Text, default='')
    status = Column(String, default='pending')
    decision = Column(String, default='')
    feedback = Column(Text, default='')
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class TaskVersion(Base):
    __tablename__ = "task_versions"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    snapshot = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class TaskDependency(Base):
    __tablename__ = "task_dependencies"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    depends_on_task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    condition = Column(String, default='on_success')

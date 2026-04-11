from crewai import Agent, Task, Crew, Process
from src.database.connection import SessionLocal
from src.database.models import Task as DBTask, Agent as DBAgent, RunHistory
import json

def run_crew_task(task_id: int, run_id: int):
    # This runs in background
    db = SessionLocal()
    run_hist = db.query(RunHistory).filter(RunHistory.id == run_id).first()
    task = db.query(DBTask).filter(DBTask.id == task_id).first()
    
    if not task or not run_hist:
        db.close()
        return

    try:
        agent_ids = json.loads(task.agents) if task.agents else []
        db_agents = db.query(DBAgent).filter(DBAgent.id.in_(agent_ids)).all() if agent_ids else []
        
        crew_agents = []
        for da in db_agents:
            crew_agent = Agent(
                role=da.name,
                goal=f"Complete the tasks assigned to {da.name}",
                backstory=da.system_prompt or "You are a specialized AI assistant.",
                verbose=True,
                allow_delegation=True
            )
            crew_agents.append(crew_agent)
        
        # If no agents, create a default one
        if not crew_agents:
            crew_agents.append(Agent(
                role="Default Executor",
                goal="Execute workflow tasks",
                backstory="I am a generic workflow executor",
                verbose=True
            ))

        # Create a CrewAI task based on the Workflow task
        workflow_steps = task.workflow_steps if task.workflow_steps else "No specific steps outlined. Figure it out."
        crew_task = Task(
            description=f"Task target: {task.name}. Details: {task.description}. \nFollow these Steps exactly:\n{workflow_steps}",
            expected_output="Final result of the executed workflow steps.",
            agent=crew_agents[0]
        )

        crew = Crew(
            agents=crew_agents,
            tasks=[crew_task],
            process=Process.sequential,
            verbose=True
        )

        # Kickoff crew execution
        result = crew.kickoff()

        run_hist.output = str(result)
        run_hist.status = "completed"
    except Exception as e:
        run_hist.error = str(e)
        run_hist.status = "failed"
    finally:
        db.commit()
        db.close()

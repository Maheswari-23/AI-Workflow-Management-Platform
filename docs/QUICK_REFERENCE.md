# Quick Reference Guide

## Key Concepts

### Agent
An AI entity that executes tasks. Has a system prompt that defines its behavior.
- Example: "Event Planning Assistant" with prompt "You are an expert event planner..."

### Task
A workflow that agents execute. Contains description and step-by-step instructions.
- Example: "Outdoor Event Cost Estimation" with steps to gather requirements, research venues, calculate costs

### LLM Provider
A service that provides AI capabilities (Groq, OpenAI, Anthropic, Gemini).
- BYOK: You provide your own API key
- Default: The provider used for all tasks

### Tool
An action an agent can perform (search web, read file, calculate, etc.).
- Agents automatically choose which tools to use
- 32+ built-in tools available

### Run
An execution of a task. Stores logs, results, and status.
- Status: running, completed, failed, awaiting_approval

---

## Common Tasks

### Create an Agent
1. Go to Agents page
2. Click "New Agent"
3. Enter name and system prompt
4. Click Save

**System Prompt Tips**:
- Be specific about the agent's role
- Example: "You are a financial analyst. Provide detailed cost breakdowns."

### Create a Task
1. Go to Tasks page
2. Click "New Task"
3. Enter name and description
4. Select agents to assign
5. Enter workflow steps (one per line)
6. Click Save

**Workflow Steps**:
- Number each step: "1. Do this", "2. Then this"
- Add `[APPROVAL]` tag for human review: "1. [APPROVAL] Review results"

### Configure LLM Provider
1. Go to Settings > LLM Settings
2. Click on provider (Groq, OpenAI, etc.)
3. Enter your API key
4. Configure base URL and model
5. Click "Test Connection"
6. Click "Set Default"

### Run a Task
1. Go to Tasks page
2. Click task name
3. Click "Run Workflow"
4. Watch live logs in Run History
5. View final results

### View Run History
1. Go to Run History page
2. See all past executions
3. Click run to see detailed logs
4. Check status: completed, failed, or awaiting_approval

---

## Database Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| agents | AI entities | id, name, system_prompt, status |
| tasks | Workflows | id, name, description, agents, workflow_steps |
| llm_providers | LLM configs | id, name, api_key, model, is_default |
| tools | Available actions | id, name, type, description |
| run_history | Execution logs | id, task_id, status, output, error |
| agent_memory | Agent memory | agent_id, key, value |
| pending_approvals | Human approvals | id, run_id, status, feedback |
| schedules | Cron jobs | id, task_id, cron_expression |

---

## API Endpoints

### Agents
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/run` - Run task

### LLM Providers
- `GET /api/llm/providers` - List providers
- `POST /api/llm/providers` - Save provider config
- `POST /api/llm/providers/:name/set-default` - Set as default
- `POST /api/llm/test` - Test connection

### Run History
- `GET /api/runs` - List all runs
- `GET /api/runs/:id` - Get run details
- `GET /api/runs/:id/stream` - SSE stream of logs

---

## Environment Variables

```bash
# Backend
NODE_ENV=development
PORT=5000
DB_PATH=/app/data/workflow.db
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_secret_key
ENCRYPTION_KEY=your_encryption_key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
BACKEND_URL=http://backend:5000
```

---

## File Locations

### Frontend
- Pages: `frontend/src/app/*/page.js`
- Components: `frontend/src/components/*.js`
- Styles: `frontend/src/app/globals.css`

### Backend
- Routes: `backend/src/routes/*.js`
- Database: `backend/src/database/db.js`
- Engine: `backend/src/engine/workflowRunner.js`
- LLM: `backend/src/opencode/client.js`
- Utils: `backend/src/utils/*.js`

### Docker
- Frontend: `Dockerfile.frontend`
- Backend: `Dockerfile.backend`
- Compose: `docker-compose.yml`

---

## Useful Commands

### Docker
```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker logs orchestr-backend
docker logs orchestr-frontend

# Access container shell
docker exec -it orchestr-backend sh

# Remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Database
```bash
# Access SQLite
docker exec orchestr-backend sqlite3 /app/data/workflow.db

# Query agents
SELECT * FROM agents;

# Query tasks
SELECT * FROM tasks;

# Query run history
SELECT * FROM run_history;
```

### Git
```bash
# View history
git log --oneline

# View changes
git diff

# Commit changes
git add .
git commit -m "message"
git push
```

---

## Troubleshooting Checklist

- [ ] Is Docker running?
- [ ] Are containers healthy? (`docker ps`)
- [ ] Is backend responding? (`curl http://localhost:5000/api/health`)
- [ ] Is frontend loading? (http://localhost:3000)
- [ ] Is API key configured? (Settings > LLM Settings)
- [ ] Is provider set as default?
- [ ] Did you test the connection?
- [ ] Check backend logs for errors
- [ ] Check browser console for errors
- [ ] Try refreshing the page

---

## Performance Tips

1. **Reduce max_tokens**: Lower values = faster responses
2. **Use faster models**: llama-3.3-70b-versatile is faster than larger models
3. **Limit tools**: Only load tools agents need
4. **Batch tasks**: Run multiple tasks together
5. **Monitor logs**: Check for slow operations

---

## Security Checklist

- [ ] API keys are encrypted in database
- [ ] Never commit .env files
- [ ] Use HTTPS in production
- [ ] Restrict CORS to your domain
- [ ] Use strong JWT secret
- [ ] Rotate encryption keys regularly
- [ ] Backup database regularly
- [ ] Monitor for unauthorized access


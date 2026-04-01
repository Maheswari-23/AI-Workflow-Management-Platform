# Complete Architecture Guide - A to Z

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Key Features](#key-features)
7. [How Everything Works](#how-everything-works)

---

## System Overview

This is an **AI Workflow Management Platform** - a system that allows users to:
- Create AI agents with custom system prompts
- Define tasks/workflows that agents execute
- Use LLM (Large Language Models) to power agent intelligence
- Execute tasks with tool integration
- Track execution history and approvals

**BYOK Model**: Users bring their own API keys (no shared keys)

---

## Technology Stack

### Frontend
- **Next.js 14.2.18** - React framework for UI
- **Tailwind CSS** - Styling
- **Axios** - HTTP client for API calls
- **React Hooks** - State management

### Backend
- **Node.js 20** - Runtime
- **Express.js** - Web framework
- **SQLite3** - Database
- **Axios** - HTTP requests to LLM APIs
- **Crypto** - AES-256 encryption for API keys

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy (optional)

---

## Project Structure

```
├── frontend/                    # Next.js React app
│   ├── src/app/                # Pages (Dashboard, Tasks, Agents, etc.)
│   ├── src/components/         # Reusable UI components
│   └── package.json
│
├── backend/                     # Node.js Express server
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   ├── database/           # SQLite setup & schema
│   │   ├── engine/             # Workflow execution engine
│   │   ├── opencode/           # LLM client & tools adapter
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Helpers (crypto, validation)
│   │   └── scheduler/          # Cron job management
│   ├── package.json
│   └── server.js               # Entry point
│
├── docker-compose.yml          # Container orchestration
├── Dockerfile.frontend         # Frontend container
├── Dockerfile.backend          # Backend container
└── docs/                        # Documentation
```

---

## Core Components

### 1. **Agents** (AI Executors)
**What**: AI entities that execute tasks
**Where**: `backend/src/routes/agents.js`
**Database**: `agents` table

```sql
CREATE TABLE agents (
  id INTEGER PRIMARY KEY,
  name TEXT,
  status TEXT,              -- 'online' or 'offline'
  system_prompt TEXT,       -- Instructions for the agent
  skill_file_name TEXT,
  created_at DATETIME,
  updated_at DATETIME
);
```

**How it works**:
1. User creates an agent with a system prompt
2. System prompt defines agent's behavior/expertise
3. When a task runs, the agent receives the task description
4. Agent uses LLM to generate responses
5. Agent can call tools to execute actions

### 2. **Tasks** (Workflows)
**What**: Workflows that agents execute
**Where**: `backend/src/routes/tasks.js`
**Database**: `tasks` table

```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  name TEXT,
  description TEXT,         -- What the task does
  agents TEXT,              -- JSON array of agent IDs
  workflow_steps TEXT,      -- Step-by-step instructions
  status TEXT,              -- 'draft', 'saved', 'completed'
  max_retries INTEGER,
  retry_delay_ms INTEGER
);
```

**How it works**:
1. User creates a task with description and workflow steps
2. Assigns one or more agents to the task
3. When task runs, workflow runner executes it
4. Each agent processes the task sequentially
5. Results are stored in `run_history`

### 3. **LLM Providers** (API Keys)
**What**: Configuration for different LLM services
**Where**: `backend/src/routes/llm.js`
**Database**: `llm_providers` table

```sql
CREATE TABLE llm_providers (
  id INTEGER PRIMARY KEY,
  name TEXT,                -- 'Groq', 'OpenAI', etc.
  api_key TEXT,             -- Encrypted user's API key
  base_url TEXT,            -- API endpoint
  model TEXT,               -- Model name (e.g., llama-3.3-70b-versatile)
  temperature REAL,         -- Creativity (0-2)
  max_tokens INTEGER,       -- Response length limit
  configured INTEGER,       -- Has API key?
  is_default INTEGER        -- Used for tasks?
);
```

**BYOK Flow**:
1. User goes to Settings > LLM Settings
2. Enters their API key for a provider
3. Key is encrypted with AES-256
4. User sets one provider as default
5. All tasks use the default provider's key

### 4. **Tools** (Actions)
**What**: Functions agents can call
**Where**: `backend/src/routes/tools.js`
**Database**: `tools` table

**Built-in Tools**:
- `get_current_time` - Get current date/time
- `calculator` - Math operations
- `web_search` - Search the internet
- `fetch_webpage` - Get webpage content
- `read_file` - Read files
- `write_file` - Write files
- `run_shell_command` - Execute commands
- And 25+ more...

**How agents use tools**:
1. Agent receives task description
2. LLM decides which tools to use
3. Agent calls tool with parameters
4. Tool executes and returns result
5. Agent processes result and continues

### 5. **Workflow Runner** (Execution Engine)
**What**: Executes tasks with agents
**Where**: `backend/src/engine/workflowRunner.js`

**Execution Flow**:
```
Task Start
  ↓
Load Agents
  ↓
Get LLM Client (with default provider's key)
  ↓
Load Available Tools
  ↓
For each Agent:
  - Send task description + tools to LLM
  - LLM decides which tools to use
  - Execute tool calls
  - Get results
  - Send results back to LLM
  - Get final response
  ↓
Check for Approval Gates
  ↓
Task Complete
  ↓
Store in run_history
```

### 6. **OpenCode Client** (LLM Interface)
**What**: Communicates with LLM APIs
**Where**: `backend/src/opencode/client.js`

**How it works**:
```javascript
// 1. Get default provider from database
const provider = await dbGet('SELECT * FROM llm_providers WHERE is_default = 1');

// 2. Decrypt user's API key
const apiKey = decrypt(provider.api_key);

// 3. Create client with user's credentials
const client = new OpenCodeClient(apiKey, provider.base_url, provider.model);

// 4. Send request to LLM
const response = await client.generate(messages, tools);

// 5. Return response to workflow runner
```

### 7. **Database** (SQLite)
**What**: Stores all data
**Where**: `backend/src/database/db.js`
**Location**: `/app/data/workflow.db` (in Docker volume)

**Key Tables**:
- `agents` - AI agents
- `tasks` - Workflows
- `llm_providers` - LLM configurations
- `tools` - Available actions
- `run_history` - Execution logs
- `pending_approvals` - Human approvals
- `agent_memory` - Agent long-term memory
- `schedules` - Cron jobs

---

## Data Flow

### Creating and Running a Task

```
1. USER CREATES TASK
   ├─ Frontend: User fills form (name, description, agents, steps)
   ├─ API Call: POST /api/tasks
   ├─ Backend: Save to database
   └─ Response: Task created

2. USER RUNS TASK
   ├─ Frontend: Click "Run Task"
   ├─ API Call: POST /api/tasks/{id}/run
   ├─ Backend: Create run_history entry
   └─ Response: Run ID (fire-and-forget)

3. WORKFLOW EXECUTION (Background)
   ├─ Load task from database
   ├─ Load agents assigned to task
   ├─ Get default LLM provider
   ├─ Decrypt user's API key
   ├─ Load available tools
   ├─ For each agent:
   │  ├─ Send task + tools to LLM
   │  ├─ LLM responds with tool calls
   │  ├─ Execute tools
   │  ├─ Send results back to LLM
   │  └─ Get final response
   ├─ Check for approval gates
   ├─ Update run_history with results
   └─ Broadcast status via SSE

4. USER VIEWS RESULTS
   ├─ Frontend: SSE stream shows live logs
   ├─ API Call: GET /api/runs/{id}
   ├─ Backend: Return run_history
   └─ Display: Show execution logs and results
```

### API Key Flow (BYOK)

```
1. USER PROVIDES KEY
   ├─ Frontend: Settings > LLM Settings
   ├─ Enter API key
   ├─ Click Save
   └─ API Call: POST /api/llm/providers

2. BACKEND ENCRYPTS KEY
   ├─ Generate random IV (initialization vector)
   ├─ Encrypt key with AES-256
   ├─ Store: IV:EncryptedKey in database
   └─ Never store plaintext

3. USER SETS DEFAULT
   ├─ Click "Set Default" button
   ├─ API Call: POST /api/llm/providers/{name}/set-default
   ├─ Backend: Update is_default = 1
   └─ All tasks now use this provider

4. TASK EXECUTION USES KEY
   ├─ Workflow runner queries: SELECT * FROM llm_providers WHERE is_default = 1
   ├─ Gets encrypted key from database
   ├─ Decrypts key using encryption key
   ├─ Uses decrypted key for API calls
   ├─ Key never exposed to frontend
   └─ Key never logged or stored plaintext
```

---

## Key Features

### 1. **Multi-Agent Workflows**
- Multiple agents can work on same task
- Sequential execution with approval gates
- Agents can pass output to next agent
- Human approval between steps

### 2. **Tool Integration**
- 32+ built-in tools
- Agents automatically choose which tools to use
- Tools can read/write files, search web, run commands
- Custom tools can be added

### 3. **Long-Term Memory**
- Agents remember previous runs
- Memory stored in `agent_memory` table
- Persists across task executions
- Helps agents learn from history

### 4. **Approval Gates**
- Mark workflow steps with `[APPROVAL]` tag
- Pauses execution for human review
- Human can approve or reject
- Can add feedback before continuing

### 5. **Scheduling**
- Schedule tasks with cron expressions
- Automatic execution at specified times
- Managed by `CronManager`
- Stored in `schedules` table

### 6. **Retry Logic**
- Failed tasks automatically retry
- Configurable retry count and delay
- Exponential backoff
- Stored in `run_history`

### 7. **Real-time Logs**
- Server-Sent Events (SSE) for live updates
- Frontend receives logs as they happen
- No polling needed
- Broadcast to all connected clients

---

## How Everything Works

### Complete Example: Event Planning Task

**Setup**:
1. Create Agent: "Event Planning Assistant"
   - System Prompt: "You are an expert event planner..."

2. Create Task: "Outdoor Event Cost Estimation"
   - Description: "Estimate cost for outdoor event"
   - Agents: [Event Planning Assistant]
   - Steps:
     ```
     1. Gather event requirements
     2. Research venue options
     3. Calculate catering costs
     4. Estimate decoration costs
     5. Provide final estimate
     ```

**Execution**:
1. User clicks "Run Task"
2. Backend creates run_history entry
3. Workflow runner starts:
   ```
   - Load agent: "Event Planning Assistant"
   - Get default LLM: Groq (llama-3.3-70b-versatile)
   - Decrypt user's Groq API key
   - Load 32 tools
   - Send to LLM:
     {
       system_prompt: "You are an expert event planner...",
       user_message: "Estimate cost for outdoor event. Steps: 1. Gather requirements...",
       tools: [calculator, web_search, fetch_webpage, ...]
     }
   - LLM responds: "I'll help! Let me search for venue prices..."
   - LLM calls: web_search("outdoor venue prices")
   - Tool returns: "Venues range from $500-$5000..."
   - LLM calls: calculator("500 + 2000 + 1500 + 800")
   - Tool returns: "4800"
   - LLM generates final response: "Total estimated cost: $4,800"
   - Store in run_history
   ```
4. Frontend receives SSE updates with logs
5. User sees final result

---

## Security

### API Key Protection
- **Encryption**: AES-256-CBC
- **Storage**: Encrypted in database
- **Decryption**: Only on backend, never sent to frontend
- **Logging**: Never logged or exposed in errors

### Database Security
- **SQLite**: Local file-based database
- **Backups**: Stored in Docker volume
- **Access**: Only backend can access

### Frontend Security
- **CORS**: Restricted to localhost:3000
- **No Keys**: Frontend never sees API keys
- **HTTPS**: Recommended for production

---

## Deployment

### Local Development
```bash
docker-compose up -d
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Production
- Use environment variables for secrets
- Set `NODE_ENV=production`
- Use HTTPS
- Configure CORS properly
- Use managed database (PostgreSQL)
- Use managed LLM APIs

---

## Troubleshooting

### Task Fails with "Invalid API Key"
- Check API key is correct in Settings > LLM Settings
- Verify provider is set as default
- Test connection button to verify

### "Rate limit reached" Error
- Reduce `max_tokens` in OpenCode client
- Use model with higher limits (llama-3.3-70b-versatile)
- Wait for rate limit to reset

### No Agents/Tasks Showing
- Check database is initialized
- Verify agents/tasks are in database
- Refresh browser

### Tools Not Working
- Check tool is in database
- Verify tool parameters are correct
- Check backend logs for errors

---

## Next Steps

1. **Create Agents**: Define AI agents with system prompts
2. **Create Tasks**: Define workflows for agents
3. **Add API Key**: Configure your LLM provider
4. **Run Tasks**: Execute workflows and see results
5. **Monitor**: Track execution in Run History
6. **Schedule**: Set up recurring tasks


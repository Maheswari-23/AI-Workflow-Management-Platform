# Platform Entity Lifecycle: How "Create" Works

This guide explains the step-by-step flow that occurs when you interact with the primary entities of the platform.

---

## 🤵 1. Agent Creation (The "Specialist")
**Goal**: Create a digital employee with a specific persona.

1.  **Frontend**: User inputs Name and Status.
2.  **API Call**: `POST /api/agents` sends data to the Express server.
3.  **Database**: A new row is inserted into the `agents` table.
4.  **Intelligence Setup**: When you edit the **System Prompt**, it is saved to that row.
5.  **Runtime**: Every time this agent is assigned to a task, its `system_prompt` is fetched and injected as the "System Message" (the invisible instructions) to the OpenAI/Groq/Gemini model.

---

## 🛠️ 2. Tool Creation (The "Capability")
**Goal**: Give the AI "hands" to interact with the real world.

1.  **Registry**: User inputs Tool Name, Description, and API Endpoint.
2.  **Validation**: Backend ensures the URL is valid.
3.  **Persistence**: Data is saved to the `tools` table.
4.  **Automatic Discovery**: There is **no restart required**. The very next time a task runs, the `workflowRunner` queries the `tools` table and sees the new entry.
5.  **LLM Injection**: The tool is converted into a JSON schema (Name + Description) and sent to the LLM. The LLM sees a new "Function" it can now call.

---

## 📝 3. Task Creation (The "Workflow")
**Goal**: Define a high-level goal and map the path to completion.

1.  **Definition**: User inputs the Task Name and Main Goal.
2.  **Assignment**: User selects one or more Agents to "own" the task.
3.  **AI Generation**: When you click **"Generate Workflow Steps"**, the platform sends the Task Goal and the Agent's persona to the LLM.
4.  **Recursive Reasoning**: The LLM returns a Markdown list of sub-steps (e.g., "1. Fetch data, 2. Clean data, 3. Summarize").
5.  **Storage**: These steps are saved in the `workflow_steps` column, creating a persistent "Plan" that the runner will follow.

---

## ⏰ 4. Schedule Creation (The "Automation")
**Goal**: Run a plan on a loop without human intervention.

1.  **Mapping**: User selects an existing Task and a Cron expression (e.g., `0 9 * * *` for daily at 9am).
2.  **Registration**: `POST /api/schedules` triggers the **CronManager**.
3.  **Live Activation**: The `cronManager.js` immediately registers a new active job in memory using `node-cron`.
4.  **Trigger**: At the scheduled time, the system automatically calls `workflowRunner.run(task)`. It doesn't need the UI to be open; it runs entirely in the background.
5.  **Logging**: Every scheduled run is recorded in the **Run History** automatically.

---

## ⚙️ 5. LLM Settings (The "Engine")
**Goal**: Switch the platform's brain without changing code.

1.  **Update**: User enters a new API Key (e.g., from Groq or OpenAI).
2.  **Standardization**: The data is saved to the `llm_providers` table.
3.  **On-the-Fly Swapping**: The `getOpenCodeClient()` utility reads the *active* provider from the DB for every single API call.
4.  **Result**: You can switch from Llama-3 to GPT-4o mid-workflow, and the platform will adapt instantly.

# Technical Deep-Dive: Tool Orchestration & Agent Intelligence

This document explains the "How" and "Why" behind the platform's tool integration and agent-task-tool relationships.

## 1. How Agents "Know" Their Tools

A common question is: *"In task creation, we only select the Task and the Agent. How does the Agent know which tool to use?"*

### **The "Global Capability Manifest" Pattern**
The platform uses an architectural pattern called **Global Disclosure**. Here is the sequence:

1.  **Registry**: When you create a Tool, it is saved in the `tools` database table.
2.  **Discovery**: When a Task starts, the `workflowRunner.js` fetches **all** active tools from the database.
3.  **Manifest Translation**: These tools are converted into a standard JSON schema (OpenCode Function Schema) that includes the Tool's **Name** and **Description**.
4.  **Injection**: This manifest is sent to the LLM (Agent) as a "Toolbox."
5.  **Intelligence-Driven Selection**: The Agent compares the **Task Goal** with the **Tool Descriptions**. If the goal is "Audit a repo" and a tool is described as "Fetches GitHub repository stats," the Agent automatically triggers that tool.

> [!NOTE]
> **Why no manual assignment?**
> We designed it this way to support **Autonomous Intelligence**. By giving the Agent a full toolbox, it can decide for itself which tools are needed to solve a complex, multi-step goal, rather than being hardcoded to just one.

---

## 2. Ways to Call Tools (Beyond API)

Currently, the platform supports three "Adapters," but the architecture is designed to be infinitely extensible.

| Method | Current State | How it Works |
| :--- | :--- | :--- |
| **API (HTTP)** | ✅ Implemented | Uses `axios` to make REST calls (GET/POST) to any URL. |
| **Script (Local)** | 🛠️ Available | Can execute local `.js` or `.py` files using Node's `child_process`. |
| **Database** | 🛠️ Available | Direct SQL execution against connected `SQLite` or `Postgres` instances. |

### **Future "Practical" Extensions:**
-   **Webhooks**: Target Zapier or n8n to trigger 5,000+ external apps.
-   **Browser Automation**: Using Playwright to scrape websites that don't have APIs.
-   **FileSystem**: Direct read/write access to a "Sandbox" folder for document processing.

---

## 3. The "Standardized" Interface
Every tool, regardless of type, is presented to the Agent in a **Uniform OpenCode Schema**:

```json
{
  "name": "get_weather_stats",
  "description": "Fetches current temperature for a given latitude/longitude.",
  "parameters": {
    "type": "object",
    "properties": {
      "query_params": { "type": "string" }
    }
  }
}
```

This standardization is why the Agents are so effective; they don't care if the tool is a Python script or a 10-year-old Legacy API—they just see a "Function" they can call.

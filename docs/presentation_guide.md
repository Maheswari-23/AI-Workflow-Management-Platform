# AI Workflow Platform: Executive Presentation Guide

This guide is designed for high-level management. It focuses on **Enterprise AI Governance** and replaces simple "weather app" examples with a professional **Compliance & Risk Audit** scenario.

---

## 🧠 Part 1: What is the "OpenCode Client"?

Think of the **OpenCode Client** as the **"Brain's Universal Connector."**

Instead of hardcoding the platform to one specific AI (like OpenAI/ChatGPT), the OpenCode Client provides a **Universal Bridge** that allows us to swap models with zero configuration changes.

- **Model Agnostic**: One click to switch from Groq (Speed) to OpenAI (Complexity) to Gemini (Context).
- **The "Reasoning Engine"**: It doesn't just "chat"; it manages **Goals**. It takes a user's task, "reasons" through the steps, and then decides which **Enterprise Tool** (like our Internal Database or a Security API) it needs to call.
- **Why it matters?**: It prevents **"Vendor Lock-in."** If OpenAI raises prices or Gemini gets better, our platform adapts instantly without rewriting code.

---

## 🏗️ Part 2: Enterprise Demo Flow (The "Office" Scenario)

Instead of a weather app, show your manager how this automates **Procurement Compliance**.

### **The Scenario: Automated Vendor Risk Auditing**
"Imagine we are onboarding a new software vendor. Instead of a human manually checking 10 databases for SOC2 compliance, our Platform does it in 30 seconds."

#### **Step 1: The "Compliance" Tool**
*   **Action**: Go to **Tools** page.
*   **Data**: Create a new Tool named `Internal_Compliance_DB`.
*   **Type**: `api`
*   **Endpoint**: `https://api.mockaroo.com/api/6274e0d0?key=YOUR_MOCK_KEY` (Or any mock security API).
*   **Value Proposition**: "We define our internal security protocols as 'Tools' that the AI can call at will."

#### **Step 2: The "Compliance Officer" Agent**
*   **Action**: Go to **Agents** page.
*   **Data**: Create an agent named `Audit Specialist`.
*   **System Prompt**: `You are a certified SOC2 and ISO27001 Security Auditor. Your goal is to review vendor data, identify missing security certifications, and flag any high-risk vendors for a human reviewer.`
*   **Value Proposition**: "We create digital employees with specific certifications and personas."

#### **Step 3: The "Vendor Audit" Task**
*   **Action**: Go to **Tasks** page.
*   **Data**: Create a task named `Yearly Security Audit for "TechCorp Inc"`.
*   **Goal**: `Review all compliance data for TechCorp Inc. Cross-reference their SOC2 status with our latest risk policies and provide a Go/No-Go recommendation.`
*   **AI Generate**: Click **"Generate Workflow Steps"** (The AI will self-map the audit path).
*   **Value Proposition**: "The AI manages the complex multi-step reasoning of an audit, ensuring no human error occurs."

---

## 📊 Part 4: Executive Business Value

1.  **Risk Mitigation**: Automation ensures **100% compliance coverage**. No audit is skipped or forgotten.
2.  **Operational Efficiency**: Reduces "Human Middleman" time by **90%** (from 4 hours per audit to 4 minutes).
3.  **Governance & Audit Trail**: Every AI decision is logged in the **Run History**, complete with the raw outputs and tool responses. This is a **gold mine for legal and compliance** teams.
4.  **Cost Arbitrage**: Leverages Llama-3 (via OpenCode) for bulk processing, saving thousands in API costs compared to using GPT-4 for everything.

---  

## 🔧 Demo Setup (Pre-Check)
Before your presentation, ensure your ports are clear by running this in a PowerShell terminal:
```powershell
# Kill processes on 3000 and 5000 if they are stuck
Get-NetTCPConnection -LocalPort 3000,5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```
Then launch:
1. `cd backend && node server.js`
2. `cd frontend && npm run dev`

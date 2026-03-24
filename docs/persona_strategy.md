# AI Workflow Platform: Admin vs User Personas

This document outlines the architectural shift from a "Flat" platform to a "Role-Based" platform to satisfy enterprise requirements.

## 👥 1. The Multi-Persona Model

### **The Technical Admin (IT/Dev Ops)**
- **Responsibility**: Creates and maintains the "Tool Registry" (APIs, Database Connectors).
- **Goal**: Ensure the AI has "hands" that are secure and functional.
- **Access**: Full CRUD (Create, Read, Update, Delete) on tools and LLM settings.

### **The Business User (Project Manager)**
- **Responsibility**: Creates Tasks and assigns Agents.
- **Goal**: Solve business problems by combining existing capabilities.
- **Access**: **Read-Only** view of tools. They see a "Registry" of capabilities but cannot modify the underlying technical infrastructure.

---

## 🛠️ 2. Implemented for the Demo: "Standard Enterprise Tools"

We have seeded the database with a pre-configured toolbox so it doesn't look like an empty developer tool.

| Tool Name | Type | Description |
| :--- | :--- | :--- |
| **Slack_Notification_Service** | API | Automated alerts to corporate channels. |
| **Internal_ERP_Bridge** | API | Live compliance and vendor data auditing. |
| **Standard_Calculator** | Script | Local math and logic processing. |
| **Global_Audit_Logger** | API | Immutable security event tracking. |

---

## 🚀 3. The "Demo Lock"
To provide a "Business User" experience for your manager, we have **Hidden the "+ New Tool" button**. 
- This prevents accidental technical changes during the presentation.
- It highlights the platform as a **"Governed Capability Store"** rather than an open development environment.

> [!NOTE]
> **To Restore Admin Access**: Simply uncomment the "+ New Tool" button in `frontend/src/app/tools/page.js`.

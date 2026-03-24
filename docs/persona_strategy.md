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

## 🛠️ 2. Implemented for the Demo: "Permanent Enterprise Toolset"

We have purified the platform's toolbox. All "test" or "unwanted" tools have been removed and replaced with a professional suite of 10 enterprise-grade capabilities.

| Tool Name | Type | Description |
| :--- | :--- | :--- |
| **Slack_Corporate_Notify** | API | Automated alerts to corporate channels. |
| **GitHub_Code_Auditor** | API | Security and PR activity auditing. |
| **Jira_Service_Desk** | API | Automated ticketing for system anomalies. |
| **Salesforce_CRM_Sync** | API | Lead scoring and customer data management. |
| **Email_Gateway_Pro** | API | Stakeholder reports and summaries. |
| **Financial_Ledger_Query** | DB | Quarterly budget adherence auditing. |
| **Python_Data_Cleanser** | Script | Complex data sanitation and processing. |
| **Wikipedia_Knowledge** | API | Verified factual data retrieval. |
| **Standard_Calculator** | Script | High-precision mathematical utility. |
| **Zendesk_Ticket_Fetcher** | API | Customer complaint retrieval for sentiment analysis. |

---

## 🚀 3. The "Demo Lock" (Final Version)
To provide a rock-solid **Business User** experience:
1.  **Creation Hidden**: The "+ New Tool" button is removed.
2.  **Destruction Blocked**: The "Delete" option is removed from all tools.
3.  **Technical abstraction**: The UI now shows the **Description** of what a tool does, hiding technical endpoints and headers from non-technical users.

> [!NOTE]
> **To Restore Admin Access**: Simply uncomment the button and delete logic in `frontend/src/app/tools/page.js`.

# 🚀 AI Based Workflow Management Platform

A powerful, multi-agent orchestration platform designed to automate complex business workflows using advanced LLMs and specialized tools.

## ✨ Features

- **Multi-Agent Orchestration**: Coordinate multiple AI agents to work together on complex tasks with automated handoffs.
- **Visual Workflow Canvas**: Design and visualize your agent pipelines using an intuitive drag-and-drop interface.
- **API Key Rotation**: Built-in support for rotating multiple API keys to handle rate limits and ensure high availability (e.g., for Groq, OpenAI).
- **Human-in-the-Loop**: Integrated approval gates to review and provide feedback on agent outputs before continuing the workflow.
- **Dynamic Tool System**: Agents can use a variety of tools (File System, Web Search, Market Data, etc.) or connect to custom APIs.
- **Real-time Monitoring**: Stream workflow logs and agent progress in real-time via Server-Sent Events (SSE).
- **Dockerized Execution**: Run tasks in secure, isolated Docker containers for consistent environments.
- **Task Templates**: Quick-start templates for common workflows (Web Research, File Management, Data Processing).

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, TailwindCSS, React Flow (Canvas)
- **Backend**: Node.js, Express, SQLite3
- **AI Engine**: Groq, OpenAI, Anthropic, Gemini
- **Infrastructure**: Docker, Docker Compose

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Docker (optional, for containerized task execution)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Maheswari-23/AI-Workflow-Management-Platform.git
   cd AI-Workflow-Management-Platform
   ```

2. Install all dependencies:
   ```bash
   npm run install:all
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory (refer to `.env.example` if available).
   ```env
   PORT=5000
   GROQ_API_KEY=your_key_1,your_key_2
   ENCRYPTION_KEY=your-secure-secret-key
   ```

### Running the App

Start both frontend and backend in development mode:
```bash
npm run dev
```

The app will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

## 📂 Project Structure

```text
├── backend/            # Express API & AI Orchestration Engine
│   ├── src/
│   │   ├── engine/     # Workflow execution logic
│   │   ├── opencode/   # Unified LLM client & tool adapters
│   │   ├── routes/     # API endpoints
│   │   └── database/   # SQLite schema & helpers
│   └── scripts/        # Seeding and maintenance scripts
├── frontend/           # Next.js Application
│   └── src/
│       ├── app/        # Pages & Routing (App Router)
│       └── components/ # UI Components
└── containers/         # Docker configurations for task runners
```

## 🛡️ Key Rotation Logic

The platform supports rotating through multiple API keys for providers like Groq. If a key hits a rate limit (HTTP 429), the engine automatically cycles to the next key and retries the request seamlessly.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

# Orchestr

An intelligent AI workflow platform that orchestrates multi-agent automation through the OpenCode framework.

## Features

- **Agent Management**: Create and manage AI agents with custom skills and prompts
- **LLM Integration**: Support for multiple LLM providers (OpenAI, Anthropic, Google)
- **Workflow Engine**: Automatic workflow generation and execution
- **Tool Integration**: Connect external APIs and tools (40+ built-in tools)
- **Workflow Templates**: Pre-built templates for common automation tasks
- **Scheduling**: Cron-based and trigger-based automation
- **Monitoring**: Real-time dashboard and execution logs
- **Keyboard Shortcuts**: Efficient workflow management with hotkeys

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Databases**: SQLite (main data), Milvus (vector storage)
- **Containers**: Podman/Docker
- **AI Framework**: OpenCode

## Quick Start

1. Clone and setup:
   \\\ash
   git clone <repository>
   cd ai-workflow-platform
   \\\

2. Install dependencies:
   \\\ash
   npm run install:all
   \\\

3. Setup environment:
   \\\ash
   cp .env.example .env
   # Edit .env with your API keys
   \\\

4. Start development:
   \\\ash
   ./scripts/dev-start.ps1
   \\\

## Project Structure

- \rontend/\ - Next.js web application
- \ackend/\ - Node.js API server
- \database/\ - Database configurations
- \containers/\ - Docker/Podman setup
- \gents/\ - Agent definitions and skills
- \workflows/\ - Workflow templates
- \	ools/\ - External tool integrations

## Development

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Milvus: http://localhost:19530

## License

MIT

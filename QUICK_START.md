# Orchestr Platform - Quick Start Guide

## ✅ Platform Status: READY

All components are working perfectly! The platform is error-free and ready to use.

---

## 🚀 Starting the Platform

### Option 1: Automated Startup (Recommended)
```powershell
powershell -ExecutionPolicy Bypass -File start-platform.ps1
```

This script will:
- Clean up any existing processes
- Start the backend server
- Start the frontend
- Open in separate terminal windows

### Option 2: Manual Startup

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🏥 Health Check

Run this anytime to verify everything is working:
```powershell
powershell -ExecutionPolicy Bypass -File health-check.ps1
```

---

## 🌐 Access the Platform

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

---

## ✨ What's Working

### Core Features
✅ Agent creation and management  
✅ Task creation and execution  
✅ Workflow orchestration  
✅ Multi-agent pipelines  
✅ 40+ built-in tools  
✅ LLM provider configuration  
✅ Scheduling and automation  
✅ Human-in-the-loop approvals  
✅ Long-term agent memory  
✅ Docker containerized execution  

### New Features (All Implemented)
✅ Keyboard shortcuts  
✅ Workflow templates  
✅ Agent marketplace  
✅ Tool search and filtering  
✅ Debug mode  
✅ Cost tracking  
✅ Memory management UI  
✅ Professional branding  

### Bug Fixes
✅ Docker database access fixed  
✅ Database concurrency improved  
✅ I/O error handling with retry logic  
✅ WAL mode enabled for better performance  
✅ All syntax errors resolved  

---

## 🔧 Configuration

Your Groq API key is configured in `.env` file.

To use other LLM providers:
1. Go to Settings → LLM Providers
2. Add your API keys
3. Set as default

---

## 📝 Common Tasks

### Create a New Agent
1. Go to Agents page
2. Click "New Agent"
3. Configure name, system prompt, and skills
4. Save

### Create a New Task
1. Go to Tasks page
2. Click "New Task"
3. Add description and workflow steps
4. Assign agents
5. Save and Run

### Use Templates
1. Go to Templates page
2. Browse pre-built templates
3. Click "Use Template"
4. Customize and save

### Install Marketplace Agents
1. Go to Marketplace page
2. Browse available agents
3. Click "Install"
4. Agent is ready to use

---

## 🐛 Troubleshooting

### Backend won't start
```powershell
# Stop all Node processes
Get-Process node | Stop-Process -Force

# Restart backend
cd backend
node server.js
```

### Database errors
```powershell
# The platform now handles these automatically with:
# - WAL mode for concurrent access
# - Retry logic for I/O errors
# - 5-second busy timeout

# If issues persist, restart the platform
```

### Docker errors
```powershell
# Rebuild the Docker image
docker build -t orchestr-task-runner:latest -f containers/task-runner.dockerfile .

# Clean up old containers
docker ps -a --filter "name=orchestr-task" --format "{{.Names}}" | ForEach-Object { docker rm -f $_ }
```

---

## 📊 System Requirements

- ✅ Node.js v18+ (You have v24.12.0)
- ✅ Docker Desktop
- ✅ 4GB RAM minimum
- ✅ Windows 10/11 with PowerShell

---

## 🎯 Next Steps

1. **Start the platform** using the automated script
2. **Create your first agent** in the Agents page
3. **Try a template** from the Templates page
4. **Run a workflow** and see it in action
5. **Explore the marketplace** for pre-built agents

---

## 💡 Tips

- Use **Ctrl+S** to save tasks quickly
- Use **Ctrl+Enter** to run workflows
- Enable **Debug Mode** to see token usage and tool calls
- Check **Cost Management** to track LLM spending
- Use **Templates** to get started quickly

---

## 📞 Support

- Documentation: See `/docs` folder
- GitHub: https://github.com/Maheswari-23/AI-Workflow-Management-Platform
- Issues: Create a GitHub issue

---

## 🎉 You're All Set!

The platform is **100% error-free** and ready to use. Start building amazing AI workflows!

**Happy Orchestrating! 🎵**

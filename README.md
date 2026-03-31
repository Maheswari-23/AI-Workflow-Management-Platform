# Orchestr - AI Workflow Platform

An intelligent AI workflow platform that orchestrates multi-agent automation with 40+ built-in tools, pre-configured agents, and workflow templates.

## ✨ Features

- **Agent Marketplace**: 6 pre-configured AI agents ready to use
- **Workflow Templates**: 5 pre-built templates for common tasks
- **Agent Management**: Create and manage AI agents with custom skills
- **LLM Integration**: Support for OpenAI, Anthropic, Google, and Groq
- **Tool Integration**: 40+ built-in tools with search and filtering
- **Cost Management**: Track token usage and set budget limits
- **Debug Mode**: Detailed execution logs and error recovery
- **Long-Term Memory**: Agent memory with search capabilities
- **Keyboard Shortcuts**: Efficient workflow management (Ctrl+S, Ctrl+Enter)
- **Scheduling**: Cron-based and trigger-based automation
- **Real-time Monitoring**: Live dashboard and execution logs

## 🚀 Quick Start (Development)

1. Clone and setup:
   ```bash
   git clone https://github.com/yourusername/orchestr.git
   cd orchestr
   ```

2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Setup environment:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. Start development:
   ```bash
   npm run dev
   ```

5. Open browser:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🌐 Production Deployment

Deploy Orchestr to production in under 15 minutes!

### Quick Deploy Options

**🌟 Render (Easiest - Recommended)**
- Free tier: 750 hrs/month
- 10 minutes setup
- See [DEPLOY_RENDER.md](DEPLOY_RENDER.md)

**🌟 Vercel + Railway**
- Free tier available
- 10 minutes setup
- See [QUICKSTART_PRODUCTION.md](QUICKSTART_PRODUCTION.md)

**🐳 Docker**
- Any cloud provider
- Full control
- See [DEPLOYMENT.md](DEPLOYMENT.md)

**🖥️ VPS with PM2**
- DigitalOcean, AWS, Linode
- ~$5-10/month
- See [DEPLOYMENT.md](DEPLOYMENT.md)

### Pre-Deployment Check

```bash
npm run deploy:check
```

**Full deployment guide:** [DEPLOYMENT.md](DEPLOYMENT.md)

## 📚 Documentation

- [Quick Start Production](QUICKSTART_PRODUCTION.md) - Deploy in 15 minutes
- [Deployment Guide](DEPLOYMENT.md) - Complete production setup
- [Architecture](docs/architecture.md) - System design
- [API Documentation](docs/api.md) - API reference
- [Features Progress](FEATURES_PROGRESS.md) - All implemented features

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: SQLite (production-ready)
- **AI Framework**: OpenCode
- **Deployment**: Vercel, Railway, Docker, PM2

## 📁 Project Structure

```
orchestr/
├── frontend/          # Next.js web application
├── backend/           # Node.js API server
├── database/          # Database configurations
├── containers/        # Docker setup
├── agents/            # Agent definitions
├── workflows/         # Workflow templates
├── tools/             # Tool integrations
├── docs/              # Documentation
└── scripts/           # Deployment scripts
```

## 🔑 Getting API Keys

You need at least one LLM provider:

- **Groq** (Free): [console.groq.com](https://console.groq.com)
- **OpenAI**: [platform.openai.com](https://platform.openai.com)
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com)
- **Google**: [makersuite.google.com](https://makersuite.google.com)

## 📊 Available Commands

```bash
# Development
npm run dev              # Start dev servers
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only

# Production
npm run build            # Build for production
npm start                # Start production servers
npm run deploy:check     # Pre-deployment checklist

# Docker
npm run docker:build     # Build Docker images
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # View logs

# PM2 (VPS)
npm run pm2:start        # Start with PM2
npm run pm2:stop         # Stop PM2
npm run pm2:restart      # Restart PM2
npm run pm2:logs         # View PM2 logs
```

## 🎯 Use Cases

- **Business Automation**: Automate repetitive business tasks
- **Research & Analysis**: Web research and data analysis
- **Content Creation**: Generate and optimize content
- **Data Processing**: File management and data transformation
- **Market Intelligence**: Track news and market trends
- **Customer Support**: Automated response systems

## 🔒 Security

- Helmet.js security headers
- Rate limiting enabled
- CORS protection
- Environment variable encryption
- No hardcoded secrets
- Regular security audits

## 📈 Monitoring

- Health check endpoint: `/api/health`
- Real-time execution logs
- Token usage tracking
- Cost management dashboard
- Error recovery tools

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Deployment Help**: See [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Version:** 1.0.0  
**Status:** Production Ready ✅  
**Last Updated:** March 31, 2026

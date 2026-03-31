const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize database (creates tables if needed)
require('./src/database/db');

const config = require('./src/config');
const app = express();
const PORT = config.PORT;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN
}));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  const cronManager = require('./src/scheduler/cronManager');
  res.json({
    status: 'OK',
    message: 'AI Workflow Platform API is running',
    activeSchedules: cronManager.getActiveJobCount(),
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/agents', require('./src/routes/agents'));
app.use('/api/workflows', require('./src/routes/workflows'));
app.use('/api/tasks', require('./src/routes/tasks'));
app.use('/api/tools', require('./src/routes/tools'));
app.use('/api/llm', require('./src/routes/llm'));
app.use('/api/schedules', require('./src/routes/schedules'));
app.use('/api/history', require('./src/routes/history'));
app.use('/api/approvals', require('./src/routes/approvals'));
app.use('/api/memory', require('./src/routes/memory'));
app.use('/api/canvas', require('./src/routes/canvas'));
app.use('/api/templates', require('./src/routes/templates'));
app.use('/api/seed', require('./src/routes/seed'));
app.use('/api', require('./src/routes/docker-tasks'));

// SSE real-time stream
app.get('/api/stream', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  res.write('event: connected\ndata: {}\n\n');
  // Patch broadcast to use this client
  const workflowRunner = require('./src/engine/workflowRunner');
  workflowRunner._addClient(res);
  _req.on('close', () => workflowRunner._removeClient(res));
});

// Error handling
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server — wait for DB to be ready before initializing scheduler
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Frontend:     http://localhost:3000\n`);

  // Give SQLite a moment to finish schema initialization, then boot scheduler
  setTimeout(() => {
    const cronManager = require('./src/scheduler/cronManager');
    cronManager.initialize();
  }, 1000);

  // Check and build Docker image if enabled
  if (process.env.USE_DOCKER_EXECUTION !== 'false') {
    setTimeout(async () => {
      try {
        const containerManager = require('./src/services/containerManager');
        const dockerAvailable = await containerManager.checkDockerAvailable();
        
        if (dockerAvailable) {
          console.log('🐳 Docker detected - checking task runner image...');
          
          // Check if image exists
          const { execSync } = require('child_process');
          try {
            const imageId = execSync('docker images -q orchestr-task-runner:latest', { encoding: 'utf-8' }).trim();
            
            if (imageId) {
              console.log('✅ Task runner image ready');
            } else {
              console.log('📦 Building task runner image (this may take 1-2 minutes)...');
              await containerManager.buildTaskRunnerImage();
              console.log('✅ Task runner image built successfully');
            }
          } catch (buildErr) {
            console.warn('⚠️  Failed to build task runner image:', buildErr.message);
            console.log('   Run manually: npm run docker:build-task-runner');
            console.log('   Or disable Docker: USE_DOCKER_EXECUTION=false in .env');
          }
        } else {
          console.log('ℹ️  Docker not available - tasks will run in regular mode');
        }
      } catch (err) {
        console.log('ℹ️  Docker check skipped:', err.message);
      }
    }, 2000);
  }
});

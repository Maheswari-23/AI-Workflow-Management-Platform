const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize database (creates tables if needed)
const { db } = require('./src/database/db');

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

// Error handling
app.use((err, req, res, next) => {
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
});

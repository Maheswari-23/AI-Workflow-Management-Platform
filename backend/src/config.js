const path = require('path');

/**
 * Centralized Configuration System
 * Moves hardcoded paths and values to a single source of truth.
 * Supports environment overrides.
 */
module.exports = {
  DB_PATH: process.env.DB_PATH || path.resolve(__dirname, 'database/data/workflow.db'),
  PORT: process.env.PORT || 3001,
  
  // LLM Default Parameters
  LLM_DEFAULTS: {
    temperature: 0.7,
    max_tokens: 2048,
  },

  // Security
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Execution
  POLLING_INTERVAL_MS: 10000,
};

#!/usr/bin/env node

/**
 * Task Runner - Executes workflows in Docker containers
 * This script runs inside a Docker container to execute a single task
 * Task data is passed via environment variables (no database needed)
 */

const workflowRunner = require('./src/engine/workflowRunner');

// Get task configuration from environment variables
const taskData = {
  id: process.env.TASK_ID,
  name: process.env.TASK_NAME || 'Docker Task',
  description: process.env.TASK_DESCRIPTION,
  agents: process.env.TASK_AGENTS ? JSON.parse(process.env.TASK_AGENTS) : [],
  workflow_steps: process.env.WORKFLOW_STEPS || '',
  max_retries: parseInt(process.env.MAX_RETRIES || '2'),
  retry_delay_ms: parseInt(process.env.RETRY_DELAY || '5000'),
};

console.log('🐳 Task Runner Container Started');
console.log('Task ID:', taskData.id);
console.log('Task Name:', taskData.name);
console.log('Description:', taskData.description);

async function runTask() {
  try {
    const startTime = Date.now();
    
    // Execute workflow using the actual workflowRunner
    // Pass task data directly (no database query needed)
    console.log('▶️  Starting workflow execution...');
    const result = await workflowRunner.run(taskData, 'docker', null);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Workflow completed in ${duration}ms`);
    
    // Output result as JSON for parent process to capture
    console.log('RESULT_START');
    console.log(JSON.stringify({
      success: true,
      taskId: taskData.id,
      result: result,
      duration: duration,
      timestamp: new Date().toISOString()
    }));
    console.log('RESULT_END');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Task execution failed:', error);
    
    // Output error as JSON
    console.log('RESULT_START');
    console.log(JSON.stringify({
      success: false,
      taskId: taskData.id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));
    console.log('RESULT_END');
    
    process.exit(1);
  }
}

// Handle timeout
const timeout = parseInt(process.env.TIMEOUT || '300000');
setTimeout(() => {
  console.error('⏱️  Task timeout exceeded');
  process.exit(124); // Timeout exit code
}, timeout);

// Handle signals
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(143);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(130);
});

// Run the task
runTask();

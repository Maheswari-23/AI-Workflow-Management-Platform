#!/usr/bin/env node

/**
 * Task Runner - Executes workflows in Docker containers
 * This script runs inside a Docker container to execute a single task
 */

const workflowRunner = require('./src/engine/workflowRunner');

// Get task configuration from environment variables
const taskConfig = {
  taskId: process.env.TASK_ID,
  description: process.env.TASK_DESCRIPTION,
  agentId: process.env.AGENT_ID,
  llmProvider: process.env.LLM_PROVIDER,
  maxSteps: parseInt(process.env.MAX_STEPS || '10'),
  timeout: parseInt(process.env.TIMEOUT || '300000'), // 5 minutes default
};

console.log('🐳 Task Runner Container Started');
console.log('Task ID:', taskConfig.taskId);
console.log('Description:', taskConfig.description);

async function runTask() {
  try {
    const startTime = Date.now();
    
    // Execute workflow
    console.log('▶️  Starting workflow execution...');
    const result = await workflowRunner.executeWorkflow(taskConfig);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Workflow completed in ${duration}ms`);
    
    // Output result as JSON for parent process to capture
    console.log('RESULT_START');
    console.log(JSON.stringify({
      success: true,
      taskId: taskConfig.taskId,
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
      taskId: taskConfig.taskId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));
    console.log('RESULT_END');
    
    process.exit(1);
  }
}

// Handle timeout
setTimeout(() => {
  console.error('⏱️  Task timeout exceeded');
  process.exit(124); // Timeout exit code
}, taskConfig.timeout);

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

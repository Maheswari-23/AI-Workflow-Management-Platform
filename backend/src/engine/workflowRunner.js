const axios = require('axios');
const { dbRun, dbGet, dbAll } = require('../database/db');

/**
 * Core Workflow Engine
 * Runs a task's workflow steps using the assigned agents and LLM.
 */
async function run(task, triggerType = 'manual', scheduleId = null) {
  const startTime = Date.now();

  // Create a run history entry with 'running' status
  const historyResult = await dbRun(
    'INSERT INTO run_history (task_id, task_name, schedule_id, trigger_type, status, output) VALUES (?, ?, ?, ?, ?, ?)',
    [task.id, task.name, scheduleId, triggerType, 'running', '']
  );
  const runId = historyResult.lastID;

  try {
    // Parse task fields
    const agentIds = typeof task.agents === 'string' ? JSON.parse(task.agents || '[]') : (task.agents || []);
    const workflowSteps = task.workflow_steps || '';

    let output = `=== Workflow Run Started ===\n`;
    output += `Task: ${task.name}\n`;
    output += `Trigger: ${triggerType}\n`;
    output += `Time: ${new Date().toISOString()}\n\n`;

    if (!workflowSteps.trim()) {
      output += `⚠️ No workflow steps defined. Using task description as the prompt.\n\n`;
    }

    // Load assigned agents from DB (or use a default)
    let agents = [];
    if (agentIds.length > 0) {
      agents = await dbAll(
        `SELECT * FROM agents WHERE id IN (${agentIds.map(() => '?').join(',')})`,
        agentIds
      );
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured in .env');
    }

    // Build execution prompt
    const taskPrompt = workflowSteps.trim()
      ? `You are executing the following workflow for the task "${task.name}".\n\nTask Description: ${task.description}\n\nWorkflow Steps to Execute:\n${workflowSteps}\n\nPlease execute these steps systematically and provide a detailed output report.`
      : `You are executing the task: "${task.name}".\n\nDescription: ${task.description}\n\nPlease complete this task and provide a detailed output report.`;

    // Build system prompt from first assigned agent, or use default
    const agentSystemPrompt = agents.length > 0 && agents[0].system_prompt
      ? agents[0].system_prompt
      : 'You are a professional AI workflow executor. Execute the given task systematically, clearly reporting outputs for each step.';

    if (agents.length > 0) {
      output += `Assigned Agents: ${agents.map(a => a.name).join(', ')}\n\n`;
    } else {
      output += `No specific agents assigned. Using default executor agent.\n\n`;
    }

    output += `--- Executing Workflow ---\n`;

    // Call LLM
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: agentSystemPrompt },
          { role: 'user', content: taskPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    const llmOutput = response.data.choices[0].message.content;
    output += llmOutput;
    output += `\n\n=== Workflow Completed Successfully ===\n`;
    output += `Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`;

    const duration = Date.now() - startTime;

    // Update history entry as completed
    await dbRun(
      'UPDATE run_history SET status = ?, output = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ? WHERE id = ?',
      ['completed', output, duration, runId]
    );

    // Update task status
    await dbRun('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['completed', task.id]);

    return { id: runId, status: 'completed', output, duration_ms: duration };

  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMsg = err.response?.data?.error?.message || err.message;

    await dbRun(
      'UPDATE run_history SET status = ?, error = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ? WHERE id = ?',
      ['failed', errorMsg, duration, runId]
    );

    console.error('WorkflowRunner error:', errorMsg);
    throw err;
  }
}

module.exports = { run };

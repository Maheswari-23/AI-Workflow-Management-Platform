const { dbRun, dbGet, dbAll } = require('../database/db');
const { getOpenCodeClient } = require('../opencode/client');
const { getDynamicTools, executeTool } = require('../opencode/toolsAdapter');

/**
 * Core Workflow Engine (OpenCode Powered)
 * Runs a task's workflow steps using the assigned OpenCode agents and dynamic tools.
 */
async function run(task, triggerType = 'manual', scheduleId = null) {
  const startTime = Date.now();

  const historyResult = await dbRun(
    'INSERT INTO run_history (task_id, task_name, schedule_id, trigger_type, status, output) VALUES (?, ?, ?, ?, ?, ?)',
    [task.id, task.name, scheduleId, triggerType, 'running', '']
  );
  const runId = historyResult.lastID;

  try {
    const agentIds = typeof task.agents === 'string' ? JSON.parse(task.agents || '[]') : (task.agents || []);
    const workflowSteps = task.workflow_steps || '';

    let output = `=== OpenCode Workflow Run Started ===\n`;
    output += `Task: ${task.name}\nTrigger: ${triggerType}\nTime: ${new Date().toISOString()}\n\n`;

    let agents = [];
    if (agentIds.length > 0) {
      agents = await dbAll(`SELECT * FROM agents WHERE id IN (${agentIds.map(() => '?').join(',')})`, agentIds);
    }

    // 1. Initialize OpenCode Client and Tools adapter
    // Using Groq as default, but this can easily switch to OpenAI via DB
    const opencode = await getOpenCodeClient('Groq');
    
    // Fetch user-defined APIs as native OpenCode functions
    const rawTools = await getDynamicTools();
    const openCodeTools = rawTools.map(t => ({ type: t.type, function: t.function }));
    
    if (openCodeTools.length > 0) {
      output += `Loaded ${openCodeTools.length} Dynamic Tool(s): ${openCodeTools.map(t => t.function.name).join(', ')}\n\n`;
    }

    const taskPrompt = workflowSteps.trim()
      ? `Task Description: ${task.description}\n\nWorkflow Steps:\n${workflowSteps}\n\nPlease execute these steps systematically.`
      : `Task Description: ${task.description}\n\nPlease complete this task systematically.`;

    const agentSystemPrompt = agents.length > 0 && agents[0].system_prompt
      ? agents[0].system_prompt
      : 'You are a professional OpenCode AI workflow executor. Execute the task effectively.';

    if (agents.length > 0) output += `Assigned Agent: ${agents[0].name}\n\n`;

    output += `--- Executing OpenCode Engine ---\n`;

    let messages = [
      { role: 'system', content: agentSystemPrompt },
      { role: 'user', content: taskPrompt },
    ];

    // 2. Execute First OpenCode Pass
    output += 'Executing initial reasoning pass...\n';
    let responseData = await opencode.generate(messages, openCodeTools);
    let messageOut = responseData.choices[0].message;
    messages.push(messageOut);

    // 3. Handle Tool Calls / Function chaining
    if (messageOut.tool_calls && messageOut.tool_calls.length > 0) {
      output += '\n🔧 OpenCode engine initiated tool calls:\n';
      
      for (const toolCall of messageOut.tool_calls) {
        let args = {};
        try { args = JSON.parse(toolCall.function.arguments); } catch(e){}
        
        output += `  -> Called [${toolCall.function.name}] with Args: ${JSON.stringify(args)}\n`;
        
        // Execute the physical API via our toolsAdapter
        const toolResult = await executeTool(toolCall.function.name, args, rawTools);
        
        output += `  <- Tool Returned Data (preview): ${String(toolResult).slice(0, 150)}...\n`;
        
        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: String(toolResult)
        });
      }

      // Final pass to synthesize tool results
      output += '\nProcessing tool outputs via OpenCode...\n';
      const finalPass = await opencode.generate(messages);
      output += `\nFinal Report:\n${finalPass.choices[0].message.content}\n`;
      
    } else {
       // Completed without tools
       output += `\nFinal Report:\n${messageOut.content}\n`;
    }

    output += `\n=== OpenCode Workflow Completed ===\n`;
    
    const duration = Date.now() - startTime;
    output += `Duration: ${(duration / 1000).toFixed(2)}s`;

    await dbRun('UPDATE run_history SET status = ?, output = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ? WHERE id = ?', ['completed', output, duration, runId]);
    await dbRun('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['completed', task.id]);

    return { id: runId, status: 'completed', output, duration_ms: duration };

  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMsg = err.response?.data?.error?.message || err.message;
    await dbRun('UPDATE run_history SET status = ?, error = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ? WHERE id = ?', ['failed', errorMsg, duration, runId]);
    console.error('OpenCode WorkflowRunner error:', errorMsg);
    throw err;
  }
}

module.exports = { run };

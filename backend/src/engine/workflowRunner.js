const { dbRun, dbGet, dbAll } = require('../database/db');
const { getOpenCodeClient } = require('../opencode/client');
const { getDynamicTools, executeTool } = require('../opencode/toolsAdapter');

// ─── SSE clients (defined first so broadcast is available everywhere) ─────────
const sseClients = new Set();
function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => { try { res.write(msg); } catch(e) {} });
}
function _addClient(res) { sseClients.add(res); }
function _removeClient(res) { sseClients.delete(res); }

// ─── Memory Helpers ───────────────────────────────────────────────────────────

async function getAgentMemory(agentId) {
  const rows = await dbAll('SELECT key, value FROM agent_memory WHERE agent_id = ?', [agentId]);
  const mem = {};
  rows.forEach(r => { mem[r.key] = r.value; });
  return mem;
}

async function setAgentMemory(agentId, key, value) {
  await dbRun(
    `INSERT INTO agent_memory (agent_id, key, value) VALUES (?, ?, ?)
     ON CONFLICT(agent_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
    [agentId, key, String(value)]
  );
}

// ─── Single Agent Execution ───────────────────────────────────────────────────

async function runAgent(agent, prompt, opencode, rawTools, previousOutput = '', metrics = null) {
  const openCodeTools = rawTools.map(t => ({ type: t.type, function: t.function }));

  // Load long-term memory for this agent
  const memory = await getAgentMemory(agent.id);
  const memoryContext = Object.keys(memory).length > 0
    ? `\n\n[AGENT MEMORY]\nYou have the following context from previous runs:\n${Object.entries(memory).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
    : '';

  let systemPrompt = agent.system_prompt || 'You are a helpful AI workflow executor.';
  systemPrompt += memoryContext;

  if (openCodeTools.length > 0) {
    const toolNames = openCodeTools.map(t => t.function.name).join(', ');
    systemPrompt += `\n\n[STRICT TOOL PROTOCOL]\nOnly use these tools: ${toolNames}. Never hallucinate tools not in this list.`;
  }

  const userContent = previousOutput
    ? `Previous agent output:\n${previousOutput}\n\nYour task:\n${prompt}`
    : prompt;

  let messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];

  let agentLog = `\n--- Agent: ${agent.name} ---\n`;
  agentLog += `Prompt: ${userContent.slice(0, 200)}...\n`;

  const responseData = await opencode.generate(messages, openCodeTools);
  if (metrics && responseData?.usage) {
    metrics.promptTokens += (responseData.usage.prompt_tokens || 0);
    metrics.completionTokens += (responseData.usage.completion_tokens || 0);
  }

  if (!responseData?.choices?.[0]) throw new Error(`Agent "${agent.name}" got invalid LLM response`);

  let messageOut = responseData.choices[0].message;
  messages.push(messageOut);

  if (messageOut.tool_calls?.length > 0) {
    agentLog += `\n[Tool calls initiated]\n`;
    for (const toolCall of messageOut.tool_calls) {
      let args = {};
      try { args = JSON.parse(toolCall.function.arguments); } catch(e) {}
      agentLog += `  -> [${toolCall.function.name}] args: ${JSON.stringify(args)}\n`;
      const toolResult = await executeTool(toolCall.function.name, args, rawTools);
      agentLog += `  <- Result: ${String(toolResult).slice(0, 200)}\n`;
      messages.push({ tool_call_id: toolCall.id, role: 'tool', name: toolCall.function.name, content: String(toolResult) });
    }
    const finalPass = await opencode.generate(messages);
    if (metrics && finalPass?.usage) {
      metrics.promptTokens += (finalPass.usage.prompt_tokens || 0);
      metrics.completionTokens += (finalPass.usage.completion_tokens || 0);
    }
    const finalContent = finalPass?.choices?.[0]?.message?.content || 'No output.';
    agentLog += `\nOutput:\n${finalContent}\n`;

    // Save last run output to memory under a fixed key (overwrites previous)
    await setAgentMemory(agent.id, 'last_run', finalContent.slice(0, 500));

    return { log: agentLog, output: finalContent };
  } else {
    const content = messageOut.content || 'No output.';
    agentLog += `\nOutput:\n${content}\n`;
    await setAgentMemory(agent.id, 'last_run', content.slice(0, 500));
    return { log: agentLog, output: content };
  }
}

// ─── Approval Gate ────────────────────────────────────────────────────────────

async function createApprovalGate(runId, taskId, taskName, stepIndex, stepDescription, agentOutput) {
  const result = await dbRun(
    `INSERT INTO pending_approvals (run_id, task_id, task_name, step_index, step_description, agent_output, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [runId, taskId, taskName, stepIndex, stepDescription, agentOutput]
  );
  return result.lastID;
}

async function waitForApproval(approvalId, timeoutMs = 5 * 60 * 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const approval = await dbGet('SELECT * FROM pending_approvals WHERE id = ?', [approvalId]);
    if (approval?.status !== 'pending') return approval;
    await new Promise(r => setTimeout(r, 3000)); // poll every 3s
  }
  // Timeout — auto-reject
  await dbRun(`UPDATE pending_approvals SET status = 'rejected', decision = 'timeout', resolved_at = CURRENT_TIMESTAMP WHERE id = ?`, [approvalId]);
  return { status: 'rejected', decision: 'timeout', feedback: 'Approval timed out after 5 minutes.' };
}

// ─── Main Workflow Runner ─────────────────────────────────────────────────────

async function run(task, triggerType = 'manual', scheduleId = null, attempt = 1) {
  const maxRetries = task.max_retries ?? 2;
  const retryDelay = task.retry_delay_ms ?? 5000;
  const startTime = Date.now();

  const historyResult = await dbRun(
    'INSERT INTO run_history (task_id, task_name, schedule_id, trigger_type, status, output) VALUES (?, ?, ?, ?, ?, ?)',
    [task.id, task.name, scheduleId, triggerType, 'running', '']
  );
  const runId = historyResult.lastID;
  return _executeRun(task, triggerType, scheduleId, attempt, runId, startTime);
}

// Variant that accepts a pre-created runId (for fire-and-forget from route)
async function runWithId(task, triggerType = 'manual', scheduleId = null, runId, attempt = 1) {
  const startTime = Date.now();
  return _executeRun(task, triggerType, scheduleId, attempt, runId, startTime);
}

async function _executeRun(task, triggerType, scheduleId, attempt, runId, startTime) {
  const maxRetries = task.max_retries ?? 2;
  const retryDelay = task.retry_delay_ms ?? 5000;

  // Token and cost tracking
  const runMetrics = { promptTokens: 0, completionTokens: 0, cost: 0.0, modelUsed: '' };

  // Accumulate output in memory, flush to DB every few lines for performance
  let outputBuffer = '';
  let flushTimer = null;

  async function flushOutput() {
    if (outputBuffer) {
      await dbRun('UPDATE run_history SET output = output || ? WHERE id = ?', [outputBuffer, runId]);
      outputBuffer = '';
    }
  }

  async function emit(line) {
    outputBuffer += line + '\n';
    broadcast('log', { runId, line, taskId: task.id });
    // Flush every 3 lines or immediately for important lines
    if (outputBuffer.split('\n').length > 3 || line.includes('===') || line.includes('Agent:')) {
      await flushOutput();
    }
  }

  try {
    const agentIds = typeof task.agents === 'string' ? JSON.parse(task.agents || '[]') : (task.agents || []);
    const workflowSteps = task.workflow_steps || '';

    await emit(`=== Workflow Run Started ===`);
    await emit(`Task: ${task.name} | Trigger: ${triggerType} | Attempt: ${attempt}/${maxRetries + 1}`);
    await emit(`Time: ${new Date().toISOString()}`);
    await emit('');

    let agents = [];
    if (agentIds.length > 0) {
      agents = await dbAll(`SELECT * FROM agents WHERE id IN (${agentIds.map(() => '?').join(',')})`, agentIds);
    }

    const opencode = await getOpenCodeClient();
    runMetrics.modelUsed = opencode.modelName || 'Unknown';
    const rawTools = await getDynamicTools();

    if (rawTools.length > 0) {
      await emit(`Loaded ${rawTools.length} tool(s): ${rawTools.map(t => t.function.name).join(', ')}`);
      await emit('');
    }

    const taskPrompt = workflowSteps.trim()
      ? `Task: ${task.description}\n\nWorkflow Steps:\n${workflowSteps}\n\nExecute these steps systematically.`
      : `Task: ${task.description}\n\nComplete this task systematically.`;

    const steps = workflowSteps.split('\n').filter(s => s.trim());
    const hasApprovalGates = steps.some(s => /\[APPROVAL\]|\[APPROVE\]/i.test(s));

    // ── Run agents ────────────────────────────────────────────────────────────
    const runAgentWithEmit = async (agent, prompt, previousOutput = '') => {
      const result = await runAgent(agent, prompt, opencode, rawTools, previousOutput, runMetrics);
      for (const line of result.log.split('\n')) await emit(line);
      return result;
    };

    if (agents.length === 0) {
      await emit('No agents assigned. Running with default executor.');
      const defaultAgent = { id: 0, name: 'Default Executor', system_prompt: 'You are a professional AI workflow executor.' };
      await runAgentWithEmit(defaultAgent, taskPrompt);
    } else if (agents.length === 1 && !hasApprovalGates) {
      await emit(`Agent: ${agents[0].name}`);
      await runAgentWithEmit(agents[0], taskPrompt);
    } else if (agents.length > 1) {
      await emit(`Multi-Agent Pipeline: ${agents.map(a => a.name).join(' → ')}`);
      await emit('');
      let previousOutput = '';
      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        
        // Check for approval gate BEFORE running agent (except first agent)
        if (i > 0) {
          const prevAgent = agents[i - 1];
          await emit(`\n[Approval gate] before ${agent.name}...`);
          await dbRun('UPDATE run_history SET status = ? WHERE id = ?', ['awaiting_approval', runId]);
          broadcast('status', { runId, status: 'awaiting_approval', taskId: task.id });
          const approvalId = await createApprovalGate(runId, task.id, task.name, i, `Review output from ${prevAgent.name} before passing to ${agent.name}`, previousOutput);
          await emit(`Waiting for approval (ID: ${approvalId})...`);
          const approval = await waitForApproval(approvalId);
          if (approval.status === 'rejected') {
            await emit(`\n[Rejected] Reason: ${approval.feedback || approval.decision}`);
            const duration = Date.now() - startTime;
            await dbRun('UPDATE run_history SET status = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ? WHERE id = ?', ['failed', duration, runId]);
            await dbRun('UPDATE tasks SET status = ? WHERE id = ?', ['draft', task.id]);
            broadcast('status', { runId, status: 'failed', taskId: task.id });
            return { id: runId, status: 'failed', duration_ms: duration };
          }
          await emit(`[Approved!] Continuing to ${agent.name}...`);
          if (approval.feedback) previousOutput += `\n\n[Human Feedback]: ${approval.feedback}`;
          // Resume workflow status to 'running' after approval
          await dbRun('UPDATE run_history SET status = ? WHERE id = ?', ['running', runId]);
          broadcast('status', { runId, status: 'running', taskId: task.id });
        }
        
        // Now run the agent
        await emit(`[Step ${i + 1}/${agents.length}] Handing off to: ${agent.name}`);
        await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['online', agent.id]);
        const result = await runAgentWithEmit(agent, taskPrompt, previousOutput);
        await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['offline', agent.id]);
        previousOutput = result.output;
      }
    } else if (hasApprovalGates) {
      await emit(`Agent: ${agents[0].name} (with approval gates)`);
      const agent = agents[0];
      let previousOutput = '';
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const needsApproval = /\[APPROVAL\]|\[APPROVE\]/i.test(step);
        const cleanStep = step.replace(/\[APPROVAL\]|\[APPROVE\]/gi, '').trim();
        if (!cleanStep) continue;
        await emit(`\n[Step ${i + 1}] ${cleanStep}`);
        await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['online', agent.id]);
        const result = await runAgentWithEmit(agent, cleanStep, previousOutput);
        await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['offline', agent.id]);
        previousOutput = result.output;
        if (needsApproval && i < steps.length - 1) {
          await emit('\n[Approval required] before next step...');
          await dbRun('UPDATE run_history SET status = ? WHERE id = ?', ['awaiting_approval', runId]);
          broadcast('status', { runId, status: 'awaiting_approval', taskId: task.id });
          const approvalId = await createApprovalGate(runId, task.id, task.name, i, `Review step ${i + 1} output`, previousOutput);
          const approval = await waitForApproval(approvalId);
          if (approval.status === 'rejected') {
            await emit(`\n[Rejected] at step ${i + 1}. Halting.`);
            const duration = Date.now() - startTime;
            await dbRun('UPDATE run_history SET status = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ? WHERE id = ?', ['failed', duration, runId]);
            await dbRun('UPDATE tasks SET status = ? WHERE id = ?', ['draft', task.id]);
            broadcast('status', { runId, status: 'failed', taskId: task.id });
            return { id: runId, status: 'failed', duration_ms: duration };
          }
          await emit('[Approved!] Continuing...');
          if (approval.feedback) previousOutput += `\n\n[Human Feedback]: ${approval.feedback}`;
          // Resume workflow status to 'running' after approval
          await dbRun('UPDATE run_history SET status = ? WHERE id = ?', ['running', runId]);
          broadcast('status', { runId, status: 'running', taskId: task.id });
        }
      }
    }

    await emit('\n=== Workflow Completed ===');
    const duration = Date.now() - startTime;
    await emit(`Duration: ${(duration / 1000).toFixed(2)}s`);
    await flushOutput(); // ensure all output is written

    // Calculate final cost
    if (opencode.pricing) {
      const promptCost = (runMetrics.promptTokens / 1_000_000) * opencode.pricing.promptCost;
      const compCost = (runMetrics.completionTokens / 1_000_000) * opencode.pricing.completionCost;
      runMetrics.cost = parseFloat((promptCost + compCost).toFixed(6));
    }

    const finalRun = await dbGet('SELECT output FROM run_history WHERE id = ?', [runId]);
    await dbRun(`UPDATE run_history 
                 SET status = ?, output = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ?,
                     prompt_tokens = ?, completion_tokens = ?, total_cost = ?, model_used = ?
                 WHERE id = ?`,
      ['completed', finalRun.output, duration, runMetrics.promptTokens, runMetrics.completionTokens, runMetrics.cost, runMetrics.modelUsed, runId]);
    await dbRun('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['completed', task.id]);
    broadcast('status', { runId, status: 'completed', taskId: task.id, metrics: runMetrics });

    return { id: runId, status: 'completed', output: finalRun.output, duration_ms: duration, metrics: runMetrics };

  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.error('WorkflowRunner error:', errorMsg);
    await flushOutput();

    // ── Retry logic ───────────────────────────────────────────────────────────
    if (attempt <= maxRetries) {
      await dbRun('UPDATE run_history SET status = ?, error = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ? WHERE id = ?',
        ['failed', `Attempt ${attempt} failed: ${errorMsg}. Retrying...`, duration, runId]);
      broadcast('status', { runId, status: 'retrying', attempt, taskId: task.id });
      await new Promise(r => setTimeout(r, retryDelay));
      return _executeRun(task, triggerType, scheduleId, attempt + 1, runId, Date.now());
    }

    await dbRun('UPDATE run_history SET status = ?, error = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ? WHERE id = ?',
      ['failed', errorMsg, duration, runId]);
    await dbRun('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['draft', task.id]);
    broadcast('status', { runId, status: 'failed', taskId: task.id });
    throw err;
  }
}

module.exports = { run, runWithId, broadcast, _addClient, _removeClient };

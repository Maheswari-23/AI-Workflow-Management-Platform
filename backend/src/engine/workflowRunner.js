const { dbRun, dbGet, dbAll } = require('../database/db');
const { getOpenCodeClient } = require('../opencode/client');
const { getDynamicTools, executeTool } = require('../opencode/toolsAdapter');

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

async function runAgent(agent, prompt, opencode, rawTools, previousOutput = '') {
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
  if (!responseData?.choices?.[0]) throw new Error(`Agent "${agent.name}" got invalid LLM response`);

  let messageOut = responseData.choices[0].message;
  messages.push(messageOut);

  if (messageOut.tool_calls?.length > 0) {
    agentLog += `\n🔧 Tool calls initiated:\n`;
    for (const toolCall of messageOut.tool_calls) {
      let args = {};
      try { args = JSON.parse(toolCall.function.arguments); } catch(e) {}
      agentLog += `  -> [${toolCall.function.name}] args: ${JSON.stringify(args)}\n`;
      const toolResult = await executeTool(toolCall.function.name, args, rawTools);
      agentLog += `  <- Result: ${String(toolResult).slice(0, 200)}\n`;
      messages.push({ tool_call_id: toolCall.id, role: 'tool', name: toolCall.function.name, content: String(toolResult) });
    }
    const finalPass = await opencode.generate(messages);
    const finalContent = finalPass?.choices?.[0]?.message?.content || 'No output.';
    agentLog += `\nOutput:\n${finalContent}\n`;

    // Auto-save key facts to agent memory
    await setAgentMemory(agent.id, `last_run_${Date.now()}`, finalContent.slice(0, 500));

    return { log: agentLog, output: finalContent };
  } else {
    const content = messageOut.content || 'No output.';
    agentLog += `\nOutput:\n${content}\n`;
    await setAgentMemory(agent.id, `last_run_${Date.now()}`, content.slice(0, 500));
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

    let output = `=== Workflow Run Started ===\n`;
    output += `Task: ${task.name}\nTrigger: ${triggerType}\nTime: ${new Date().toISOString()}\n\n`;

    // Load all assigned agents (multi-agent support)
    let agents = [];
    if (agentIds.length > 0) {
      agents = await dbAll(`SELECT * FROM agents WHERE id IN (${agentIds.map(() => '?').join(',')})`, agentIds);
    }

    const opencode = await getOpenCodeClient();
    const rawTools = await getDynamicTools();

    if (rawTools.length > 0) {
      output += `Loaded ${rawTools.length} tool(s): ${rawTools.map(t => t.function.name).join(', ')}\n\n`;
    }

    const taskPrompt = workflowSteps.trim()
      ? `Task: ${task.description}\n\nWorkflow Steps:\n${workflowSteps}\n\nExecute these steps systematically.`
      : `Task: ${task.description}\n\nComplete this task systematically.`;

    // Check if workflow has approval gates (lines containing [APPROVAL] or [APPROVE])
    const steps = workflowSteps.split('\n').filter(s => s.trim());
    const hasApprovalGates = steps.some(s => /\[APPROVAL\]|\[APPROVE\]/i.test(s));

    if (agents.length === 0) {
      // No agents assigned — run with default system prompt
      output += `No agents assigned. Running with default executor.\n`;
      const defaultAgent = { id: 0, name: 'Default Executor', system_prompt: 'You are a professional AI workflow executor.' };
      const result = await runAgent(defaultAgent, taskPrompt, opencode, rawTools);
      output += result.log;
    } else if (agents.length === 1 && !hasApprovalGates) {
      // Single agent, no approval gates — original behavior
      output += `Agent: ${agents[0].name}\n`;
      const result = await runAgent(agents[0], taskPrompt, opencode, rawTools);
      output += result.log;
    } else if (agents.length > 1) {
      // ── MULTI-AGENT COLLABORATION ──────────────────────────────────────────
      output += `Multi-Agent Pipeline: ${agents.map(a => a.name).join(' → ')}\n\n`;

      let previousOutput = '';
      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        output += `\n[Step ${i + 1}/${agents.length}] Handing off to: ${agent.name}\n`;

        await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['online', agent.id]);
        const result = await runAgent(agent, taskPrompt, opencode, rawTools, previousOutput);
        await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['offline', agent.id]);

        output += result.log;
        previousOutput = result.output;

        // Update run history with progress
        await dbRun('UPDATE run_history SET output = ? WHERE id = ?', [output, runId]);

        // Check if next step needs approval
        if (i < agents.length - 1) {
          const nextAgent = agents[i + 1];
          output += `\n⏸ Creating approval gate before handing off to ${nextAgent.name}...\n`;
          await dbRun('UPDATE run_history SET output = ?, status = ? WHERE id = ?', [output, 'awaiting_approval', runId]);

          const approvalId = await createApprovalGate(
            runId, task.id, task.name, i + 1,
            `Review output from ${agent.name} before passing to ${nextAgent.name}`,
            previousOutput
          );

          output += `Waiting for human approval (ID: ${approvalId})...\n`;
          await dbRun('UPDATE run_history SET output = ? WHERE id = ?', [output, runId]);

          const approval = await waitForApproval(approvalId);

          if (approval.status === 'rejected') {
            output += `\n❌ Approval rejected at step ${i + 1}. Reason: ${approval.feedback || approval.decision}\n`;
            output += `Workflow halted.\n`;
            const duration = Date.now() - startTime;
            await dbRun('UPDATE run_history SET status = ?, output = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ? WHERE id = ?',
              ['failed', output, duration, runId]);
            await dbRun('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['draft', task.id]);
            return { id: runId, status: 'failed', output, duration_ms: duration };
          }

          output += `✅ Approved! Continuing to ${nextAgent.name}...\n`;
          if (approval.feedback) {
            previousOutput += `\n\n[Human Feedback]: ${approval.feedback}`;
          }
        }
      }
    } else if (hasApprovalGates) {
      // Single agent with approval gates in workflow steps
      output += `Agent: ${agents[0].name} (with approval gates)\n\n`;
      const agent = agents[0];
      let previousOutput = '';

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const needsApproval = /\[APPROVAL\]|\[APPROVE\]/i.test(step);
        const cleanStep = step.replace(/\[APPROVAL\]|\[APPROVE\]/gi, '').trim();

        if (!cleanStep) continue;

        output += `\n[Step ${i + 1}] ${cleanStep}\n`;
        await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['online', agent.id]);
        const result = await runAgent(agent, cleanStep, opencode, rawTools, previousOutput);
        await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['offline', agent.id]);

        output += result.log;
        previousOutput = result.output;
        await dbRun('UPDATE run_history SET output = ? WHERE id = ?', [output, runId]);

        if (needsApproval && i < steps.length - 1) {
          output += `\n⏸ Approval required before next step...\n`;
          await dbRun('UPDATE run_history SET output = ?, status = ? WHERE id = ?', [output, 'awaiting_approval', runId]);

          const approvalId = await createApprovalGate(
            runId, task.id, task.name, i,
            `Review step ${i + 1} output before continuing`,
            previousOutput
          );

          const approval = await waitForApproval(approvalId);

          if (approval.status === 'rejected') {
            output += `\n❌ Rejected at step ${i + 1}. Halting workflow.\n`;
            const duration = Date.now() - startTime;
            await dbRun('UPDATE run_history SET status = ?, output = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ? WHERE id = ?',
              ['failed', output, duration, runId]);
            await dbRun('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['draft', task.id]);
            return { id: runId, status: 'failed', output, duration_ms: duration };
          }

          output += `✅ Approved! Continuing...\n`;
          if (approval.feedback) previousOutput += `\n\n[Human Feedback]: ${approval.feedback}`;
        }
      }
    }

    output += `\n=== Workflow Completed ===\n`;
    const duration = Date.now() - startTime;
    output += `Duration: ${(duration / 1000).toFixed(2)}s`;

    await dbRun('UPDATE run_history SET status = ?, output = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ? WHERE id = ?',
      ['completed', output, duration, runId]);
    await dbRun('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['completed', task.id]);

    return { id: runId, status: 'completed', output, duration_ms: duration };

  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMsg = err.response?.data?.error?.message || err.message;
    await dbRun('UPDATE run_history SET status = ?, error = ?, completed_at = CURRENT_TIMESTAMP, duration_ms = ? WHERE id = ?',
      ['failed', errorMsg, duration, runId]);
    console.error('WorkflowRunner error:', errorMsg);
    throw err;
  }
}

module.exports = { run };

const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database/db');
const openCode = require('../opencode/client');
const safeParse = require('../utils/safeParse');

// ─────────────────────────────────────────────
// CRUD ROUTES
// ─────────────────────────────────────────────

// GET all agents
router.get('/', async (req, res) => {
  try {
    const agents = await dbAll('SELECT * FROM agents ORDER BY created_at DESC');
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single agent
router.get('/:id', async (req, res) => {
  try {
    const agent = await dbGet('SELECT * FROM agents WHERE id = ?', [req.params.id]);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({ agent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create agent
router.post('/', async (req, res) => {
  try {
    const { name, system_prompt = '', skill_file_name = '' } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await dbRun(
      'INSERT INTO agents (name, system_prompt, skill_file_name, status) VALUES (?, ?, ?, ?)',
      [name, system_prompt, skill_file_name, 'offline']
    );
    const agent = await dbGet('SELECT * FROM agents WHERE id = ?', [result.lastID]);
    res.status(201).json({ agent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update agent
router.put('/:id', async (req, res) => {
  try {
    const { name, system_prompt, skill_file_name, status } = req.body;
    await dbRun(
      `UPDATE agents SET name = COALESCE(?, name), system_prompt = COALESCE(?, system_prompt),
       skill_file_name = COALESCE(?, skill_file_name), status = COALESCE(?, status),
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, system_prompt, skill_file_name, status, req.params.id]
    );
    const agent = await dbGet('SELECT * FROM agents WHERE id = ?', [req.params.id]);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({ agent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE agent
router.delete('/:id', async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM agents WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Agent not found' });
    res.json({ message: 'Agent deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET agent status
router.get('/:id/status', async (req, res) => {
  try {
    const agent = await dbGet('SELECT id, name, status FROM agents WHERE id = ?', [req.params.id]);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({ status: agent.status, name: agent.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// EXECUTE ROUTE — OpenCode Engine
// ─────────────────────────────────────────────

const { getOpenCodeClient } = require('../opencode/client');
const { getDynamicTools, executeTool } = require('../opencode/toolsAdapter');

router.post('/:id/execute', async (req, res) => {
  const { prompt, systemPrompt } = req.body;

  try {
    // Mark agent online during execution
    await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['online', req.params.id]);

    const opencode = await getOpenCodeClient(); // Fetches configure LLM from DB
    const rawTools = await getDynamicTools();
    const openCodeTools = rawTools.map(t => ({ type: t.type, function: t.function }));

    const agentSystemPrompt = systemPrompt || 'You are a helpful OpenCode AI assistant with access to tools.';
    let messages = [
      { role: 'system', content: agentSystemPrompt },
      { role: 'user', content: prompt },
    ];
    let executionLog = '🤖 OpenCode Agent started...\n';
    
    if (openCodeTools.length > 0) {
      executionLog += `Loaded tools: ${openCodeTools.map(t => t.function.name).join(', ')}\n`;
    }

    executionLog += `Sending prompt: "${prompt}"\n`;
    
    const responseData = await opencode.generate(messages, openCodeTools);
    const messageOut = responseData.choices[0].message;
    messages.push(messageOut);

    if (messageOut.tool_calls && messageOut.tool_calls.length > 0) {
      executionLog += '\n⚙️ OpenCode engine decided to call tools!\n';
      
      for (const toolCall of messageOut.tool_calls) {
        let args = {};
        try { args = JSON.parse(toolCall.function.arguments); } catch(e){}
        
        executionLog += `  -> Executing Tool [${toolCall.function.name}] with args: ${JSON.stringify(args)}\n`;
        const toolResult = await executeTool(toolCall.function.name, args, rawTools);
        executionLog += `  <- Tool returned data.\n`;
        
        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: String(toolResult)
        });
      }
      
      executionLog += '\nSynthesizing final response...\n';
      const finalResponse = await opencode.generate(messages);
      executionLog += `\nAgent Final Output:\n${finalResponse.choices[0].message.content}`;
    } else {
      executionLog += `\nAgent Final Output:\n${messageOut.content}`;
    }

    await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['offline', req.params.id]);
    return res.json({ result: executionLog });
  } catch (error) {
    await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['offline', req.params.id]);
    console.error('OpenCode Execution Error:', error);
    return res.status(500).json({
      result: `Execution failed.\n${error.response?.data?.error?.message || error.message}`,
    });
  }
});

module.exports = router;

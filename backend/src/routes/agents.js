const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database/db');
const axios = require('axios');

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
// EXECUTE ROUTE — LLM + Tool Calling via Groq
// ─────────────────────────────────────────────

const calculateMath = (expression) => {
  try {
    return new Function(`return ${expression}`)();
  } catch (error) {
    return 'Error evaluating expression: ' + error.message;
  }
};

const tools = [
  {
    type: 'function',
    function: {
      name: 'calculate_math',
      description: 'Evaluate simple mathematical expressions. ONLY pass valid JS math expressions.',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: "The math expression e.g. '45 / 5'" },
        },
        required: ['expression'],
      },
    },
  },
];

router.post('/:id/execute', async (req, res) => {
  const { prompt, systemPrompt } = req.body;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return res.status(401).json({ result: 'ERROR: Missing GROQ_API_KEY in backend/.env' });
  }

  try {
    // Mark agent online during execution
    await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['online', req.params.id]);

    const agentSystemPrompt = systemPrompt || 'You are a helpful AI assistant with access to tools.';
    let messages = [
      { role: 'system', content: agentSystemPrompt },
      { role: 'user', content: prompt },
    ];
    let executionLog = 'Agent started...\n';

    const callGroq = async (msgs) =>
      axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        { model: 'llama-3.3-70b-versatile', messages: msgs, tools, tool_choice: 'auto', temperature: 0.2 },
        { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
      );

    executionLog += `Sending prompt to LLM: "${prompt}"\n`;
    const initialResponse = await callGroq(messages);
    const messageOut = initialResponse.data.choices[0].message;
    messages.push(messageOut);

    if (messageOut.tool_calls?.length > 0) {
      executionLog += '\nLLM decided to call a tool!\n';
      for (const toolCall of messageOut.tool_calls) {
        if (toolCall.function.name === 'calculate_math') {
          const args = JSON.parse(toolCall.function.arguments);
          executionLog += `Executing Tool [calculate_math] with args: ${args.expression}\n`;
          const toolResult = calculateMath(args.expression);
          executionLog += `Tool returned: ${toolResult}\n\n`;
          messages.push({ tool_call_id: toolCall.id, role: 'tool', name: toolCall.function.name, content: String(toolResult) });
        }
      }
      executionLog += 'Sending tool result back to LLM...\n';
      const finalResponse = await callGroq(messages);
      executionLog += `\nAgent Final Output:\n${finalResponse.data.choices[0].message.content}`;
    } else {
      executionLog += `\nAgent Final Output (No tools used):\n${messageOut.content}`;
    }

    await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['offline', req.params.id]);
    return res.json({ result: executionLog });
  } catch (error) {
    await dbRun('UPDATE agents SET status = ? WHERE id = ?', ['offline', req.params.id]);
    console.error('Execution Error:', error.response?.data || error.message);
    return res.status(500).json({
      result: `Execution failed.\n${error.response?.data?.error?.message || error.message}`,
    });
  }
});

module.exports = router;

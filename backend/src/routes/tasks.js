const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database/db');
const workflowRunner = require('../engine/workflowRunner');

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await dbAll('SELECT * FROM tasks ORDER BY created_at DESC');
    // Parse agents JSON array
    const parsed = tasks.map(t => ({ ...t, agents: JSON.parse(t.agents || '[]') }));
    res.json({ tasks: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single task
router.get('/:id', async (req, res) => {
  try {
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: { ...task, agents: JSON.parse(task.agents || '[]') } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create task
router.post('/', async (req, res) => {
  try {
    const { name, description = '', agents = [], workflow_steps = '' } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await dbRun(
      'INSERT INTO tasks (name, description, agents, workflow_steps, status) VALUES (?, ?, ?, ?, ?)',
      [name, description, JSON.stringify(agents), workflow_steps, 'draft']
    );
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
    res.status(201).json({ task: { ...task, agents: JSON.parse(task.agents || '[]') } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const { name, description, agents, workflow_steps, status } = req.body;
    await dbRun(
      `UPDATE tasks SET name = COALESCE(?, name), description = COALESCE(?, description),
       agents = COALESCE(?, agents), workflow_steps = COALESCE(?, workflow_steps),
       status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        name, description,
        agents !== undefined ? JSON.stringify(agents) : null,
        workflow_steps, status, req.params.id
      ]
    );
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: { ...task, agents: JSON.parse(task.agents || '[]') } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST run a task (triggers workflow engine)
router.post('/:id/run', async (req, res) => {
  try {
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const result = await workflowRunner.run(task, 'manual');
    res.json({ run: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST generate workflow steps via LLM
router.post('/:id/generate-steps', async (req, res) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(401).json({ error: 'Missing GROQ_API_KEY' });

  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'Description is required' });

    const axios = require('axios');
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an AI workflow architect. When given a task description, generate clear, numbered workflow steps that an AI agent system should follow. Each step should be actionable and specific. Format as a numbered list only, no extra commentary.`,
          },
          {
            role: 'user',
            content: `Generate workflow steps for this task: ${description}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 800,
      },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    const steps = response.data.choices[0].message.content;
    // Auto-save steps to task
    await dbRun('UPDATE tasks SET workflow_steps = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [steps, 'saved', req.params.id]);
    res.json({ steps });
  } catch (err) {
    console.error('Generate steps error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

module.exports = router;

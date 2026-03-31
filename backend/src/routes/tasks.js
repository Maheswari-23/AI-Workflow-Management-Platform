const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database/db');
const workflowRunner = require('../engine/workflowRunner');
const safeParse = require('../utils/safeParse');
const { getOpenCodeClient } = require('../opencode/client');
const { validateSchema, schemas } = require('../utils/validator');

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await dbAll('SELECT * FROM tasks ORDER BY created_at DESC');
    // Parse agents JSON array safely
    const parsed = tasks.map(t => ({ 
      ...t, 
      agents: safeParse(t.agents, [])
    }));
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
    const parsed = {
      ...task,
      agents: safeParse(task.agents, [])
    };
    res.json({ task: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create task
router.post('/', async (req, res) => {
  try {
    const errors = validateSchema(req.body, schemas.TASK_SCHEMA);
    if (errors.length > 0) return res.status(400).json({ error: errors.join(', ') });

    const { name, description = '', agents = [], workflow_steps = '' } = req.body;
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

// PUT update task (auto-snapshots version)
router.put('/:id', async (req, res) => {
  try {
    const { name, description, agents, workflow_steps, status } = req.body;

    // Snapshot current state before overwriting
    const current = await dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (current) {
      const lastVersion = await dbGet('SELECT MAX(version_number) as v FROM task_versions WHERE task_id = ?', [req.params.id]);
      const nextVersion = (lastVersion?.v || 0) + 1;
      await dbRun('INSERT INTO task_versions (task_id, version_number, snapshot) VALUES (?, ?, ?)',
        [req.params.id, nextVersion, JSON.stringify(current)]);
      // Keep only last 10 versions
      await dbRun(`DELETE FROM task_versions WHERE task_id = ? AND id NOT IN (SELECT id FROM task_versions WHERE task_id = ? ORDER BY version_number DESC LIMIT 10)`,
        [req.params.id, req.params.id]);
    }

    await dbRun(
      `UPDATE tasks SET name = COALESCE(?, name), description = COALESCE(?, description),
       agents = COALESCE(?, agents), workflow_steps = COALESCE(?, workflow_steps),
       status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, description, agents !== undefined ? JSON.stringify(agents) : null, workflow_steps, status, req.params.id]
    );
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: { ...task, agents: JSON.parse(task.agents || '[]') } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET task version history
router.get('/:id/versions', async (req, res) => {
  try {
    const versions = await dbAll('SELECT id, version_number, created_at FROM task_versions WHERE task_id = ? ORDER BY version_number DESC', [req.params.id]);
    res.json({ versions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST restore a version
router.post('/:id/restore/:versionId', async (_req, res) => {
  try {
    const version = await dbGet('SELECT * FROM task_versions WHERE id = ? AND task_id = ?', [req.params.versionId, req.params.id]);
    if (!version) return res.status(404).json({ error: 'Version not found' });
    const snap = JSON.parse(version.snapshot);
    await dbRun(`UPDATE tasks SET name = ?, description = ?, agents = ?, workflow_steps = ?, status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [snap.name, snap.description, snap.agents, snap.workflow_steps, req.params.id]);
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ task: { ...task, agents: JSON.parse(task.agents || '[]') }, message: `Restored to version ${version.version_number}` });
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

// POST run a task — fires async, returns runId immediately
router.post('/:id/run', async (req, res) => {
  try {
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Create run record immediately so frontend has a runId to track
    const historyResult = await dbRun(
      'INSERT INTO run_history (task_id, task_name, trigger_type, status, output) VALUES (?, ?, ?, ?, ?)',
      [task.id, task.name, 'manual', 'running', '']
    );
    const runId = historyResult.lastID;

    // Fire workflow in background — don't await
    workflowRunner.runWithId(task, 'manual', null, runId).catch(err => {
      console.error('Background run error:', err.message);
    });

    res.json({ runId, status: 'running', message: 'Workflow started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET live output for a run (polling fallback)
router.get('/:taskId/run/:runId/output', async (req, res) => {
  try {
    const run = await dbGet('SELECT status, output, error, duration_ms FROM run_history WHERE id = ?', [req.params.runId]);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    res.json(run);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST generate workflow steps via LLM
router.post('/:id/generate-steps', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'Description is required' });

    const opencode = await getOpenCodeClient();
    if (!opencode.apiKey) {
      return res.status(401).json({ error: 'No API Key configured. Please verify LLM provider settings.' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are an AI workflow architect. When given a task description, generate clear, numbered workflow steps that an AI agent system should follow. Each step should be actionable and specific. Format as a numbered list only, no extra commentary.`,
      },
      {
        role: 'user',
        content: `Generate workflow steps for this task: ${description}`,
      },
    ];

    const response = await opencode.generate(messages);
    if (!response || !response.choices || !response.choices[0]) {
      return res.status(500).json({ error: 'Invalid response from LLM provider' });
    }

    const steps = response.choices[0].message.content;
    // Auto-save steps to task
    await dbRun('UPDATE tasks SET workflow_steps = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [steps, 'saved', req.params.id]);
    res.json({ steps });
  } catch (err) {
    console.error('Generate steps error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

module.exports = router;

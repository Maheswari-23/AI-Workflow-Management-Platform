const express = require('express');
const router = express.Router();
const { dbGet, dbAll } = require('../database/db');
const safeParse = require('../utils/safeParse');

// GET all workflows (backed by tasks with workflow_steps)
router.get('/', async (req, res) => {
  try {
    const tasks = await dbAll("SELECT * FROM tasks WHERE workflow_steps != '' ORDER BY updated_at DESC");
    const parsed = tasks.map(t => ({ 
      ...t, 
      agents: safeParse(t.agents, [])
    }));
    res.json({ workflows: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single workflow
router.get('/:id', async (_req, res) => {
  try {
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Workflow not found' });
    const parsed = {
      ...task,
      agents: safeParse(task.agents, [])
    };
    res.json({ workflow: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

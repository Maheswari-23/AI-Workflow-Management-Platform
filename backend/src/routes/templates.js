const express = require('express');
const router = express.Router();
const { WORKFLOW_TEMPLATES } = require('../data/workflowTemplates');
const { dbRun, dbGet, dbAll } = require('../database/db');

// GET all workflow templates
router.get('/', async (_req, res) => {
  try {
    res.json({ templates: WORKFLOW_TEMPLATES });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single template by ID
router.get('/:id', async (req, res) => {
  try {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create task from template
router.post('/:id/create', async (req, res) => {
  try {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const { custom_description } = req.body;
    const description = custom_description || template.example_description;

    // Create task from template
    const result = await dbRun(
      'INSERT INTO tasks (name, description, agents, workflow_steps, status) VALUES (?, ?, ?, ?, ?)',
      [template.name, description, JSON.stringify([]), template.workflow_steps, 'draft']
    );

    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
    res.status(201).json({ 
      task: { ...task, agents: JSON.parse(task.agents || '[]') },
      message: `Task created from template: ${template.name}`,
      template_info: {
        suggested_agents: template.agents,
        suggested_tools: template.suggested_tools,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET templates by category
router.get('/category/:category', async (req, res) => {
  try {
    const templates = WORKFLOW_TEMPLATES.filter(t => 
      t.category.toLowerCase() === req.params.category.toLowerCase()
    );
    res.json({ templates, category: req.params.category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

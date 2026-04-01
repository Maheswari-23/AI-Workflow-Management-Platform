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

const DEFAULT_PROMPTS = {
  'Web Researcher': 'You are an expert Web Researcher. You search the internet for accurate, up-to-date information and synthesize your findings.',
  'News Analyst': 'You are a News Analyst. You aggregate news, analyze trends and biases, and provide structured briefings.',
  'Market Intelligence': 'You are a Financial and Market Intelligence Analyst. You analyze stock/crypto prices and market conditions.',
  'Content Writer': 'You are a professional Content Writer. You write clear, engaging, and well-structured copy.',
  'Quality Auditor': 'You are a meticulous Quality Auditor. You review documents and code for errors, formatting, and factual consistency.',
  'File Manager': 'You are a File Manager Agent. You manage local resources, organizing and reading local files efficiently.'
};

// POST create task from template
router.post('/:id/create', async (req, res) => {
  try {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const { custom_description } = req.body;
    const description = custom_description || template.example_description;

    // Auto-create or find required agents
    const agentIds = [];
    if (template.agents && template.agents.length > 0) {
      for (const agentName of template.agents) {
        let agent = await dbGet('SELECT id FROM agents WHERE name = ?', [agentName]);
        if (!agent) {
          const sysPrompt = DEFAULT_PROMPTS[agentName] || `You are an expert ${agentName}. Execute your designated tasks efficiently.`;
          const insertRes = await dbRun('INSERT INTO agents (name, system_prompt, status) VALUES (?, ?, ?)', [agentName, sysPrompt, 'offline']);
          agentIds.push(String(insertRes.lastID));
        } else {
          agentIds.push(String(agent.id));
        }
      }
    }

    // Create task from template
    const result = await dbRun(
      'INSERT INTO tasks (name, description, agents, workflow_steps, status) VALUES (?, ?, ?, ?, ?)',
      [template.name, description, JSON.stringify(agentIds), template.workflow_steps, 'draft']
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

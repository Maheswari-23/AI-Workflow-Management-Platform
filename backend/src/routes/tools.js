const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database/db');

// GET all tools
router.get('/', async (req, res) => {
  try {
    const tools = await dbAll('SELECT * FROM tools ORDER BY created_at DESC');
    res.json({ tools });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single tool
router.get('/:id', async (req, res) => {
  try {
    const tool = await dbGet('SELECT * FROM tools WHERE id = ?', [req.params.id]);
    if (!tool) return res.status(404).json({ error: 'Tool not found' });
    res.json({ tool });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create tool
router.post('/', async (req, res) => {
  try {
    const { name, type = 'api', description = '', endpoint = '', method = 'GET', headers = '{}' } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await dbRun(
      'INSERT INTO tools (name, type, description, endpoint, method, headers, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, type, description, endpoint, method, typeof headers === 'string' ? headers : JSON.stringify(headers), 'active']
    );
    const tool = await dbGet('SELECT * FROM tools WHERE id = ?', [result.lastID]);
    res.status(201).json({ tool });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update tool
router.put('/:id', async (req, res) => {
  try {
    const { name, type, description, endpoint, method, headers, status } = req.body;
    await dbRun(
      `UPDATE tools SET name = COALESCE(?, name), type = COALESCE(?, type),
       description = COALESCE(?, description), endpoint = COALESCE(?, endpoint),
       method = COALESCE(?, method), status = COALESCE(?, status),
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, type, description, endpoint, method, status, req.params.id]
    );
    const tool = await dbGet('SELECT * FROM tools WHERE id = ?', [req.params.id]);
    if (!tool) return res.status(404).json({ error: 'Tool not found' });
    res.json({ tool });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE tool
router.delete('/:id', async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM tools WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Tool not found' });
    res.json({ message: 'Tool deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

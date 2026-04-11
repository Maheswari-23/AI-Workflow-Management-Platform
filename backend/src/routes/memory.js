const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database/db');

// GET all memory for an agent (with optional search)
router.get('/:agentId', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM agent_memory WHERE agent_id = ?';
    const params = [req.params.agentId];
    
    if (search) {
      query += ' AND (key LIKE ? OR value LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY updated_at DESC';
    const rows = await dbAll(query, params);
    res.json({ memory: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a memory entry
router.delete('/:agentId/:key', async (req, res) => {
  try {
    await dbRun('DELETE FROM agent_memory WHERE agent_id = ? AND key = ?', [req.params.agentId, req.params.key]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST/PUT set or update a memory entry
router.post('/:agentId', async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'Key is required' });
    await dbRun(
      `INSERT INTO agent_memory (agent_id, key, value) VALUES (?, ?, ?)
       ON CONFLICT(agent_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      [req.params.agentId, key, String(value || '')]
    );
    res.json({ success: true, message: 'Memory saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a memory entry
router.delete('/:agentId/:key', async (req, res) => {
  try {
    await dbRun('DELETE FROM agent_memory WHERE agent_id = ? AND key = ?', [req.params.agentId, req.params.key]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE all memory for an agent
router.delete('/:agentId', async (req, res) => {
  try {
    await dbRun('DELETE FROM agent_memory WHERE agent_id = ?', [req.params.agentId]);
    res.json({ success: true, message: 'Memory cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

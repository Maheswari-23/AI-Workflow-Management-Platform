const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database/db');

// GET all memory for an agent
router.get('/:agentId', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM agent_memory WHERE agent_id = ? ORDER BY updated_at DESC', [req.params.agentId]);
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

const express = require('express');
const router = express.Router();
const { dbAll, dbGet } = require('../database/db');

// GET all run history
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await dbAll(
      'SELECT * FROM run_history ORDER BY started_at DESC LIMIT ?',
      [limit]
    );
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single run detail
router.get('/:id', async (req, res) => {
  try {
    const run = await dbGet('SELECT * FROM run_history WHERE id = ?', [req.params.id]);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    res.json({ run });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

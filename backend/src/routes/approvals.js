const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database/db');

// GET all pending approvals
router.get('/', async (req, res) => {
  try {
    const approvals = await dbAll(
      `SELECT * FROM pending_approvals ORDER BY created_at DESC LIMIT 50`
    );
    res.json({ approvals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET pending only
router.get('/pending', async (req, res) => {
  try {
    const approvals = await dbAll(
      `SELECT * FROM pending_approvals WHERE status = 'pending' ORDER BY created_at DESC`
    );
    res.json({ approvals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST approve or reject
router.post('/:id/decide', async (req, res) => {
  try {
    const { decision, feedback = '' } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be "approved" or "rejected"' });
    }

    const approval = await dbGet('SELECT * FROM pending_approvals WHERE id = ?', [req.params.id]);
    if (!approval) return res.status(404).json({ error: 'Approval not found' });
    if (approval.status !== 'pending') return res.status(400).json({ error: 'Already resolved' });

    await dbRun(
      `UPDATE pending_approvals SET status = ?, decision = ?, feedback = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [decision, decision, feedback, req.params.id]
    );

    res.json({ success: true, message: `Workflow ${decision}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

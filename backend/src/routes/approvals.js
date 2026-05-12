const express = require('express');
const router = express.Router();
const { dbAll, dbRun } = require('../database/db');

// GET /api/approvals/pending
// Fetch all pending approvals
router.get('/pending', async (req, res) => {
  try {
    const approvals = await dbAll("SELECT * FROM pending_approvals WHERE status = 'pending' ORDER BY created_at DESC");
    res.json({ approvals });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/approvals/:id/decide
// Submit a decision (approved or rejected) for a specific approval record
router.post('/:id/decide', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, feedback } = req.body;
    
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision. Must be "approved" or "rejected"' });
    }
    
    await dbRun(
      `UPDATE pending_approvals 
       SET status = ?, decision = ?, feedback = ?, resolved_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [decision, decision, feedback || '', id]
    );
    
    res.json({ success: true, message: `Approval ${decision}` });
  } catch (error) {
    console.error('Error deciding approval:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

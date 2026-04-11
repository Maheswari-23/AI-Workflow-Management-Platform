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

// GET analytics aggregation for dashboard
router.get('/analytics', async (req, res) => {
  try {
    // Top-level aggregates
    const aggregated = await dbGet(`
      SELECT 
        SUM(prompt_tokens) as total_prompt_tokens,
        SUM(completion_tokens) as total_completion_tokens,
        SUM(total_cost) as total_cost,
        COUNT(id) as total_runs
      FROM run_history
    `);

    // Grouped by model
    const byModel = await dbAll(`
      SELECT 
        model_used, 
        SUM(prompt_tokens + completion_tokens) as total_tokens, 
        SUM(total_cost) as cost
      FROM run_history 
      WHERE model_used IS NOT NULL AND model_used != ''
      GROUP BY model_used 
      ORDER BY cost DESC
    `);

    // Daily timeseries (last 14 days)
    const timeseries = await dbAll(`
      SELECT 
        date(started_at) as date,
        SUM(total_cost) as daily_cost,
        SUM(prompt_tokens + completion_tokens) as daily_tokens
      FROM run_history
      WHERE started_at >= date('now', '-14 days')
      GROUP BY date(started_at)
      ORDER BY date ASC
    `);

    res.json({
      totals: {
        promptTokens: aggregated?.total_prompt_tokens || 0,
        completionTokens: aggregated?.total_completion_tokens || 0,
        cost: aggregated?.total_cost || 0.0,
        runs: aggregated?.total_runs || 0
      },
      byModel,
      timeseries
    });
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

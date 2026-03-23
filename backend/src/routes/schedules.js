const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database/db');
const cronManager = require('../scheduler/cronManager');
const workflowRunner = require('../engine/workflowRunner');

// GET all schedules
router.get('/', async (req, res) => {
  try {
    const schedules = await dbAll(`
      SELECT s.*, t.name as task_name FROM schedules s
      LEFT JOIN tasks t ON s.task_id = t.id
      ORDER BY s.created_at DESC
    `);
    res.json({ schedules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single schedule
router.get('/:id', async (req, res) => {
  try {
    const schedule = await dbGet('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create schedule
router.post('/', async (req, res) => {
  try {
    const { name, task_id, trigger_type = 'cron', cron_expression = '0 0 * * *', status = 'active' } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await dbRun(
      'INSERT INTO schedules (name, task_id, trigger_type, cron_expression, status) VALUES (?, ?, ?, ?, ?)',
      [name, task_id || null, trigger_type, cron_expression, status]
    );
    const schedule = await dbGet('SELECT * FROM schedules WHERE id = ?', [result.lastID]);
    // Register with cron manager if active
    if (status === 'active' && trigger_type === 'cron') {
      cronManager.addJob(schedule);
    }
    res.status(201).json({ schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update schedule
router.put('/:id', async (req, res) => {
  try {
    const { name, task_id, trigger_type, cron_expression, status } = req.body;
    await dbRun(
      `UPDATE schedules SET name = COALESCE(?, name), task_id = COALESCE(?, task_id),
       trigger_type = COALESCE(?, trigger_type), cron_expression = COALESCE(?, cron_expression),
       status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, task_id, trigger_type, cron_expression, status, req.params.id]
    );
    const schedule = await dbGet('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    // Re-sync cron job
    cronManager.removeJob(req.params.id);
    if (schedule.status === 'active' && schedule.trigger_type === 'cron') {
      cronManager.addJob(schedule);
    }
    res.json({ schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE schedule
router.delete('/:id', async (req, res) => {
  try {
    cronManager.removeJob(req.params.id);
    const result = await dbRun('DELETE FROM schedules WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST trigger schedule manually
router.post('/:id/trigger', async (req, res) => {
  try {
    const schedule = await dbGet('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

    if (!schedule.task_id) {
      return res.status(400).json({ error: 'Schedule has no task assigned' });
    }

    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [schedule.task_id]);
    if (!task) return res.status(404).json({ error: 'Associated task not found' });

    const runResult = await workflowRunner.run(task, 'scheduled', schedule.id);
    await dbRun('UPDATE schedules SET last_run = CURRENT_TIMESTAMP WHERE id = ?', [schedule.id]);
    res.json({ run: runResult, message: `Schedule "${schedule.name}" triggered successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

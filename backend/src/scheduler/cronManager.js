const cron = require('node-cron');
const { dbAll, dbRun, dbGet } = require('../database/db');
const workflowRunner = require('../engine/workflowRunner');

const jobs = new Map(); // scheduleId -> cron.ScheduledTask

/**
 * Load all active cron schedules from DB and register them.
 */
async function initialize() {
  try {
    const schedules = await dbAll(
      "SELECT * FROM schedules WHERE status = 'active' AND trigger_type = 'cron'"
    );
    console.log(`[CronManager] Loading ${schedules.length} active schedules...`);
    for (const schedule of schedules) {
      addJob(schedule);
    }
  } catch (err) {
    console.error('[CronManager] Initialization error:', err.message);
  }
}

/**
 * Add a cron job for a schedule.
 */
function addJob(schedule) {
  if (!schedule.cron_expression) return;

  // Validate cron expression
  if (!cron.validate(schedule.cron_expression)) {
    console.warn(`[CronManager] Invalid cron expression for schedule "${schedule.name}": ${schedule.cron_expression}`);
    return;
  }

  // Remove existing job if any
  removeJob(schedule.id);

  const task = cron.schedule(schedule.cron_expression, async () => {
    console.log(`[CronManager] Triggering schedule "${schedule.name}" (id: ${schedule.id})`);
    try {
      const dbTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [schedule.task_id]);
      if (!dbTask) {
        console.warn(`[CronManager] Task ${schedule.task_id} not found for schedule ${schedule.id}`);
        return;
      }
      await workflowRunner.run(dbTask, 'scheduled', schedule.id);
      await dbRun('UPDATE schedules SET last_run = CURRENT_TIMESTAMP WHERE id = ?', [schedule.id]);
      console.log(`[CronManager] Schedule "${schedule.name}" completed.`);
    } catch (err) {
      console.error(`[CronManager] Schedule "${schedule.name}" failed:`, err.message);
    }
  });

  jobs.set(String(schedule.id), task);
  console.log(`[CronManager] Registered schedule "${schedule.name}" (${schedule.cron_expression})`);
}

/**
 * Remove a cron job by schedule ID.
 */
function removeJob(scheduleId) {
  const key = String(scheduleId);
  if (jobs.has(key)) {
    jobs.get(key).stop();
    jobs.delete(key);
    console.log(`[CronManager] Removed schedule ${scheduleId}`);
  }
}

/**
 * Get count of active jobs.
 */
function getActiveJobCount() {
  return jobs.size;
}

module.exports = { initialize, addJob, removeJob, getActiveJobCount };

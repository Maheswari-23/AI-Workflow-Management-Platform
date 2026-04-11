/**
 * Docker Tasks API
 * Endpoints for managing containerized task execution
 */

const express = require('express');
const router = express.Router();
const containerManager = require('../services/containerManager');
const db = require('../database/db');

// Check Docker availability
router.get('/docker/status', async (req, res) => {
  try {
    const available = await containerManager.checkDockerAvailable();
    const runningTasks = containerManager.getRunningTasks();
    
    res.json({
      dockerAvailable: available,
      runningTasks: runningTasks.length,
      tasks: runningTasks,
      maxConcurrent: containerManager.maxConcurrent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Build task runner image
router.post('/docker/build', async (req, res) => {
  try {
    await containerManager.buildTaskRunnerImage();
    res.json({ 
      success: true, 
      message: 'Task runner image built successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute task in container
router.post('/docker/execute/:taskId', async (req, res) => {
  const { taskId } = req.params;
  
  try {
    // Get task details from database
    db.get('SELECT * FROM tasks WHERE id = ?', [taskId], async (err, task) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Get agent details
      db.get('SELECT * FROM agents WHERE id = ?', [task.agent_id], async (err, agent) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        try {
          // Update task status
          db.run('UPDATE tasks SET status = ? WHERE id = ?', ['running', taskId]);

          // Execute in container
          const result = await containerManager.executeTask({
            taskId: task.id,
            description: task.description,
            agentId: task.agent_id,
            llmProvider: agent?.llm_provider || 'groq',
            maxSteps: 10,
            timeout: 300000 // 5 minutes
          });

          // Update task with result
          db.run(
            'UPDATE tasks SET status = ?, result = ?, completed_at = ? WHERE id = ?',
            ['completed', JSON.stringify(result.result), new Date().toISOString(), taskId]
          );

          res.json({
            success: true,
            taskId: taskId,
            result: result.result,
            executionTime: result.result.duration
          });
        } catch (error) {
          // Update task with error
          db.run(
            'UPDATE tasks SET status = ?, result = ? WHERE id = ?',
            ['failed', JSON.stringify({ error: error.message }), taskId]
          );

          res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop running task
router.post('/docker/stop/:taskId', async (req, res) => {
  const { taskId } = req.params;
  
  try {
    const result = await containerManager.stopTask(taskId);
    
    // Update task status
    db.run('UPDATE tasks SET status = ? WHERE id = ?', ['cancelled', taskId]);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get running tasks
router.get('/docker/running', (req, res) => {
  const tasks = containerManager.getRunningTasks();
  res.json({ tasks });
});

module.exports = router;

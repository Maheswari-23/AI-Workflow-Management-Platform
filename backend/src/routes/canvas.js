const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database/db');

// GET canvas for a task
router.get('/:taskId', async (req, res) => {
  try {
    const nodes = await dbAll('SELECT * FROM workflow_nodes WHERE task_id = ?', [req.params.taskId]);
    const edges = await dbAll('SELECT * FROM workflow_edges WHERE task_id = ?', [req.params.taskId]);
    res.json({ nodes, edges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST save canvas (replaces all nodes+edges for a task)
router.post('/:taskId', async (req, res) => {
  try {
    const { nodes = [], edges = [] } = req.body;
    const taskId = req.params.taskId;

    // Clear existing
    await dbRun('DELETE FROM workflow_nodes WHERE task_id = ?', [taskId]);
    await dbRun('DELETE FROM workflow_edges WHERE task_id = ?', [taskId]);

    // Insert nodes
    for (const node of nodes) {
      await dbRun(
        `INSERT INTO workflow_nodes (task_id, node_id, type, label, agent_id, config, position_x, position_y)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [taskId, node.id, node.type || 'agent', node.label || '', node.agentId || null,
         JSON.stringify(node.config || {}), node.position?.x || 0, node.position?.y || 0]
      );
    }

    // Insert edges
    for (const edge of edges) {
      await dbRun(
        `INSERT INTO workflow_edges (task_id, source_node_id, target_node_id) VALUES (?, ?, ?)`,
        [taskId, edge.source, edge.target]
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

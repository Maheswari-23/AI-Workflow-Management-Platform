// Manual database seeding endpoint
// Visit /api/seed to populate initial data

const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.post('/', async (req, res) => {
  try {
    console.log('🌱 Starting database seed...');
    
    const tools = [
      { name: 'read_file', type: 'file', description: 'Read contents of a file', endpoint: 'read_file', method: 'EXEC' },
      { name: 'write_file', type: 'file', description: 'Write content to a file', endpoint: 'write_file', method: 'EXEC' },
      { name: 'list_directory', type: 'file', description: 'List files in a directory', endpoint: 'list_directory', method: 'EXEC' },
      { name: 'web_search', type: 'api', description: 'Search the web', endpoint: 'web_search', method: 'GET' },
      { name: 'fetch_webpage', type: 'api', description: 'Fetch webpage content', endpoint: 'fetch_webpage', method: 'GET' },
      { name: 'get_weather', type: 'api', description: 'Get weather information', endpoint: 'https://wttr.in', method: 'GET' },
      { name: 'calculator', type: 'system', description: 'Evaluate math expressions', endpoint: 'calculator', method: 'EXEC' },
      { name: 'get_current_time', type: 'system', description: 'Get current date/time', endpoint: 'get_current_time', method: 'EXEC' },
    ];

    const promises = tools.map(tool => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO tools (name, description, type, method, endpoint, headers, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [tool.name, tool.description, tool.type, tool.method, tool.endpoint, '{}', 'active'],
          function(err) {
            if (err) {
              console.error(`Error seeding ${tool.name}:`, err);
              reject(err);
            } else {
              console.log(`✓ Seeded ${tool.name}`);
              resolve(this.changes);
            }
          }
        );
      });
    });

    await Promise.all(promises);
    
    res.json({ 
      success: true, 
      message: `Seeded ${tools.length} tools successfully`,
      tools: tools.length
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.get('/', (req, res) => {
  res.json({ 
    message: 'Use POST method to seed database',
    endpoint: '/api/seed',
    method: 'POST'
  });
});

module.exports = router;

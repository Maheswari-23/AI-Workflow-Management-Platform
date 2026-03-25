const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./src/config');

const DB_PATH = path.resolve(__dirname, '../data/workflow.db');
const db = new sqlite3.Database(DB_PATH);

const realTools = [
  // ✅ System Utilities — fully implemented in toolsAdapter.js
  {
    name: 'get_current_time',
    type: 'system',
    description: 'Returns the current system date and time in ISO format. Useful for timestamps and scheduling.',
    endpoint: 'get_current_time',
    method: 'EXEC'
  },
  {
    name: 'generate_uuid',
    type: 'system',
    description: 'Generates a random unique identifier (UUID v4). Useful for creating unique record IDs.',
    endpoint: 'generate_uuid',
    method: 'EXEC'
  },
  {
    name: 'log',
    type: 'system',
    description: 'Logs a message string to the workflow execution output. Useful for debugging and tracking.',
    endpoint: 'log',
    method: 'EXEC'
  },

  // ✅ Calculator — math expressions evaluated in Node.js
  {
    name: 'Calculator',
    type: 'script',
    description: 'Evaluates a mathematical expression and returns the result. Example: "2 * (5 + 3)". Useful for budget calculations and data analysis.',
    endpoint: 'calculator',
    method: 'EXEC'
  },
];


db.serialize(() => {
  // Clear existing tools
  db.run('DELETE FROM tools', (err) => {
    if (err) console.error('Error clearing tools:', err.message);
    else console.log('✓ Cleaned existing dummy tools registry.');
  });

  // Reset sqlite sequence for auto-increment IDs
  db.run('DELETE FROM sqlite_sequence WHERE name="tools"', (err) => {
    if (err) console.error('Error resetting tool IDs:', err.message);
  });

  // Seed with real list
  const stmt = db.prepare('INSERT INTO tools (name, description, type, method, endpoint, headers, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  
  realTools.forEach(tool => {
    stmt.run([tool.name, tool.description, tool.type, tool.method, tool.endpoint, '{}', 'active'], (err) => {
      if (err) console.error('Error seeding tool:', tool.name, err.message);
      else console.log('✓ Provisioned:', tool.name);
    });
  });

  stmt.finalize();
});

setTimeout(() => db.close(), 3000);

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./src/config');

const DB_PATH = path.resolve(__dirname, '../data/workflow.db');
const db = new sqlite3.Database(DB_PATH);

const realTools = [
  // File System Tools
  { name: 'read_file', type: 'fs', description: 'Reads content from a specified file path. (Sandbox folder only)', endpoint: 'read_file', method: 'EXEC' },
  { name: 'write_file', type: 'fs', description: 'Writes content to a specified file path. (Sandbox folder only)', endpoint: 'write_file', method: 'EXEC' },
  { name: 'list_directory', type: 'fs', description: 'Lists all files in a specified directory. (Sandbox folder only)', endpoint: 'list_directory', method: 'EXEC' },
  { name: 'delete_file', type: 'fs', description: 'Deletes a specified file. (Sandbox folder only)', endpoint: 'delete_file', method: 'EXEC' },

  // Browser / Web Tool
  { name: 'search_web', type: 'browser', description: 'Searches the web for a given query and returns results.', endpoint: 'search_web', method: 'EXEC' },
  { name: 'open_url', type: 'browser', description: 'Opens a web URL and retrieves basic content.', endpoint: 'open_url', method: 'EXEC' },
  { name: 'extract_content', type: 'browser', description: 'Extracts relevant content from raw HTML.', endpoint: 'extract_content', method: 'EXEC' },

  // API Calling Tool
  { name: 'call_api', type: 'api', description: 'Makes an HTTP request to an external API (GET, POST, etc).', endpoint: 'call_api', method: 'EXEC' },

  // Code Execution Tool
  { name: 'execute_python', type: 'code', description: 'Executes Python code in a sandboxed environment.', endpoint: 'execute_python', method: 'EXEC' },
  { name: 'execute_js', type: 'code', description: 'Executes JavaScript code in a sandboxed environment.', endpoint: 'execute_js', method: 'EXEC' },

  // Database Tool
  { name: 'query_db', type: 'database', description: 'Executes a READ query on the database.', endpoint: 'query_db', method: 'EXEC' },
  { name: 'insert_data', type: 'database', description: 'Inserts new structured data into a database.', endpoint: 'insert_data', method: 'EXEC' },
  { name: 'update_data', type: 'database', description: 'Updates existing records in a database.', endpoint: 'update_data', method: 'EXEC' },

  // Memory / Vector Search Tool
  { name: 'store_memory', type: 'memory', description: 'Stores text to the long-term memory vector database.', endpoint: 'store_memory', method: 'EXEC' },
  { name: 'search_memory', type: 'memory', description: 'Retrieves relevant context from the long-term memory vector database based on a query.', endpoint: 'search_memory', method: 'EXEC' },

  // Document Processing Tools
  { name: 'read_pdf', type: 'document', description: 'Reads content from a PDF file.', endpoint: 'read_pdf', method: 'EXEC' },
  { name: 'extract_text', type: 'document', description: 'Extracts plain text from various document formats.', endpoint: 'extract_text', method: 'EXEC' },
  { name: 'summarize_document', type: 'document', description: 'Analyzes and summarizes the contents of a full document.', endpoint: 'summarize_document', method: 'EXEC' },

  // System / Utility Tools
  { name: 'get_current_time', type: 'system', description: 'Returns the current system date and time.', endpoint: 'get_current_time', method: 'EXEC' },
  { name: 'generate_uuid', type: 'system', description: 'Generates a random unique identifier (UUID).', endpoint: 'generate_uuid', method: 'EXEC' },
  { name: 'sleep', type: 'system', description: 'Pauses execution for a specified number of seconds.', endpoint: 'sleep', method: 'EXEC' },
  { name: 'log', type: 'system', description: 'Logs a standard message for workflow tracking.', endpoint: 'log', method: 'EXEC' },

  // Agent-to-Agent Tool
  { name: 'call_agent', type: 'agent', description: 'Calls another specialized AI agent to perform a distinct sub-task.', endpoint: 'call_agent', method: 'EXEC' },

  // Calculator
  { name: 'Calculator', type: 'script', description: 'High-precision mathematical utility for budget calculations and data analysis.', endpoint: 'node -e "console.log(eval(process.argv[1]))"', method: 'EXEC' }
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

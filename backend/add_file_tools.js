const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const fileTools = [
  {
    name: 'read_file',
    description: 'Reads the content of a file given its path.',
    type: 'script',
    endpoint: 'read_file',
    status: 'active'
  },
  {
    name: 'write_file',
    description: 'Writes content to a file given its path.',
    type: 'script',
    endpoint: 'write_file',
    status: 'active'
  },
  {
    name: 'list_directory',
    description: 'Lists files and folders inside a given directory path.',
    type: 'script',
    endpoint: 'list_directory',
    status: 'active'
  }
];

db.serialize(() => {
  const stmt = db.prepare(`
    INSERT INTO tools (name, description, type, endpoint, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  fileTools.forEach(tool => {
    stmt.run(tool.name, tool.description, tool.type, tool.endpoint, tool.status, (err) => {
      if (err) {
        console.error('Error inserting tool ' + tool.name + ':', err.message);
      } else {
        console.log('Inserted tool:', tool.name);
      }
    });
  });

  stmt.finalize();
});

db.close(() => {
  console.log('Done.');
});

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const config = require('../config');

const DB_PATH = config.DB_PATH;
const dbDir = path.dirname(path.resolve(DB_PATH));

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(path.resolve(DB_PATH), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at', path.resolve(DB_PATH));
    initializeSchema();
  }
});

function initializeSchema() {
  db.serialize(() => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Agents table
    db.run(`
      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'offline',
        system_prompt TEXT DEFAULT '',
        skill_file_name TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tools table
    db.run(`
      CREATE TABLE IF NOT EXISTS tools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'api',
        description TEXT DEFAULT '',
        endpoint TEXT DEFAULT '',
        headers TEXT DEFAULT '{}',
        method TEXT DEFAULT 'GET',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tasks table
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        agents TEXT DEFAULT '[]',
        workflow_steps TEXT DEFAULT '',
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Schedules table
    db.run(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        task_id INTEGER,
        trigger_type TEXT DEFAULT 'cron',
        cron_expression TEXT DEFAULT '0 0 * * *',
        status TEXT DEFAULT 'active',
        last_run DATETIME,
        next_run DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
      )
    `);

    // Run History table
    db.run(`
      CREATE TABLE IF NOT EXISTS run_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        task_name TEXT,
        schedule_id INTEGER,
        trigger_type TEXT DEFAULT 'manual',
        status TEXT DEFAULT 'running',
        output TEXT DEFAULT '',
        error TEXT DEFAULT '',
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        duration_ms INTEGER,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
      )
    `);

    // LLM Providers table
    db.run(`
      CREATE TABLE IF NOT EXISTS llm_providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        api_key TEXT DEFAULT '',
        base_url TEXT DEFAULT '',
        model TEXT DEFAULT '',
        temperature REAL DEFAULT 0.7,
        max_tokens INTEGER DEFAULT 2048,
        configured INTEGER DEFAULT 0,
        is_default INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migrate: add is_default column if it doesn't exist (for existing DBs)
    db.run(`ALTER TABLE llm_providers ADD COLUMN is_default INTEGER DEFAULT 0`, () => {});

    // Seed default LLM providers if not exist
    db.run(`
      INSERT OR IGNORE INTO llm_providers (name, base_url, model) VALUES
        ('Groq', 'https://api.groq.com/openai/v1', 'llama-3.3-70b-versatile'),
        ('OpenAI', 'https://api.openai.com/v1', 'gpt-4o'),
        ('Anthropic', 'https://api.anthropic.com/v1', 'claude-3-5-sonnet-20241022'),
        ('Gemini', 'https://generativelanguage.googleapis.com/v1beta/openai/', 'gemini-1.5-pro')
    `);

    // Set Groq as default if no default is set
    db.run(`UPDATE llm_providers SET is_default = 1 WHERE name = 'Groq' AND NOT EXISTS (SELECT 1 FROM llm_providers WHERE is_default = 1)`);

    // Agent Long-Term Memory table
    db.run(`
      CREATE TABLE IF NOT EXISTS agent_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(agent_id, key),
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      )
    `);

    // Workflow nodes table (Visual Canvas)
    db.run(`
      CREATE TABLE IF NOT EXISTS workflow_nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        node_id TEXT NOT NULL,
        type TEXT DEFAULT 'agent',
        label TEXT DEFAULT '',
        agent_id INTEGER,
        config TEXT DEFAULT '{}',
        position_x REAL DEFAULT 0,
        position_y REAL DEFAULT 0,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    // Workflow edges table (Visual Canvas connections)
    db.run(`
      CREATE TABLE IF NOT EXISTS workflow_edges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        source_node_id TEXT NOT NULL,
        target_node_id TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    // Pending approvals table (Human-in-the-Loop)
    db.run(`
      CREATE TABLE IF NOT EXISTS pending_approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER NOT NULL,
        task_id INTEGER,
        task_name TEXT,
        step_index INTEGER DEFAULT 0,
        step_description TEXT DEFAULT '',
        agent_output TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        decision TEXT DEFAULT '',
        feedback TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (run_id) REFERENCES run_history(id) ON DELETE CASCADE
      )
    `);

    console.log('Database schema initialized.');
  });
}

// Promisified helpers
const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

module.exports = { db, dbRun, dbGet, dbAll };

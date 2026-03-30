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

    // Seed built-in tools
    const builtinTools = [
      // Utility
      ['get_current_time',   'system',  'Get current date, time, timezone and unix timestamp.',                          '', 'GET'],
      ['generate_uuid',      'system',  'Generate a random UUID v4.',                                                    '', 'GET'],
      ['calculator',         'system',  'Evaluate a math expression e.g. "2 * (5 + 3)".',                               '', 'GET'],
      ['log',                'system',  'Log a message to workflow output.',                                             '', 'GET'],
      ['random_number',      'system',  'Generate a random integer between min and max.',                                '', 'GET'],
      ['format_date',        'system',  'Format a date or get current date in multiple formats.',                        '', 'GET'],
      ['count_words',        'system',  'Count words, characters and sentences in text.',                                '', 'GET'],
      ['base64_encode',      'system',  'Encode text to base64.',                                                        '', 'GET'],
      ['base64_decode',      'system',  'Decode a base64 string to text.',                                               '', 'GET'],
      ['string_replace',     'system',  'Replace all occurrences of a substring in text.',                               '', 'GET'],
      ['string_upper',       'system',  'Convert text to uppercase.',                                                    '', 'GET'],
      ['string_lower',       'system',  'Convert text to lowercase.',                                                    '', 'GET'],
      ['parse_json',         'system',  'Parse a JSON string and optionally extract a field.',                           '', 'GET'],
      // File system
      ['read_file',          'fs',      'Read the contents of a file from the server.',                                  '', 'GET'],
      ['write_file',         'fs',      'Write content to a file on the server.',                                        '', 'GET'],
      ['list_directory',     'fs',      'List files in a directory on the server.',                                      '', 'GET'],
      ['run_shell_command',  'fs',      'Execute a shell command on the server and return stdout.',                      '', 'EXEC'],
      // Web & Browser
      ['web_search',         'browser', 'Search the web using DuckDuckGo and return top results.',                      '', 'GET'],
      ['fetch_webpage',      'browser', 'Fetch and extract text content from any URL.',                                  '', 'GET'],
      ['scrape_links',       'browser', 'Extract all hyperlinks from a webpage.',                                        '', 'GET'],
      ['http_request',       'api',     'Make a custom HTTP request to any API endpoint.',                               '', 'GET'],
      // Data & Finance
      ['get_weather',        'api',     'Get current weather for a city.',                                               'https://wttr.in', 'GET'],
      ['get_ip_info',        'api',     'Get geolocation and ISP info for an IP address.',                               'https://ipapi.co', 'GET'],
      ['fetch_stock_price',  'api',     'Fetch real-time or historical stock price data.',                               '', 'GET'],
      ['get_crypto_price',   'api',     'Get current cryptocurrency price from CoinGecko.',                              'https://api.coingecko.com', 'GET'],
      ['get_exchange_rate',  'api',     'Get live currency exchange rates and convert amounts.',                         'https://open.er-api.com', 'GET'],
      ['get_news',           'api',     'Fetch latest news headlines for a topic.',                                      '', 'GET'],
      ['get_public_holidays','api',     'Get public holidays for a country and year.',                                   'https://date.nager.at', 'GET'],
      // AI powered
      ['summarize_text',     'ai',      'Summarize a long piece of text using the configured LLM.',                     '', 'GET'],
      ['extract_keywords',   'ai',      'Extract the most important keywords from text using LLM.',                     '', 'GET'],
      ['translate_text',     'ai',      'Translate text to another language using the configured LLM.',                 '', 'GET'],
      ['ask_llm',            'ai',      'Ask the configured LLM a question and get a response.',                        '', 'GET'],
    ];

    for (const [name, type, description, endpoint, method] of builtinTools) {
      db.run(
        `INSERT OR IGNORE INTO tools (name, type, description, endpoint, method, status) VALUES (?, ?, ?, ?, ?, 'active')`,
        [name, type, description, endpoint, method]
      );
    }

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

    // Task versions table (Workflow Versioning)
    db.run(`
      CREATE TABLE IF NOT EXISTS task_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        version_number INTEGER NOT NULL,
        snapshot TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    // Task dependencies table
    db.run(`
      CREATE TABLE IF NOT EXISTS task_dependencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        depends_on_task_id INTEGER NOT NULL,
        condition TEXT DEFAULT 'on_success',
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    // Add retry columns to tasks if not exist
    db.run(`ALTER TABLE tasks ADD COLUMN max_retries INTEGER DEFAULT 2`, () => {});
    db.run(`ALTER TABLE tasks ADD COLUMN retry_delay_ms INTEGER DEFAULT 5000`, () => {});

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

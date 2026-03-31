// Database initialization script for production
// This runs automatically when the backend starts

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✓ Created data directory');
}

const DB_PATH = process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../data/workflow.db');
const db = new sqlite3.Database(DB_PATH);

console.log('🔧 Initializing database...');

// Check and seed tools
db.get('SELECT COUNT(*) as count FROM tools', (err, row) => {
  if (err) {
    console.error('Error checking tools:', err);
    return;
  }

  if (row.count === 0) {
    console.log('📦 Seeding initial tools...');
    seedTools();
  } else {
    console.log(`✓ Database already has ${row.count} tools`);
  }
});

// Check and seed LLM providers
db.get('SELECT COUNT(*) as count FROM llm_providers', (err, row) => {
  if (err) {
    console.error('Error checking LLM providers:', err);
    return;
  }

  if (row.count === 0) {
    console.log('📦 Seeding LLM providers...');
    seedLLMProviders();
  } else {
    console.log(`✓ Database already has ${row.count} LLM providers`);
  }
});

function seedLLMProviders() {
  const providers = [
    {
      name: 'OpenAI GPT-4',
      provider: 'openai',
      model: 'gpt-4',
      api_key: process.env.OPENAI_API_KEY || '',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      status: process.env.OPENAI_API_KEY ? 'active' : 'inactive'
    },
    {
      name: 'OpenAI GPT-3.5 Turbo',
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      api_key: process.env.OPENAI_API_KEY || '',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      status: process.env.OPENAI_API_KEY ? 'active' : 'inactive'
    },
    {
      name: 'Anthropic Claude 3 Opus',
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      api_key: process.env.ANTHROPIC_API_KEY || '',
      endpoint: 'https://api.anthropic.com/v1/messages',
      status: process.env.ANTHROPIC_API_KEY ? 'active' : 'inactive'
    },
    {
      name: 'Anthropic Claude 3 Sonnet',
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      api_key: process.env.ANTHROPIC_API_KEY || '',
      endpoint: 'https://api.anthropic.com/v1/messages',
      status: process.env.ANTHROPIC_API_KEY ? 'active' : 'inactive'
    },
    {
      name: 'Google Gemini Pro',
      provider: 'google',
      model: 'gemini-pro',
      api_key: process.env.GOOGLE_API_KEY || '',
      endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
      status: process.env.GOOGLE_API_KEY ? 'active' : 'inactive'
    },
    {
      name: 'Groq Llama 3 70B',
      provider: 'groq',
      model: 'llama3-70b-8192',
      api_key: process.env.GROQ_API_KEY || '',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      status: process.env.GROQ_API_KEY ? 'active' : 'inactive'
    },
    {
      name: 'Groq Mixtral 8x7B',
      provider: 'groq',
      model: 'mixtral-8x7b-32768',
      api_key: process.env.GROQ_API_KEY || '',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      status: process.env.GROQ_API_KEY ? 'active' : 'inactive'
    }
  ];

  const stmt = db.prepare('INSERT INTO llm_providers (name, provider, model, api_key, endpoint, status) VALUES (?, ?, ?, ?, ?, ?)');
  
  let count = 0;
  providers.forEach(llm => {
    stmt.run([llm.name, llm.provider, llm.model, llm.api_key, llm.endpoint, llm.status], (err) => {
      if (err) {
        console.error(`✗ Error seeding ${llm.name}:`, err.message);
      } else {
        count++;
        if (llm.status === 'active') {
          console.log(`✓ Configured ${llm.name} (API key found)`);
        }
        if (count === providers.length) {
          console.log(`✓ Seeded ${count} LLM providers`);
          stmt.finalize();
        }
      }
    });
  });
}

function seedTools() {
  const tools = [
    // File System Tools
    { name: 'read_file', type: 'file', description: 'Read contents of a file', endpoint: 'read_file', method: 'EXEC' },
    { name: 'write_file', type: 'file', description: 'Write content to a file', endpoint: 'write_file', method: 'EXEC' },
    { name: 'list_directory', type: 'file', description: 'List files in a directory', endpoint: 'list_directory', method: 'EXEC' },
    { name: 'delete_file', type: 'file', description: 'Delete a file', endpoint: 'delete_file', method: 'EXEC' },
    { name: 'create_directory', type: 'file', description: 'Create a new directory', endpoint: 'create_directory', method: 'EXEC' },
    
    // Web & API Tools
    { name: 'web_search', type: 'api', description: 'Search the web using a search engine', endpoint: 'web_search', method: 'GET' },
    { name: 'fetch_webpage', type: 'api', description: 'Fetch and extract content from a webpage', endpoint: 'fetch_webpage', method: 'GET' },
    { name: 'http_request', type: 'api', description: 'Make HTTP requests to any API', endpoint: 'http_request', method: 'EXEC' },
    { name: 'get_weather', type: 'api', description: 'Get weather information for a location', endpoint: 'https://wttr.in', method: 'GET' },
    { name: 'get_ip_info', type: 'api', description: 'Get geolocation data for an IP address', endpoint: 'https://ipapi.co', method: 'GET' },
    
    // Data Processing Tools
    { name: 'parse_json', type: 'data', description: 'Parse JSON string into object', endpoint: 'parse_json', method: 'EXEC' },
    { name: 'parse_csv', type: 'data', description: 'Parse CSV data into structured format', endpoint: 'parse_csv', method: 'EXEC' },
    { name: 'extract_keywords', type: 'nlp', description: 'Extract keywords from text', endpoint: 'extract_keywords', method: 'EXEC' },
    { name: 'summarize_text', type: 'nlp', description: 'Generate summary of long text', endpoint: 'summarize_text', method: 'EXEC' },
    { name: 'translate_text', type: 'nlp', description: 'Translate text between languages', endpoint: 'translate_text', method: 'EXEC' },
    
    // System Tools
    { name: 'get_current_time', type: 'system', description: 'Get current date and time', endpoint: 'get_current_time', method: 'EXEC' },
    { name: 'generate_uuid', type: 'system', description: 'Generate unique identifier', endpoint: 'generate_uuid', method: 'EXEC' },
    { name: 'log', type: 'system', description: 'Log message to console', endpoint: 'log', method: 'EXEC' },
    { name: 'calculator', type: 'system', description: 'Evaluate mathematical expressions', endpoint: 'calculator', method: 'EXEC' },
    { name: 'count_words', type: 'system', description: 'Count words in text', endpoint: 'count_words', method: 'EXEC' },
    
    // Finance Tools
    { name: 'fetch_stock_price', type: 'finance', description: 'Get current stock price', endpoint: 'fetch_stock_price', method: 'GET' },
    { name: 'get_crypto_price', type: 'finance', description: 'Get cryptocurrency price', endpoint: 'get_crypto_price', method: 'GET' },
    { name: 'get_exchange_rate', type: 'finance', description: 'Get currency exchange rate', endpoint: 'get_exchange_rate', method: 'GET' },
    
    // News & Content
    { name: 'get_news', type: 'api', description: 'Fetch latest news articles', endpoint: 'get_news', method: 'GET' },
    { name: 'scrape_website', type: 'api', description: 'Extract structured data from websites', endpoint: 'scrape_website', method: 'GET' },
    
    // AI Tools
    { name: 'ask_llm', type: 'ai', description: 'Ask question to language model', endpoint: 'ask_llm', method: 'POST' },
    { name: 'generate_image', type: 'ai', description: 'Generate image from text prompt', endpoint: 'generate_image', method: 'POST' },
  ];

  const stmt = db.prepare('INSERT INTO tools (name, description, type, method, endpoint, headers, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  
  let count = 0;
  tools.forEach(tool => {
    stmt.run([tool.name, tool.description, tool.type, tool.method, tool.endpoint, '{}', 'active'], (err) => {
      if (err) {
        console.error(`✗ Error seeding ${tool.name}:`, err.message);
      } else {
        count++;
        if (count === tools.length) {
          console.log(`✓ Seeded ${count} tools successfully`);
          stmt.finalize();
          setTimeout(() => db.close(), 1000);
        }
      }
    });
  });
}

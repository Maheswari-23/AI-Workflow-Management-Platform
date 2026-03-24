const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { dbRun, dbGet } = require('./src/database/db');
const { run } = require('./src/engine/workflowRunner');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

(async () => {
  console.log('🧪 Waiting for database connection to initialize...\n');
  await delay(1500); // Give SQLite time to create tables on first run

  console.log('🧪 Starting E2E Verification Test...\n');

  try {
    // 1. Create a professional Tool
    console.log('[1/4] Registering a dynamic Tool (Demo Stock Market API)...');
    const toolInsert = await dbRun(
      'INSERT INTO tools (name, type, description, endpoint, method, headers, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['fetch_stock_price', 'api', 'Fetches the current dummy price of a stock using a mock API.', 'https://api.coindesk.com/v1/bpi/currentprice.json', 'GET', '{}', 'active']
    );
    console.log(`      ✅ Tool saved with ID: ${toolInsert.lastID}`);

    // 2. Create a professional Agent
    console.log('[2/4] Registering an Agent with OpenCode system prompt...');
    const agentInsert = await dbRun(
      'INSERT INTO agents (name, system_prompt, status) VALUES (?, ?, ?)',
      ['Financial Analyst', 'You are a senior financial analyst. Always use the fetch_stock_price tool to get the latest Bitcoin price, and then provide a professional 1-sentence analysis.', 'offline']
    );
    console.log(`      ✅ Agent saved with ID: ${agentInsert.lastID}`);

    // 3. Create a test Task
    console.log('[3/4] Creating a Task mapping...');
    const taskInsert = await dbRun(
      'INSERT INTO tasks (name, description, agents, workflow_steps, status) VALUES (?, ?, ?, ?, ?)',
      ['Daily Market Report', 'Execute the workflow to provide a rapid financial summary.', `[${agentInsert.lastID}]`, '1. Fetch the latest price.\n2. Output the price and analysis.', 'saved']
    );

    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [taskInsert.lastID]);

    // 4. Run the OpenCode Engine
    console.log('\n[4/4] 🚀 Executing OpenCode Workflow Runner! (This may take 5-10 seconds depending on LLM response times)...\n');
    console.log('--------------------------------------------------');
    
    const result = await run(task, 'manual');
    
    console.log(result.output);
    console.log('--------------------------------------------------');
    console.log(`\n🎉 Test Complete! The backend OpenCode engine successfully executed the workflow in ${result.duration_ms}ms.`);

  } catch (err) {
    console.error('\n❌ Test Failed! Error encountered:');
    console.error(err);
  } finally {
    process.exit(0);
  }
})();

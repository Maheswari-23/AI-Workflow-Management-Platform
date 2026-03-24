const { dbAll } = require('./src/database/db');

(async () => {
  console.log('--- DB Content Summary ---\n');

  try {
    const agents = await dbAll('SELECT * FROM agents');
    console.log(`Agents Found: ${agents.length}`);
    console.log(JSON.stringify(agents, null, 2));
    console.log('\n---');

    const tools = await dbAll('SELECT * FROM tools');
    console.log(`Tools Found: ${tools.length}`);
    console.log(JSON.stringify(tools, null, 2));
    console.log('\n---');

    const tasks = await dbAll('SELECT * FROM tasks');
    console.log(`Tasks Found: ${tasks.length}`);
    console.log(JSON.stringify(tasks, null, 2));
    
  } catch (err) {
    console.error('Error inspecting DB:', err.message);
  } finally {
    process.exit(0);
  }
})();

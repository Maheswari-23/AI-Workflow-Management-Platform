/**
 * ============================================================
 *  E2E DEMO: "Automated Weather Intelligence" Scenario
 *  Showcases the full platform lifecycle:
 *    ① Ensure get_weather tool is registered and active
 *    ② Create the "Global Logistics Analyst" agent
 *    ③ Build the "Morning Operations Check" task
 *    ④ Run the OpenCode Workflow Engine
 *  Run with: node test_e2e.js
 * ============================================================
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { dbRun, dbGet, dbAll } = require('./src/database/db');
const { run } = require('./src/engine/workflowRunner');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ─── Cleanup helper ──────────────────────────────────────────────────────────
async function cleanup(agentId, taskId) {
  if (agentId) await dbRun('DELETE FROM agents WHERE id = ?', [agentId]).catch(() => {});
  if (taskId) await dbRun('DELETE FROM tasks WHERE id = ?', [taskId]).catch(() => {});
}

(async () => {
  console.log('\n╔═════════════════════════════════════════════════════╗');
  console.log('║   E2E Demo: Automated Weather Intelligence          ║');
  console.log('╚═════════════════════════════════════════════════════╝\n');

  console.log('⏳ Waiting for DB connection to initialize...');
  await delay(1500);
  console.log('✅ DB Ready.\n');

  let agentId = null;
  let taskId = null;

  try {
    // ─── PHASE 1: Ensure get_weather is in the tools registry ────────────────
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 PHASE 1: Tool Discovery — Ensuring get_weather is active');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let weatherTool = await dbGet("SELECT * FROM tools WHERE name = 'get_weather'");
    if (!weatherTool) {
      await dbRun(
        'INSERT INTO tools (name, type, description, endpoint, method, headers, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          'get_weather',
          'api',
          "Fetches real-time weather for any city. Returns temperature, humidity, wind speed, and description. Powered by wttr.in. Requires 'city' parameter.",
          'https://wttr.in',
          'GET',
          '{}',
          'active',
        ]
      );
      console.log('  ✅ get_weather tool seeded into registry.');
    } else if (weatherTool.status !== 'active') {
      await dbRun("UPDATE tools SET status = 'active' WHERE name = 'get_weather'");
      console.log('  ✅ get_weather tool re-activated.');
    } else {
      console.log('  ✅ get_weather tool is already registered and active.');
    }

    const allActiveTools = await dbAll("SELECT name FROM tools WHERE status = 'active'");
    console.log(`\n  📋 Active Tools in Registry (${allActiveTools.length}):`);
    allActiveTools.forEach((t) => console.log(`     • ${t.name}`));
    console.log();

    // ─── PHASE 2: Agent Creation ──────────────────────────────────────────────
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧠 PHASE 2: Agent Creation — Global Logistics Analyst');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const agentInsert = await dbRun(
      'INSERT INTO agents (name, system_prompt, status) VALUES (?, ?, ?)',
      [
        'Global Logistics Analyst',
        `You are a logistics expert. Your job is to:
1. Check the weather in a given city using the get_weather tool.
2. Use the calculator tool to determine a 'Travel Delay Score' = temperature_c / 10.
3. Use the log tool to record a final summary of the city, temperature, and delay score.
Always complete all three steps in sequence. Do not skip any step.`,
        'offline',
      ]
    );
    agentId = agentInsert.lastID;
    console.log(`  ✅ Agent "Global Logistics Analyst" created (ID: ${agentId})\n`);

    // ─── PHASE 3: Task Creation ───────────────────────────────────────────────
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗓️  PHASE 3: Task & Workflow — Morning Operations Check');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const taskInsert = await dbRun(
      'INSERT INTO tasks (name, description, agents, workflow_steps, status) VALUES (?, ?, ?, ?, ?)',
      [
        'Morning Operations Check',
        'Automated morning logistics briefing for London operations.',
        JSON.stringify([agentId]),
        `Step 1: Call get_weather with city="London" and retrieve the current temperature_c.
Step 2: Call calculator with expression="<temperature_c> / 10" to compute the Travel Delay Score.
Step 3: Call log with a message summarizing: city, temperature, and Travel Delay Score.`,
        'saved',
      ]
    );
    taskId = taskInsert.lastID;
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [taskId]);
    console.log(`  ✅ Task "Morning Operations Check" created (ID: ${taskId})`);
    console.log(`  ✅ Scheduled scenario: London weather → delay score → log summary\n`);

    // ─── PHASE 4: Run the OpenCode Workflow Engine ────────────────────────────
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 PHASE 4: Workflow Execution (Manual Trigger)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⏳ Running workflow... (may take 5–15 seconds)\n');

    const result = await run(task, 'manual');

    console.log('┌─────────────────── EXECUTION OUTPUT ───────────────────┐');
    console.log(result.output);
    console.log('└─────────────────────────────────────────────────────────┘');

    console.log(`\n🎉 DEMO COMPLETE!`);
    console.log(`   Status   : ${result.status}`);
    console.log(`   Duration  : ${result.duration_ms}ms`);
    console.log(`   Run ID    : ${result.id}`);
    console.log(`   Log saved in Run History — visible in the UI under /history\n`);

  } catch (err) {
    console.error('\n❌ E2E Test Failed!');
    console.error('   Error:', err.response?.data?.error?.message || err.message);
    console.error('\n   Full error:', err);
  } finally {
    // Clean up test data
    await cleanup(agentId, taskId);
    console.log('🧹 Test data cleaned up from DB.\n');
    process.exit(0);
  }
})();

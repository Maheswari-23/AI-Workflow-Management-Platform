const { dbRun } = require('./backend/src/database/db');

async function update() {
  try {
    console.log('Adding Gemini to llm_providers...');
    await dbRun("INSERT OR IGNORE INTO llm_providers (name, base_url, model) VALUES ('Gemini', 'https://generativelanguage.googleapis.com/v1beta/openai/', 'gemini-1.5-pro')");
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

update();

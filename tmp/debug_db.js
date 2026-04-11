const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const os = require('os');

const appData = process.env.APPDATA || os.homedir();
const DB_PATH = path.join(appData, 'AIWorkflowPlatform', 'data', 'workflow.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }
  
  db.all("SELECT started_at, prompt_tokens, completion_tokens FROM run_history", [], (err, rows) => {
    if (err) {
      console.error(err.message);
      process.exit(1);
    }
    console.log(JSON.stringify(rows, null, 2));
    db.close();
  });
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/Users/rjmaheswari/Downloads/AI Based Workflow Management Platform/backend/database.sqlite');

db.serialize(() => {
  console.log('\n--- Tools ---');
  db.all('SELECT id, name, type, endpoint FROM tools', (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
    onDone();
  });
});

let doneCount = 0;
function onDone() {
  doneCount++;
  if (doneCount === 1) db.close();
}

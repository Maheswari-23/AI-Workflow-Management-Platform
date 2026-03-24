const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Correct path based on backend/src/database/db.js
const DB_PATH = path.resolve(__dirname, 'data/workflow.db');
const db = new sqlite3.Database(DB_PATH);

const enterpriseTools = [
  {
    name: 'Slack_Notification_Service',
    description: 'Sends a standardized JSON notification to the corporate slack channel for workflow alerts.',
    type: 'api',
    method: 'POST',
    endpoint: 'https://hooks.slack.com/services/MOCK/B00/WORKSPACE_KEY',
    headers: '{"Content-Type": "application/json"}'
  },
  {
    name: 'Internal_ERP_Bridge',
    description: 'Queries the internal Enterprise Resource Planning system for vendor compliance status.',
    type: 'api',
    method: 'GET',
    endpoint: 'https://api.enterprise.com/v1/compliance/check',
    headers: '{"Authorization": "Bearer MOCK_TOKEN"}'
  },
  {
    name: 'Standard_Calculator',
    description: 'A local execution utility to perform precise mathematical calculations.',
    type: 'script',
    method: 'EXEC',
    endpoint: 'node -e "console.log(eval(process.argv[1]))"',
    headers: '{}'
  },
  {
    name: 'Global_Audit_Logger',
    description: 'Writes a security audit event to the permanent immutable ledger for legal tracking.',
    type: 'api',
    method: 'POST',
    endpoint: 'https://audit.enterprise.com/log',
    headers: '{"X-API-KEY": "SECRET_AUDIT_KEY"}'
  }
];

db.serialize(() => {
  enterpriseTools.forEach(tool => {
    db.run(
      'INSERT INTO tools (name, description, type, method, endpoint, headers, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tool.name, tool.description, tool.type, tool.method, tool.endpoint, tool.headers, 'active'],
      (err) => {
        if (err) console.error('Error seeding tool:', tool.name, err.message);
        else console.log('Successfully seeded:', tool.name);
      }
    );
  });
});

setTimeout(() => db.close(), 2000);

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Correct path based on backend/src/database/db.js
const DB_PATH = path.resolve(__dirname, 'data/workflow.db');
const db = new sqlite3.Database(DB_PATH);

const professionalTools = [
  {
    name: 'Slack_Corporate_Notify',
    description: 'Broadcasts workflow status and critical alerts to the #general enterprise Slack channel.',
    type: 'api', method: 'POST', endpoint: 'https://hooks.slack.com/services/WORK/SPACE/KEY',
    headers: '{"Content-Type": "application/json"}'
  },
  {
    name: 'GitHub_Code_Auditor',
    description: 'Scans a repository for security vulnerabilities and summarizes pull request activity.',
    type: 'api', method: 'GET', endpoint: 'https://api.github.com/repos/enterprise/core/audits',
    headers: '{"Accept": "application/vnd.github.v3+json"}'
  },
  {
    name: 'Jira_Service_Desk',
    description: 'Automatically creates technical support tickets based on AI-detected system anomalies.',
    type: 'api', method: 'POST', endpoint: 'https://jira.enterprise.com/rest/api/3/issue',
    headers: '{"Content-Type": "application/json"}'
  },
  {
    name: 'Salesforce_CRM_Sync',
    description: 'Synchronizes AI-generated lead scores and notes into the Salesforce customer database.',
    type: 'api', method: 'POST', endpoint: 'https://salesforce.api/v52.0/sobjects/Lead',
    headers: '{"Authorization": "OAuth 2.0 TOKEN"}'
  },
  {
    name: 'Email_Gateway_Pro',
    description: 'Enterprise SMTP bridge for sending stakeholder reports and executive summaries.',
    type: 'api', method: 'POST', endpoint: 'https://api.sendgrid.com/v3/mail/send',
    headers: '{"Authorization": "Bearer SG_KEY"}'
  },
  {
    name: 'Financial_Ledger_Query',
    description: 'Direct SQL bridge to query the internal financial ledger for quarterly budget adherence.',
    type: 'database', method: 'SELECT', endpoint: 'INTERNAL_FINANCE_CLUSTER',
    headers: '{"scope": "read_only"}'
  },
  {
    name: 'Python_Data_Cleanser',
    description: 'Local Python script execution for complex CSV sanitization and pandas transformations.',
    type: 'script', method: 'EXEC', endpoint: 'python3 scripts/cleanse.py',
    headers: '{}'
  },
  {
    name: 'Wikipedia_Knowledge_Base',
    description: 'Real-time retrieval of factual data and historical context for verified reporting.',
    type: 'api', method: 'GET', endpoint: 'https://en.wikipedia.org/w/api.php?action=query&format=json',
    headers: '{}'
  },
  {
    name: 'Calculator',
    description: 'High-precision mathematical utility for budget calculations and data analysis.',
    type: 'script', method: 'EXEC', endpoint: 'node -e "console.log(eval(process.argv[1]))"',
    headers: '{}'
  },
  {
    name: 'Zendesk_Ticket_Fetcher',
    description: 'Retrieves the most recent customer complaints to feed into the Sentiment Analysis agent.',
    type: 'api', method: 'GET', endpoint: 'https://zendesk.com/api/v2/tickets.json',
    headers: '{"Authorization": "Basic MOCK_AUTH"}'
  }
];

db.serialize(() => {
  // 1. Clear existing tools to remove "unwanted" ones
  db.run('DELETE FROM tools', (err) => {
    if (err) console.error('Error clearing tools:', err.message);
    else console.log('Cleaned existing tools registry.');
  });

  // 2. Seed with professional list
  const stmt = db.prepare('INSERT INTO tools (name, description, type, method, endpoint, headers, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  
  professionalTools.forEach(tool => {
    stmt.run([tool.name, tool.description, tool.type, tool.method, tool.endpoint, tool.headers, 'active'], (err) => {
      if (err) console.error('Error seeding tool:', tool.name, err.message);
      else console.log('✓ Provisioned:', tool.name);
    });
  });

  stmt.finalize();
});

setTimeout(() => db.close(), 3000);

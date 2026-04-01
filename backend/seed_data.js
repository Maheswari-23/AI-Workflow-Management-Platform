const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../data/workflow.db');
const db = new sqlite3.Database(DB_PATH);

// Seed sample data
db.serialize(() => {
  // Add sample agents
  db.run(`INSERT INTO agents (name, system_prompt) VALUES (?, ?)`,
    ['Event Planning Assistant', 'You are an expert event planner. Help estimate costs and plan outdoor events.']);
  
  db.run(`INSERT INTO agents (name, system_prompt) VALUES (?, ?)`,
    ['Financial Analyst', 'You are a financial analyst. Provide detailed cost breakdowns and budget recommendations.']);

  db.run(`INSERT INTO agents (name, system_prompt) VALUES (?, ?)`,
    ['Project Manager', 'You are a project manager. Coordinate tasks and ensure timely completion.']);

  // Add sample tasks
  db.run(`INSERT INTO tasks (name, description, agents, workflow_steps, status) VALUES (?, ?, ?, ?, ?)`,
    ['Outdoor Event Cost Estimation', 
     'Estimate the total cost for organizing an outdoor event including venue, catering, decorations, and logistics.',
     '[1]',
     '1. Gather event requirements (date, location, guest count)\n2. Research venue options and pricing\n3. Calculate catering costs\n4. Estimate decoration and setup costs\n5. Include contingency buffer\n6. Provide final cost estimate',
     'saved']);

  db.run(`INSERT INTO tasks (name, description, agents, workflow_steps, status) VALUES (?, ?, ?, ?, ?)`,
    ['Budget Planning for Corporate Event',
     'Create a comprehensive budget plan for a corporate event with multiple departments.',
     '[2]',
     '1. Define event scope and objectives\n2. Identify all cost categories\n3. Research market rates\n4. Create detailed budget breakdown\n5. Identify cost-saving opportunities\n6. Present budget summary',
     'saved']);

  db.run(`INSERT INTO tasks (name, description, agents, workflow_steps, status) VALUES (?, ?, ?, ?, ?)`,
    ['Wedding Planning Workflow',
     'Plan a complete wedding event with venue, catering, decorations, and guest management.',
     '[1,3]',
     '1. Determine wedding date and location\n2. Set overall budget\n3. Book venue\n4. Arrange catering\n5. Plan decorations\n6. Coordinate with vendors\n7. Finalize guest list',
     'saved']);

  console.log('✅ Sample data seeded successfully!');
  db.close();
});

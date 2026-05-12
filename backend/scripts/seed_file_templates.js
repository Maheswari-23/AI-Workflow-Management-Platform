const { db, dbRun, dbAll } = require('../src/database/db');

async function seedFileTemplates() {
  console.log('Seeding file-related agents and tasks (Downloads only)...');

  try {
    // 1. CREATE FILE-RELATED AGENTS
    const fileAgents = [
      {
        name: "Log Archiver",
        system_prompt: "You are a Log Archival Specialist. Your role is to identify log files in the Downloads folder and move them to an 'Archive' sub-directory. You MUST use 'list_directory' and 'run_shell_command' to perform these operations safely. Always respect the [ENVIRONMENT CONTEXT] for paths."
      },
      {
        name: "Download Organizer",
        system_prompt: "You are a Download Organization Agent. You specialize in cleaning up the Downloads folder by categorizing files into sub-folders (Images, Docs, Scripts). Use 'list_directory' and 'run_shell_command' (mv/move) to organize files. Always work within the Downloads folder identified in the [ENVIRONMENT CONTEXT]."
      },
      {
        name: "Security Auditor",
        system_prompt: "You are a File Security Auditor. Your task is to scan the Downloads folder for potentially sensitive files (e.g., .env, .key, .pem) and report their presence. Do NOT delete files unless explicitly asked. Use 'list_directory' to scan the Downloads folder provided in the [ENVIRONMENT CONTEXT]."
      }
    ];

    for (const agent of fileAgents) {
      await dbRun(
        'INSERT OR IGNORE INTO agents (name, system_prompt, status) VALUES (?, ?, ?)',
        [agent.name, agent.system_prompt, 'offline']
      );
      await dbRun(
        'UPDATE agents SET system_prompt = ? WHERE name = ?',
        [agent.system_prompt, agent.name]
      );
    }

    // MAP AGENTS TO IDS
    const agentsRow = await dbAll('SELECT id, name FROM agents');
    const agentMap = {};
    agentsRow.forEach(a => agentMap[a.name] = a.id);

    // 2. CREATE TASKS (TEMPLATES)
    const fileTasks = [
      {
        name: "Archive Old Downloads",
        description: "Find all .txt and .log files in the Downloads folder and move them to an 'Archive' folder.",
        agents: [agentMap["Log Archiver"]],
        workflow_steps: "1. List the contents of the Downloads folder using the Home Directory from context.\n2. Identify files ending in .txt or .log.\n3. Create an 'Archive' folder inside Downloads if it doesn't exist.\n4. Move the identified files into the Archive folder."
      },
      {
        name: "Scan Downloads for Secrets",
        description: "Scan the Downloads folder for sensitive configuration files.",
        agents: [agentMap["Security Auditor"]],
        workflow_steps: "1. Scan the Downloads folder for files like .env, id_rsa, or credentials.json.\n2. List any found sensitive files.\n3. Provide a summary of potential security risks found in the Downloads folder."
      },
      {
        name: "Generate Usage Report",
        description: "Create a summary of all files currently in the Downloads folder.",
        agents: [agentMap["File Manager"]],
        workflow_steps: "1. List all files in the Downloads folder.\n2. Count the total number of files and their types.\n3. Write a file named 'downloads_report.md' in the Downloads folder with this summary."
      }
    ];

    for (const task of fileTasks) {
      const validAgents = task.agents.filter(a => a);
      const agentsJson = JSON.stringify(validAgents.map(String));

      await dbRun(
        'INSERT INTO tasks (name, description, agents, workflow_steps, status) VALUES (?, ?, ?, ?, ?)',
        [task.name, task.description, agentsJson, task.workflow_steps, 'saved']
      );
    }

    console.log('✅ File template agents and tasks seeded successfully!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error seeding file templates:', err);
    process.exit(1);
  }
}

seedFileTemplates();

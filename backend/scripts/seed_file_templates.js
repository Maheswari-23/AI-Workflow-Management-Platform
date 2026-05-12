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
      },
      {
        name: "Data Cleaner",
        system_prompt: "You are a Data Cleaning Specialist. Your job is to identify and remove temporary, redundant, or unnecessary files (like .tmp, .bak, or old installers) in the Downloads folder. Use 'list_directory' to find files and 'run_shell_command' to remove or move them to a temporary trash folder. Always verify the file extension before taking action."
      },
      {
        name: "Media Manager",
        system_prompt: "You are a Media Organization Agent. You specialize in organizing images and videos. Use 'list_directory' to find media files and 'run_shell_command' to move them into date-based subfolders (e.g., Downloads/Photos/2023). Focus on common extensions like .jpg, .png, .mp4, and .mov."
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
      },
      {
        name: "Cleanup Temporary Files",
        description: "Find and remove .tmp, .bak, and old setup files in the Downloads folder.",
        agents: [agentMap["Data Cleaner"]],
        workflow_steps: "1. Scan the Downloads folder for files with .tmp, .bak, or .temp extensions.\n2. Identify old .exe or .msi setup files that haven't been accessed in 30 days.\n3. Create a summary of files to be deleted.\n4. [APPROVAL] Wait for user confirmation before deleting files.\n5. Remove the approved temporary files."
      },
      {
        name: "Organize Photos by Date",
        description: "Move images from Downloads into folders organized by year.",
        agents: [agentMap["Media Manager"]],
        workflow_steps: "1. List all files with image extensions (.jpg, .png, .jpeg) in the Downloads folder.\n2. Determine the creation year for each file (if possible from name or attributes).\n3. Create folders like 'Photos/2023', 'Photos/2024' inside Downloads.\n4. Move the images into their respective year folders."
      },
      {
        name: "Large File Finder",
        description: "Identify and report files larger than 100MB in the Downloads folder.",
        agents: [agentMap["File Manager"]],
        workflow_steps: "1. List all files in the Downloads folder including their sizes.\n2. Filter for files larger than 100MB.\n3. Sort them from largest to smallest.\n4. Create a markdown report 'large_files_report.md' listing these files and their locations."
      },
      {
        name: "Source Code Backup",
        description: "Identify project folders (containing .git or package.json) and suggest archival.",
        agents: [agentMap["Log Archiver"]],
        workflow_steps: "1. Scan the Downloads folder for directories.\n2. For each directory, check for the presence of '.git' or 'package.json'.\n3. List all identified project folders.\n4. Suggest creating a ZIP archive for each project and moving it to a 'Backups' folder."
      },
      {
        name: "Read/Write Text File",
        description: "Create a simple .txt file, write content to it, and then read it back.",
        agents: [agentMap["File Manager"]],
        workflow_steps: "1. Use write_file to create a new file named 'hello_world.txt' in the Downloads folder.\n2. Write the text 'Hello from the AI Workflow Platform!' into the file.\n3. Use read_file to read the content of 'hello_world.txt'.\n4. IMPORTANT: In your final output, explicitly print the exact content you read from the file so the user can see it.\n5. Use run_shell_command to delete the file after verifying it (e.g. 'del hello_world.txt' on Windows)."
      },
      {
        name: "AI News & Trends Report",
        description: "Fetch latest AI news and save it to a dated .txt file.",
        agents: [agentMap["News Analyst"]],
        workflow_steps: "1. Use get_news to search for the latest trends and news in Artificial Intelligence.\n2. Use get_current_time to get the current date.\n3. Format the findings into a clear, structured report.\n4. Use write_file to save the report to a file named 'latest_ai_news_[current_date].txt' in the Downloads folder."
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

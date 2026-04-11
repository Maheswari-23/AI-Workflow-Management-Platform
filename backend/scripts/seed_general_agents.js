const { db, dbRun, dbAll } = require('../src/database/db');

async function seedGeneralAgents() {
  console.log('Seeding general-purpose agents and tasks...');

  try {
    // 1. CREATE GENERAL AGENTS
    const generalAgents = [
      {
        name: "Web Researcher",
        system_prompt: "You are an expert Web Researcher. Your primary goal is to search the internet for accurate, up-to-date information. You MUST use tools like 'search_web', 'fetch_webpage', or 'get_news' to gather data. Always synthesize your findings into clear summaries and cite sources where possible."
      },
      {
        name: "File Manager",
        system_prompt: "You are a File Management Agent. You specialize in interacting with the file system. You MUST use tools like 'read_file', 'write_file', 'list_directory', or 'delete_file' to perform requested operations safely and accurately."
      },
      {
        name: "Data Processor",
        system_prompt: "You are a Data Processing Agent. You take raw data (text, JSON, etc.), clean it, filter it, and format it. You should use tools like 'parse_json', 'count_words', 'string_upper', or 'base64_encode/decode' to manipulate data efficiently."
      },
      {
        name: "Code Executor",
        system_prompt: "You are a Code Execution Agent. You write, execute, and analyze small scripts (Python, JS, Shell) to solve programming tasks, calculate complex math, or automate processes. You MUST use tools like 'execute_python', 'execute_js', or 'run_shell_command' to run code and return the output."
      }
    ];

    for (const agent of generalAgents) {
      await dbRun(
        'INSERT OR IGNORE INTO agents (name, system_prompt, status) VALUES (?, ?, ?)',
        [agent.name, agent.system_prompt, 'offline']
      );
      // Ensure the prompt is updated if it already existed
      await dbRun(
        'UPDATE agents SET system_prompt = ? WHERE name = ?',
        [agent.system_prompt, agent.name]
      );
    }

    // MAP AGENTS TO IDS
    const agentsRow = await dbAll('SELECT id, name FROM agents');
    const agentMap = {};
    agentsRow.forEach(a => agentMap[a.name] = a.id);

    // 2. CREATE GENERAL TASKS DEMONSTRATING CAPABILITIES
    const generalTasks = [
      {
        name: "Web Research: Tech Trends",
        description: "Search the web for the latest technology trends and summarize them.",
        agents: [agentMap["Web Researcher"]],
        workflow_steps: "1. Use the 'search_web' tool (if available) or 'web_search' to find information about 'Top AI breakthroughs in 2026'.\n2. Extract the top 3 breakthroughs.\n3. Output a concise summary of these breakthroughs."
      },
      {
        name: "File Operations: Write and Read",
        description: "Demonstrate writing data to a file and reading it back.",
        agents: [agentMap["File Manager"]],
        workflow_steps: "1. Use 'write_file' to create a file named 'hello_world.txt' with the content 'Hello from the File Manager Agent!'.\n2. Use 'read_file' to read the contents of 'hello_world.txt'.\n3. Output the contents exactly as read to verify success."
      },
      {
        name: "Data Processing: Parse JSON",
        description: "Parse a raw JSON string and extract specific information.",
        agents: [agentMap["Data Processor"]],
        workflow_steps: "1. Given this JSON string: '{\"company\": \"OpenAI\", \"products\": [\"ChatGPT\", \"DALL-E\"]}'\n2. Use 'parse_json' to parse the string.\n3. Extract the list of products.\n4. Output the products as a comma-separated list."
      },
      {
        name: "Code Execution: Calculate Math",
        description: "Write and execute a script to perform a calculation.",
        agents: [agentMap["Code Executor"]],
        workflow_steps: "1. Write a short Python or JavaScript code snippet to calculate the factorial of 10.\n2. Use 'execute_python' or 'execute_js' (or 'run_shell_command' with node/python) to run the code.\n3. Output the final calculated result."
      }
    ];

    for (const task of generalTasks) {
      const validAgents = task.agents.filter(a => a);
      const agentsJson = JSON.stringify(validAgents.map(String));

      await dbRun(
        'INSERT INTO tasks (name, description, agents, workflow_steps, status) VALUES (?, ?, ?, ?, ?)',
        [task.name, task.description, agentsJson, task.workflow_steps, 'saved']
      );
    }

    console.log('✅ General agents and tasks seeded successfully!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error seeding general agents:', err);
    process.exit(1);
  }
}

seedGeneralAgents();

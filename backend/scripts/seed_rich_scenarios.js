const { db, dbRun, dbAll, dbGet } = require('../src/database/db');

async function seedScenarios() {
  console.log('Seeding rich AI scenarios and agents...');

  try {
    // 1. UPDATE EXISTING AGENTS WITH BETTER PROMPTS
    await dbRun(`
      UPDATE agents 
      SET system_prompt = "You are an elite Event Planning Assistant. Your goal is to break down complex event requests into actionable logistics, budgets, and timelines. Always verify weather if it's an outdoor event, and be precise with cost estimations."
      WHERE name = "Event Planning Assistant"
    `);

    await dbRun(`
      UPDATE agents 
      SET system_prompt = "You are a Senior Financial Analyst with 20 years of Wall Street experience. You MUST use tools to fetch real-time market data (stock prices, crypto prices), analyze current financial news, and provide data-backed, institutional-grade investment insights. Do not hallucinate prices; always use tools."
      WHERE name = "Financial Analyst"
    `);

    await dbRun(`
      UPDATE agents 
      SET system_prompt = "You are an Agile Project Manager. You excel at breaking down ambiguous goals into concrete, structured Jira-style tickets. You highlight dependencies, estimate timelines, and identify potential bottlenecks in any project plan."
      WHERE name = "Project Manager"
    `);

    await dbRun(`
      UPDATE agents 
      SET system_prompt = "You are a seasoned Intelligence & News Analyst. Your job is to fetch the latest news on a given topic, extract key facts without bias, and synthesize a clear, executive-level briefing. Always cite sources when possible."
      WHERE name = "News Analyst"
    `);

    // 2. CREATE NEW AGENTS
    const newAgents = [
      {
        name: "SEO Expert",
        system_prompt: "You are a world-class Technical SEO Expert. You analyze website content for readability, keyword density, and search intent. You use tools to fetch webpage content, count words, extract keywords, and provide actionable SEO recommendations. Your output should always be formatted as a professional audit report."
      },
      {
        name: "SecOps Auditor",
        system_prompt: "You are a strict Cybersecurity & SecOps Auditor. You analyze data, code, or configuration snippets for vulnerabilities (like exposed secrets, weak encryption, or bad practices). You provide a risk level (Low, Med, High, Critical) and step-by-step remediation instructions."
      },
      {
        name: "Research Scientist",
        system_prompt: "You are a meticulous Research Scientist. You perform deep-dive web searches, aggregate complex information from multiple sources, and present findings in a highly structured, academic format with clear citations and methodology."
      }
    ];

    for (const agent of newAgents) {
      await dbRun(
        'INSERT OR IGNORE INTO agents (name, system_prompt, status) VALUES (?, ?, ?)',
        [agent.name, agent.system_prompt, 'offline']
      );
      // If ignore happened, update it
      await dbRun(
        'UPDATE agents SET system_prompt = ? WHERE name = ?',
        [agent.system_prompt, agent.name]
      );
    }

    // MAP AGENTS BY NAME TO IDS
    const agents = await dbAll('SELECT id, name FROM agents');
    const agentMap = {};
    agents.forEach(a => agentMap[a.name] = a.id);

    // 3. CREATE NEW RICH TASKS
    const newTasks = [
      {
        name: "Comprehensive SEO Audit",
        description: "Perform a full SEO analysis on a given URL.",
        agents: [agentMap["SEO Expert"]],
        workflow_steps: "1. Use 'fetch_webpage' tool to download the content of https://example.com (or prompt the user for a URL).\n2. Use 'count_words' to analyze length and readability.\n3. Use 'extract_keywords' on the raw text to find primary search terms.\n4. Call 'ask_llm' to evaluate the H1/H2 structures and semantic relevance.\n5. Output a final, formatted SEO Audit Report."
      },
      {
        name: "Crypto Sentiment & Trade Strategy",
        description: "Analyze the current sentiment and price action for Bitcoin to generate a trade strategy.",
        agents: [agentMap["Financial Analyst"], agentMap["News Analyst"]],
        workflow_steps: "1. Agent 'News Analyst': Use 'get_news' tool to fetch the latest 5 headlines about Bitcoin.\n2. Agent 'News Analyst': Use 'summarize_text' to determine the overall market sentiment (Bullish, Bearish, Neutral).\n3. Hand over sentiment analysis to 'Financial Analyst'.\n4. Agent 'Financial Analyst': Use 'get_crypto_price' to fetch current BTC price.\n5. Agent 'Financial Analyst': Combine the sentiment report and current price to output a final Trade Strategy Report."
      },
      {
        name: "Security Vulnerability Scan",
        description: "Analyze a provided configuration file for potential security risks.",
        agents: [agentMap["SecOps Auditor"]],
        workflow_steps: "1. Use 'base64_decode' to decode the following config string: 'UE9SVD04MDgwCkVORz1kZXZlbG9wbWVudApEQl9QQVNTV09SRD1wYXNzd29yZDEyMw=='\n2. Analyze the decoded text for security vulnerabilities (e.g., hardcoded passwords, unsafe ports).\n3. Generate a risk assessment report.\n4. Provide a secure, patched version of the configuration."
      },
      {
        name: "Academic Deep-Dive Report",
        description: "Research the impact of quantum computing on classical cryptography.",
        agents: [agentMap["Research Scientist"]],
        workflow_steps: "1. Use 'search_web' to find recent articles on 'Quantum computing impact on RSA cryptography'.\n2. Use 'fetch_webpage' on the top 2 search results to gather detailed facts.\n3. Use 'summarize_text' on the gathered data to extract core themes.\n4. Format the final output as an academic paper abstract, including an introduction, methodology, findings, and conclusion."
      }
    ];

    for (const task of newTasks) {
      // Clean undefined agents if somehow missing
      const validAgents = task.agents.filter(a => a);
      const agentsJson = JSON.stringify(validAgents.map(String));

      await dbRun(
        'INSERT INTO tasks (name, description, agents, workflow_steps, status) VALUES (?, ?, ?, ?, ?)',
        [task.name, task.description, agentsJson, task.workflow_steps, 'saved']
      );
    }

    console.log('✅ Successfully seeded new agents and rich tasks!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding scenarios:', error);
    process.exit(1);
  }
}

seedScenarios();

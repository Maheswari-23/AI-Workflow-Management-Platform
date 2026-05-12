/**
 * Pre-built Workflow Templates
 * Users can import these to get started quickly
 */

const WORKFLOW_TEMPLATES = [
  {
    id: 'web-research-report',
    name: 'Web Research Report',
    category: 'Research',
    description: 'Search the web for a topic, fetch relevant pages, and create a comprehensive research report with sources.',
    icon: 'search',
    agents: ['Web Researcher'],
    workflow_steps: `1. Use web_search to find top 5-10 results about the research topic
2. Use fetch_webpage to read the content of the most relevant pages
3. Extract key information, facts, and statistics
4. Use summarize_text to create concise summaries of each source
5. Compile all findings into a structured research report
6. Include citations and source URLs for all information
7. Provide a conclusion with key takeaways`,
    suggested_tools: ['web_search', 'fetch_webpage', 'summarize_text', 'extract_keywords'],
    example_description: 'Research the latest developments in AI workflow automation and create a comprehensive report.',
  },
  
  {
    id: 'daily-news-summary',
    name: 'Daily News Summary',
    category: 'Content',
    description: 'Fetch latest news on specified topics and create a formatted daily digest with analysis.',
    icon: 'newspaper',
    agents: ['News Analyst'],
    workflow_steps: `1. Use get_news to fetch latest headlines for specified topics
2. Filter and rank news by relevance and importance
3. Use fetch_webpage to read full articles for top stories
4. Use summarize_text to create brief summaries of each article
5. Analyze trends and common themes across stories
6. Format as a daily digest with sections by topic
7. Include source links and publication dates`,
    suggested_tools: ['get_news', 'fetch_webpage', 'summarize_text', 'get_current_time'],
    example_description: 'Create a daily news digest covering AI, technology, and business topics.',
  },
  
  {
    id: 'stock-market-analysis',
    name: 'Stock Market Analysis',
    category: 'Finance',
    description: 'Analyze stock prices, crypto markets, and provide investment insights with data visualization.',
    icon: 'trending-up',
    agents: ['Market Intelligence'],
    workflow_steps: `1. Use fetch_stock_price to get current prices for specified stocks
2. Use get_crypto_price to check cryptocurrency prices
3. Use get_exchange_rate for currency conversion if needed
4. Calculate price changes and percentage movements
5. Use get_news to fetch relevant market news
6. Analyze trends and identify patterns
7. Provide investment insights and risk assessment
8. Format as a professional market analysis report`,
    suggested_tools: ['fetch_stock_price', 'get_crypto_price', 'get_exchange_rate', 'get_news', 'calculator'],
    example_description: 'Analyze AAPL, TSLA, and Bitcoin prices with market trends and news.',
  },
  
  {
    id: 'content-generation-pipeline',
    name: 'Content Generation Pipeline',
    category: 'Content',
    description: 'Multi-agent pipeline: research topic → write content → translate → quality check.',
    icon: 'edit',
    agents: ['Web Researcher', 'Content Writer', 'Quality Auditor'],
    workflow_steps: `1. [Agent 1: Web Researcher] Research the topic using web_search and fetch_webpage
2. Extract key points and create research summary
3. [APPROVAL] Review research before writing
4. [Agent 2: Content Writer] Use research to write original content
5. Use summarize_text and extract_keywords for SEO optimization
6. [APPROVAL] Review draft content
7. [Agent 3: Quality Auditor] Check for grammar, clarity, and accuracy
8. Provide final polished content with metadata`,
    suggested_tools: ['web_search', 'fetch_webpage', 'summarize_text', 'extract_keywords', 'translate_text', 'count_words'],
    example_description: 'Create a 1000-word blog post about sustainable energy solutions.',
  },
  
  {
    id: 'file-organization',
    name: 'File Organization & Analysis',
    category: 'Automation',
    description: 'Scan directories, analyze files, categorize content, and create organized reports.',
    icon: 'folder',
    agents: ['File Manager'],
    workflow_steps: `1. Use list_directory to scan specified folder
2. Use read_file to analyze file contents
3. Categorize files by type, size, and content
4. Use count_words and parse_json for content analysis
5. Create summary statistics (total files, sizes, types)
6. Generate recommendations for organization
7. Use write_file to create detailed inventory report
8. Log all actions for audit trail`,
    suggested_tools: ['list_directory', 'read_file', 'write_file', 'count_words', 'parse_json', 'log'],
    example_description: 'Analyze and organize files in the /documents folder and create an inventory report.',
  },
  
  {
    id: 'cleanup-temp-files',
    name: 'Cleanup Temporary Files',
    category: 'Automation',
    description: 'Find and remove .tmp, .bak, and old setup files in the Downloads folder.',
    icon: 'trash-2',
    agents: ['Data Cleaner'],
    workflow_steps: `1. Scan the Downloads folder for files with .tmp, .bak, or .temp extensions
2. Identify old .exe or .msi setup files that haven't been accessed in 30 days
3. Create a summary of files to be deleted
4. [APPROVAL] Wait for user confirmation before deleting files
5. Remove the approved temporary files`,
    suggested_tools: ['list_directory', 'run_shell_command', 'log'],
    example_description: 'Clean up temporary and setup files in my Downloads folder to free up space.',
  },
  
  {
    id: 'organize-photos-by-date',
    name: 'Organize Photos by Date',
    category: 'Automation',
    description: 'Move images from Downloads into folders organized by year.',
    icon: 'image',
    agents: ['Media Manager'],
    workflow_steps: `1. List all files with image extensions (.jpg, .png, .jpeg) in the Downloads folder
2. Determine the creation year for each file from name or metadata
3. Create folders like 'Photos/2023', 'Photos/2024' inside Downloads if they don't exist
4. Move the images into their respective year folders`,
    suggested_tools: ['list_directory', 'run_shell_command', 'get_current_time'],
    example_description: 'Organize all the screenshots and photos in my Downloads folder into yearly subfolders.',
  },
  
  {
    id: 'source-code-backup',
    name: 'Source Code Backup',
    category: 'Automation',
    description: 'Identify project folders (containing .git or package.json) and suggest archival.',
    icon: 'archive',
    agents: ['Log Archiver'],
    workflow_steps: `1. Scan the Downloads folder for directories
2. For each directory, check for the presence of '.git' or 'package.json'
3. List all identified project folders
4. Suggest creating a ZIP archive for each project and moving it to a 'Backups' folder`,
    suggested_tools: ['list_directory', 'run_shell_command'],
    example_description: 'Find all my coding projects in Downloads and back them up to a central folder.',
  },
  
  {
    id: 'read-write-text-file',
    name: 'Read/Write Text File',
    category: 'Automation',
    description: 'Create a simple .txt file, write content to it, and then read it back.',
    icon: 'file-text',
    agents: ['File Manager'],
    workflow_steps: `1. Use write_file to create a new file named 'hello_world.txt' in the Downloads folder
2. Write the text 'Hello from the AI Workflow Platform!' into the file
3. Use read_file to read the content of 'hello_world.txt'
4. IMPORTANT: In your final output, explicitly print the exact content you read from the file so the user can see it.
5. Use run_shell_command to delete the file after verifying it (e.g. 'del hello_world.txt' on Windows).`,
    suggested_tools: ['write_file', 'read_file', 'log', 'run_shell_command'],
    example_description: 'Test the file system by creating and reading a simple text file.',
  },
  
  {
    id: 'ai-news-trends-report',
    name: 'AI News & Trends Report',
    category: 'Content',
    description: 'Fetch latest AI news and save it to a dated .txt file.',
    icon: 'newspaper',
    agents: ['News Analyst'],
    workflow_steps: `1. Use get_news to search for the latest trends and news in Artificial Intelligence
2. Use get_current_time to get the current date
3. Format the findings into a clear, structured report
4. Use write_file to save the report to a file named 'latest_ai_news_[current_date].txt' in the Downloads folder`,
    suggested_tools: ['get_news', 'get_current_time', 'write_file', 'log'],
    example_description: 'Stay updated with AI trends by generating a dated news report file.',
  },
];

module.exports = { WORKFLOW_TEMPLATES };

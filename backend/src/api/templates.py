from fastapi import APIRouter

router = APIRouter()

TEMPLATES = [
    {
        "id": "research-report",
        "name": "Research Report Generator",
        "description": "Automatically research a topic, gather sources, and generate a comprehensive report.",
        "category": "Research",
        "icon": "search",
        "agents": ["Research Analyst", "Report Writer"],
        "suggested_tools": ["web_search", "fetch_webpage", "summarize_text"],
        "workflow_steps": "1. Search the web for the given topic\n2. Fetch and read top 5 results\n3. Summarize key findings\n4. Generate a structured report with citations",
        "example_description": "Research the latest trends in renewable energy for 2026",
    },
    {
        "id": "content-writer",
        "name": "Blog Post Writer",
        "description": "Generate SEO-optimized blog posts with proper structure and engaging content.",
        "category": "Content",
        "icon": "edit",
        "agents": ["Content Strategist", "SEO Writer"],
        "suggested_tools": ["web_search", "summarize_text", "extract_keywords"],
        "workflow_steps": "1. Research the topic and competitors\n2. Extract relevant keywords\n3. Create blog outline\n4. Write full blog post with SEO optimization",
        "example_description": "Write a blog post about AI-powered workflow automation",
    },
    {
        "id": "stock-analyzer",
        "name": "Stock Market Analyzer",
        "description": "Analyze stock performance, fetch real-time data, and generate investment insights.",
        "category": "Finance",
        "icon": "trending-up",
        "agents": ["Financial Analyst", "Data Reporter"],
        "suggested_tools": ["fetch_stock_price", "get_news", "summarize_text", "calculator"],
        "workflow_steps": "1. Fetch current stock price and historical data\n2. Get latest news about the company\n3. Analyze price trends and calculate key metrics\n4. Generate investment summary with recommendations",
        "example_description": "Analyze AAPL stock performance and provide investment insights",
    },
    {
        "id": "news-digest",
        "name": "Daily News Digest",
        "description": "Aggregate news from multiple sources and create a formatted digest.",
        "category": "Content",
        "icon": "newspaper",
        "agents": ["News Aggregator", "Summary Writer"],
        "suggested_tools": ["get_news", "web_search", "summarize_text"],
        "workflow_steps": "1. Fetch latest headlines for the given topics\n2. Summarize each article\n3. Group by category\n4. Format into a readable daily digest",
        "example_description": "Create a daily digest about AI, technology, and business news",
    },
    {
        "id": "file-organizer",
        "name": "File System Organizer",
        "description": "Scan directories, categorize files, and generate organization reports.",
        "category": "Automation",
        "icon": "folder",
        "agents": ["File Scanner", "Organization Planner"],
        "suggested_tools": ["list_directory", "read_file", "write_file"],
        "workflow_steps": "1. List all files in the target directory\n2. Categorize files by type and age\n3. Identify duplicates and large files\n4. Generate an organization report with recommendations",
        "example_description": "Scan and organize the Downloads folder",
    },
]

@router.get("/")
def get_templates():
    return {"templates": TEMPLATES}

@router.get("/{template_id}")
def get_template(template_id: str):
    for t in TEMPLATES:
        if t["id"] == template_id:
            return {"template": t}
    return {"error": "Template not found"}, 404

@router.post("/{template_id}/create")
def create_from_template(template_id: str):
    for t in TEMPLATES:
        if t["id"] == template_id:
            return {
                "task": {
                    "id": 0,
                    "name": t["name"],
                    "description": t["description"],
                    "agents": [],
                    "workflow_steps": t["workflow_steps"],
                    "status": "draft",
                }
            }
    return {"error": "Template not found"}, 404

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.database.models import Agent, Tool

router = APIRouter()

SEED_AGENTS = [
    {"name": "Research Analyst", "system_prompt": "You are a meticulous research analyst. You find, verify, and synthesize information from multiple sources. Always cite your sources and present balanced perspectives."},
    {"name": "Content Writer", "system_prompt": "You are a professional content writer. You create engaging, well-structured, and SEO-friendly content. Match the tone to the target audience."},
    {"name": "Data Analyst", "system_prompt": "You are a data-driven analyst. You interpret numbers, identify trends, and translate complex data into actionable insights. Always show your calculations."},
    {"name": "Code Developer", "system_prompt": "You are an expert software developer. You write clean, efficient, and well-documented code. Follow best practices and explain your approach."},
    {"name": "Financial Advisor", "system_prompt": "You are a knowledgeable financial advisor. You analyze market trends, evaluate investments, and provide prudent financial recommendations with risk assessments."},
]

SEED_TOOLS = [
    ["get_current_time",   "system",  "Get current date, time, timezone and unix timestamp."],
    ["generate_uuid",      "system",  "Generate a random UUID v4."],
    ["calculator",         "system",  "Evaluate a math expression e.g. '2 * (5 + 3)'."],
    ["log",                "system",  "Log a message to workflow output."],
    ["random_number",      "system",  "Generate a random integer between min and max."],
    ["format_date",        "system",  "Format a date or get current date in multiple formats."],
    ["count_words",        "system",  "Count words, characters and sentences in text."],
    ["base64_encode",      "system",  "Encode text to base64."],
    ["base64_decode",      "system",  "Decode a base64 string to text."],
    ["string_replace",     "system",  "Replace all occurrences of a substring in text."],
    ["string_upper",       "system",  "Convert text to uppercase."],
    ["string_lower",       "system",  "Convert text to lowercase."],
    ["parse_json",         "system",  "Parse a JSON string and optionally extract a field."],
    ["read_file",          "fs",      "Read the contents of a file from the server."],
    ["write_file",         "fs",      "Write content to a file on the server."],
    ["list_directory",     "fs",      "List files in a directory on the server."],
    ["run_shell_command",  "fs",      "Execute a shell command on the server and return stdout."],
    ["web_search",         "browser", "Search the web using DuckDuckGo and return top results."],
    ["fetch_webpage",      "browser", "Fetch and extract text content from any URL."],
    ["scrape_links",       "browser", "Extract all hyperlinks from a webpage."],
    ["http_request",       "api",     "Make a custom HTTP request to any API endpoint."],
    ["get_weather",        "api",     "Get current weather for a city."],
    ["get_ip_info",        "api",     "Get geolocation and ISP info for an IP address."],
    ["fetch_stock_price",  "api",     "Fetch real-time or historical stock price data."],
    ["get_crypto_price",   "api",     "Get current cryptocurrency price from CoinGecko."],
    ["get_exchange_rate",  "api",     "Get live currency exchange rates and convert amounts."],
    ["get_news",           "api",     "Fetch latest news headlines for a topic."],
    ["get_public_holidays","api",     "Get public holidays for a country and year."],
    ["summarize_text",     "ai",      "Summarize a long piece of text using the configured LLM."],
    ["extract_keywords",   "ai",      "Extract the most important keywords from text using LLM."],
    ["translate_text",     "ai",      "Translate text to another language using the configured LLM."],
    ["ask_llm",            "ai",      "Ask the configured LLM a question and get a response."],
]

@router.post("/")
def seed_data(db: Session = Depends(get_db)):
    agents_created = 0
    tools_created = 0

    # Seed agents
    for agent_data in SEED_AGENTS:
        existing = db.query(Agent).filter(Agent.name == agent_data["name"]).first()
        if not existing:
            db.add(Agent(**agent_data))
            agents_created += 1

    # Seed tools
    for name, tool_type, description in SEED_TOOLS:
        existing = db.query(Tool).filter(Tool.name == name).first()
        if not existing:
            db.add(Tool(name=name, type=tool_type, description=description, status="active"))
            tools_created += 1

    db.commit()
    return {
        "message": f"Seeded {agents_created} agents and {tools_created} tools.",
        "agents_created": agents_created,
        "tools_created": tools_created,
    }

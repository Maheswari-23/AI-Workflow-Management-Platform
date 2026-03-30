'use client';
import { useState } from 'react';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

const AGENT_TEMPLATES = [
  {
    category: 'Research',
    items: [
      { name: 'Web Researcher', description: 'Searches the web, fetches pages, and summarizes findings on any topic.', system_prompt: 'You are an expert web researcher. When given a topic, use web_search and fetch_webpage tools to gather information, then provide a comprehensive, well-structured summary with sources.', tools: ['web_search', 'fetch_webpage', 'summarize_text'], icon: '🔍' },
      { name: 'News Analyst', description: 'Fetches latest news on a topic and provides analysis and key takeaways.', system_prompt: 'You are a news analyst. Use get_news to fetch headlines, then analyze trends, sentiment, and key developments. Always cite sources and provide balanced analysis.', tools: ['get_news', 'web_search', 'summarize_text'], icon: '📰' },
      { name: 'Market Intelligence', description: 'Tracks stock prices, crypto, exchange rates and provides market insights.', system_prompt: 'You are a market intelligence analyst. Use financial tools to gather data on stocks, crypto, and currencies. Provide clear analysis with numbers and trends.', tools: ['fetch_stock_price', 'get_crypto_price', 'get_exchange_rate'], icon: '📈' },
    ]
  },
  {
    category: 'Data Processing',
    items: [
      { name: 'Data Transformer', description: 'Parses, transforms, and formats data between different structures.', system_prompt: 'You are a data transformation specialist. Use parse_json, string_replace, and other utility tools to clean, transform, and reformat data as requested. Always validate output.', tools: ['parse_json', 'string_replace', 'base64_encode', 'count_words'], icon: '⚙️' },
      { name: 'File Processor', description: 'Reads files, processes content, and writes results back to disk.', system_prompt: 'You are a file processing agent. Read files, analyze or transform their content, and write results. Always confirm file paths before writing and handle errors gracefully.', tools: ['read_file', 'write_file', 'list_directory', 'count_words'], icon: '📁' },
      { name: 'Text Analyst', description: 'Analyzes text for keywords, sentiment, word count, and summaries.', system_prompt: 'You are a text analysis expert. Extract keywords, count words, summarize content, and translate text as needed. Provide structured analysis with clear metrics.', tools: ['summarize_text', 'extract_keywords', 'count_words', 'translate_text'], icon: '📝' },
    ]
  },
  {
    category: 'Automation',
    items: [
      { name: 'API Integrator', description: 'Makes HTTP requests to external APIs and processes responses.', system_prompt: 'You are an API integration specialist. Use http_request to call external APIs, parse responses with parse_json, and format results clearly. Handle errors and rate limits gracefully.', tools: ['http_request', 'parse_json', 'log'], icon: '🔗' },
      { name: 'Scheduler Assistant', description: 'Helps plan and organize tasks with time and date awareness.', system_prompt: 'You are a scheduling assistant. Use time and date tools to help plan tasks, calculate deadlines, and organize workflows. Always confirm timezone and format dates clearly.', tools: ['get_current_time', 'format_date', 'get_public_holidays', 'log'], icon: '🗓️' },
      { name: 'System Monitor', description: 'Runs shell commands to monitor system health and gather diagnostics.', system_prompt: 'You are a system monitoring agent. Use run_shell_command to check system status, disk usage, running processes, and other diagnostics. Report findings clearly and flag any issues.', tools: ['run_shell_command', 'list_directory', 'log'], icon: '🖥️' },
    ]
  },
  {
    category: 'AI Assistant',
    items: [
      { name: 'General Assistant', description: 'A versatile AI assistant that can handle a wide range of tasks.', system_prompt: 'You are a helpful, knowledgeable AI assistant. You have access to web search, data tools, and utility functions. Always be clear, concise, and accurate. Ask for clarification when needed.', tools: ['web_search', 'fetch_webpage', 'calculator', 'get_current_time', 'ask_llm'], icon: '🤖' },
      { name: 'Code Helper', description: 'Assists with code analysis, shell commands, and file operations.', system_prompt: 'You are a coding assistant. Help analyze code, run shell commands, read/write files, and solve technical problems. Always explain what you are doing and why.', tools: ['run_shell_command', 'read_file', 'write_file', 'list_directory', 'web_search'], icon: '💻' },
      { name: 'Translator & Summarizer', description: 'Translates content to any language and creates concise summaries.', system_prompt: 'You are a multilingual content specialist. Translate text accurately while preserving tone and meaning. Create concise, well-structured summaries that capture key points.', tools: ['translate_text', 'summarize_text', 'extract_keywords', 'count_words'], icon: '🌐' },
    ]
  },
];

export default function MarketplacePage() {
  const [installing, setInstalling] = useState(null);
  const [installed, setInstalled] = useState({});
  const [filter, setFilter] = useState('All');

  const categories = ['All', ...AGENT_TEMPLATES.map(g => g.category)];

  const install = async (template) => {
    setInstalling(template.name);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: template.name, system_prompt: template.system_prompt }),
      });
      const data = await res.json();
      if (data.agent) {
        setInstalled(prev => ({ ...prev, [template.name]: true }));
      }
    } catch(e) { console.error(e); }
    finally { setInstalling(null); }
  };

  const filtered = filter === 'All'
    ? AGENT_TEMPLATES
    : AGENT_TEMPLATES.filter(g => g.category === filter);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      <div className="px-6 py-4" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <h1 className="text-2xl font-bold" style={{ color: TH }}>Agent Marketplace</h1>
        <p className="text-sm mt-0.5" style={{ color: TM }}>Pre-built agent templates. Click Install to add to your workspace instantly.</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className="px-3 py-1 text-xs font-semibold rounded-lg"
              style={filter === c ? { background: L, color: '#fff' } : { background: LL, color: L }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-5xl mx-auto space-y-8">
          {filtered.map(group => (
            <div key={group.category}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: TM }}>{group.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map(template => (
                  <div key={template.name} className="rounded-2xl p-5 flex flex-col"
                    style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold" style={{ color: TH }}>{template.name}</h3>
                        <p className="text-xs mt-0.5" style={{ color: TM }}>{template.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tools.slice(0, 4).map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: LL, color: L }}>{t}</span>
                      ))}
                      {template.tools.length > 4 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#f3f4f6', color: TM }}>+{template.tools.length - 4} more</span>
                      )}
                    </div>
                    <button onClick={() => install(template)}
                      disabled={installing === template.name || installed[template.name]}
                      className="mt-auto w-full py-2 text-sm font-semibold rounded-xl hover:opacity-85 disabled:opacity-60"
                      style={installed[template.name]
                        ? { background: '#d1fae5', color: '#065f46' }
                        : { background: L, color: '#fff', boxShadow: `0 4px 12px rgba(181,123,238,0.3)` }}>
                      {installed[template.name] ? '✓ Installed' : installing === template.name ? 'Installing...' : 'Install Agent'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

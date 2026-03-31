'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '../../components/PageHeader';
import { toast } from '../../components/Toast';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

const AGENT_TEMPLATES = [
  {
    id: 'web-researcher',
    name: 'Web Researcher',
    category: 'Research',
    description: 'Expert at searching the web, fetching pages, and compiling research reports with citations.',
    icon: 'search',
    system_prompt: `You are a Web Research Specialist. Your role is to:
1. Search the web for accurate, up-to-date information
2. Fetch and analyze relevant web pages
3. Extract key facts, statistics, and insights
4. Compile comprehensive research reports with proper citations
5. Verify information from multiple sources
6. Provide source URLs for all claims

Always prioritize credible sources and fact-check information.`,
    skills: ['web_search', 'fetch_webpage', 'summarize_text', 'extract_keywords'],
    color: { bg: '#dbeafe', color: '#1e40af' },
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    category: 'Finance',
    description: 'Analyzes stock prices, crypto markets, and financial data to provide investment insights.',
    icon: 'chart',
    system_prompt: `You are a Financial Data Analyst. Your expertise includes:
1. Analyzing stock market data and trends
2. Tracking cryptocurrency prices and movements
3. Calculating financial metrics and ratios
4. Identifying market patterns and opportunities
5. Providing data-driven investment insights
6. Creating clear, actionable reports

Always include risk disclaimers and base recommendations on data.`,
    skills: ['fetch_stock_price', 'get_crypto_price', 'get_exchange_rate', 'calculator', 'get_news'],
    color: { bg: '#d1fae5', color: '#065f46' },
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    category: 'Content',
    description: 'Creates high-quality written content, blog posts, and articles with SEO optimization.',
    icon: 'edit',
    system_prompt: `You are a Professional Content Writer. Your skills include:
1. Writing engaging, well-structured content
2. Optimizing content for SEO with keywords
3. Adapting tone and style for different audiences
4. Creating compelling headlines and introductions
5. Ensuring grammar, clarity, and readability
6. Incorporating research and citations

Focus on quality, originality, and reader engagement.`,
    skills: ['web_search', 'summarize_text', 'extract_keywords', 'count_words', 'translate_text'],
    color: { bg: '#fce7f3', color: '#9f1239' },
  },
  {
    id: 'file-manager',
    name: 'File Manager',
    category: 'Automation',
    description: 'Organizes files, analyzes directory structures, and manages file operations efficiently.',
    icon: 'folder',
    system_prompt: `You are a File Management Specialist. Your responsibilities:
1. Organizing and categorizing files systematically
2. Analyzing directory structures and contents
3. Reading, writing, and managing files safely
4. Creating detailed file inventories and reports
5. Identifying duplicate or unnecessary files
6. Maintaining clean, organized file systems

Always confirm before deleting or moving files.`,
    skills: ['list_directory', 'read_file', 'write_file', 'parse_json', 'log'],
    color: { bg: '#fef3c7', color: '#92400e' },
  },
  {
    id: 'news-analyst',
    name: 'News Analyst',
    category: 'Research',
    description: 'Fetches latest news, analyzes trends, and creates daily news digests on any topic.',
    icon: 'newspaper',
    system_prompt: `You are a News Analysis Expert. Your role involves:
1. Fetching latest news from reliable sources
2. Analyzing news trends and patterns
3. Identifying key stories and developments
4. Creating concise, informative news summaries
5. Providing context and background information
6. Tracking ongoing stories and updates

Maintain objectivity and cite all sources.`,
    skills: ['get_news', 'web_search', 'fetch_webpage', 'summarize_text', 'get_current_time'],
    color: { bg: '#dbeafe', color: '#1e40af' },
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    category: 'AI',
    description: 'General-purpose AI assistant with text processing, translation, and summarization capabilities.',
    icon: 'sparkles',
    system_prompt: `You are a Versatile AI Assistant. Your capabilities include:
1. Answering questions accurately and helpfully
2. Summarizing long texts concisely
3. Translating between languages
4. Extracting key information from documents
5. Providing explanations and insights
6. Assisting with various text processing tasks

Be helpful, accurate, and user-friendly in all interactions.`,
    skills: ['ask_llm', 'summarize_text', 'translate_text', 'extract_keywords', 'count_words'],
    color: { bg: '#e9d5ff', color: '#7c3aed' },
  },
];

const iconMap = {
  'search': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  'chart': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
  'edit': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
  'folder': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
  'newspaper': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />,
  'sparkles': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
};

export default function MarketplacePage() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const router = useRouter();

  const categories = [
    { id: 'all', name: 'All Agents', count: AGENT_TEMPLATES.length },
    { id: 'Research', name: 'Research', count: AGENT_TEMPLATES.filter(a => a.category === 'Research').length },
    { id: 'Finance', name: 'Finance', count: AGENT_TEMPLATES.filter(a => a.category === 'Finance').length },
    { id: 'Content', name: 'Content', count: AGENT_TEMPLATES.filter(a => a.category === 'Content').length },
    { id: 'Automation', name: 'Automation', count: AGENT_TEMPLATES.filter(a => a.category === 'Automation').length },
    { id: 'AI', name: 'AI', count: AGENT_TEMPLATES.filter(a => a.category === 'AI').length },
  ];

  const filteredAgents = selectedCategory === 'all' 
    ? AGENT_TEMPLATES 
    : AGENT_TEMPLATES.filter(a => a.category === selectedCategory);

  const handleInstall = async (template) => {
    setIsInstalling(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          system_prompt: template.system_prompt,
          skills: template.skills.join(','),
          status: 'online',
        }),
      });
      const data = await res.json();
      if (data.agent) {
        toast.success(`${template.name} installed successfully!`);
        setSelectedAgent(null);
        router.push('/agents');
      } else {
        toast.error(data.error || 'Failed to install agent');
      }
    } catch (err) {
      toast.error('Installation failed: ' + err.message);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      <PageHeader 
        title="Agent Marketplace" 
        description="Pre-configured AI agents ready to use. One-click installation."
        buttonText="↻ Refresh"
        buttonAction={() => window.location.reload()}
      />

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-7xl mx-auto">

          {/* Category Filter */}
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={selectedCategory === cat.id 
                  ? { background: L, color: '#fff', boxShadow: '0 2px 8px rgba(181,123,238,0.3)' }
                  : { background: '#fff', color: TM, border: `1.5px solid ${LB}` }}>
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>

          {/* Agent Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map(agent => (
              <div key={agent.id}
                className="rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg flex flex-col"
                style={{ background: '#fff', border: `1.5px solid ${LB}`, minHeight: '320px' }}
                onClick={() => setSelectedAgent(agent)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" 
                    style={{ background: agent.color.bg }}>
                    <svg className="w-6 h-6" style={{ color: agent.color.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {iconMap[agent.icon]}
                    </svg>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ background: agent.color.bg, color: agent.color.color }}>
                    {agent.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: TH }}>{agent.name}</h3>
                <p className="text-sm mb-4" style={{ color: TM, minHeight: '40px' }}>{agent.description}</p>
                <div className="flex flex-wrap gap-1 mb-4" style={{ minHeight: '28px' }}>
                  {agent.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="text-xs px-2 py-0.5 rounded-full" style={{ background: LL, color: L }}>
                      {skill}
                    </span>
                  ))}
                  {agent.skills.length > 3 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: LL, color: L }}>
                      +{agent.skills.length - 3}
                    </span>
                  )}
                </div>
                <button 
                  className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl hover:opacity-85 transition-all mt-auto"
                  style={{ background: L, color: '#fff' }}
                  onClick={(e) => { e.stopPropagation(); setSelectedAgent(agent); }}>
                  Install Agent →
                </button>
              </div>
            ))}
          </div>

          {/* Agent Detail Modal */}
          {selectedAgent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedAgent(null)}>
              <div className="rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                style={{ background: '#fff' }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" 
                      style={{ background: selectedAgent.color.bg }}>
                      <svg className="w-8 h-8" style={{ color: selectedAgent.color.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {iconMap[selectedAgent.icon]}
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1" style={{ color: TH }}>{selectedAgent.name}</h2>
                      <span className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ background: selectedAgent.color.bg, color: selectedAgent.color.color }}>
                        {selectedAgent.category}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedAgent(null)} className="text-2xl hover:opacity-70" style={{ color: TM }}>✕</button>
                </div>

                <p className="text-sm mb-6" style={{ color: TM }}>{selectedAgent.description}</p>

                <div className="mb-6">
                  <h3 className="text-sm font-bold mb-3" style={{ color: TH }}>System Prompt:</h3>
                  <pre className="text-xs p-4 rounded-xl whitespace-pre-wrap font-mono leading-relaxed"
                    style={{ background: '#fafafa', color: TH, border: `1px solid ${LB}` }}>
                    {selectedAgent.system_prompt}
                  </pre>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold mb-3" style={{ color: TH }}>Included Tools ({selectedAgent.skills.length}):</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.skills.map(skill => (
                      <span key={skill} className="text-xs px-2 py-1 rounded-full" style={{ background: LL, color: L }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleInstall(selectedAgent)}
                    disabled={isInstalling}
                    className="flex-1 px-6 py-3 text-white font-semibold rounded-xl hover:opacity-85 disabled:opacity-50 transition-all"
                    style={{ background: L, boxShadow: '0 4px 12px rgba(181,123,238,0.3)' }}>
                    {isInstalling ? 'Installing...' : 'Install Agent'}
                  </button>
                  <button 
                    onClick={() => setSelectedAgent(null)}
                    className="px-6 py-3 font-semibold rounded-xl hover:opacity-85 transition-all"
                    style={{ background: LL, color: L, border: `1.5px solid ${LB}` }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

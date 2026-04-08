import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const LILAC = '#b57bee';
const LILAC_LIGHT = '#f3e8ff';
const LILAC_BORDER = '#e9d5ff';
const TEXT_HEADING = '#1e0a35';
const TEXT_MUTED = '#9b87ba';

const cards = [
  { href: '/agents', title: 'Agents', desc: 'Create, equip, and monitor standalone AI actors capable of executing modular tasks.', cta: 'Manage Agents', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /> },
  { href: '/tasks', title: 'Tasks', desc: 'Draft detailed prompt requests, assign agents, and use LLMs to automate steps mapping.', cta: 'Manage Tasks', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
  { href: '/scheduler', title: 'Scheduler', desc: 'Set up CRON jobs or Event Triggers to automatically run defined workflows passively.', cta: 'Manage Schedules', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { href: '/tools', title: 'Tools', desc: 'Register APIs, databases, or execution scripts to be assigned dynamically to agents.', cta: 'Manage Tools', icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></> },
  { href: '/history', title: 'Run History', desc: 'View comprehensive logs, statuses, and execution metadata for all scheduled tasks.', cta: 'View History', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { href: '/settings/llms', title: 'LLM Models', desc: 'Update default providers, API Keys, Base URLs, and parameters across the entire platform.', cta: 'Global Settings', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /> },
];

export default function DashboardContent() {
  const [stats, setStats] = useState({ agents: '—', tasks: '—', runs: '—', schedules: '—' });
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [agentsRes, tasksRes, schedulesRes, historyRes, analyticsRes] = await Promise.all([
          fetch('/api/agents'),
          fetch('/api/tasks'),
          fetch('/api/schedules'),
          fetch('/api/history?limit=1000'),
          fetch('/api/history/analytics')
        ]);
        const [agentsData, tasksData, schedulesData, historyData, analyticsData] = await Promise.all([
          agentsRes.json(), tasksRes.json(), schedulesRes.json(), historyRes.json(), analyticsRes.json()
        ]);
        
        setStats({
          agents:    (agentsData.agents || []).length,
          tasks:     (tasksData.tasks || []).length,
          schedules: (schedulesData.schedules || []).filter(s => s.status === 'active').length,
          runs:      (historyData.history || []).length,
        });

        if (analyticsData && !analyticsData.error) {
          setAnalytics(analyticsData);
        }
      } catch (e) { console.error('Error fetching dashboard stats', e); }
    };
    fetchStats();
  }, []);

  const totalCost = analytics?.totals?.cost || 0;
  const totalTokens = (analytics?.totals?.promptTokens || 0) + (analytics?.totals?.completionTokens || 0);

  const statItems = [
    { label: 'Agents', value: stats.agents, color: LILAC },
    { label: 'Tasks', value: stats.tasks, color: '#8b5cf6' },
    { label: 'Active Schedules', value: stats.schedules, color: '#059669' },
    { label: 'Total Runs', value: stats.runs, color: '#d97706' },
    { label: 'Total Tokens', value: totalTokens > 0 ? totalTokens.toLocaleString() : '—', color: '#0ea5e9', colSpan: 2 },
    { label: 'Total API Cost', value: totalCost > 0 ? `$${totalCost.toFixed(4)}` : '—', color: '#10b981', colSpan: 2 },
  ];

  return (
    <div className="h-full overflow-y-auto px-6 pt-20 pb-10 w-full" style={{ background: '#fff' }}>
      <div className="max-w-6xl mx-auto w-full">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4" style={{ color: TEXT_HEADING }}>
            AI Workflow{' '}
            <span style={{ color: LILAC }}>Management</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: TEXT_MUTED }}>
            Centralized orchestration dashboard to define intelligent agents, map out robust workflows, and automate task scheduling at scale.
          </p>
        </div>

        {/* Live Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-10">
          {statItems.map(s => (
            <div key={s.label} className={`rounded-2xl p-5 text-center transition-all duration-200 ${s.colSpan ? `col-span-${s.colSpan}` : 'col-span-2'}`}
              style={{ background: '#fff', border: `1.5px solid ${LILAC_BORDER}`, boxShadow: '0 1px 6px rgba(181,123,238,0.08)' }}>
              <div className="text-3xl font-extrabold mb-1 truncate" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-medium uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Analytics Chart */}
        {(() => {
          if (!analytics || !analytics.timeseries || analytics.timeseries.length === 0) return null;
          
          const maxCost = Math.max(...analytics.timeseries.map(t => t.daily_cost || 0));
          const maxTokens = Math.max(...analytics.timeseries.map(t => t.daily_tokens || 0));
          
          // Hide completely if NO data at all
          if (maxCost === 0 && maxTokens === 0) return null;

          // Decision: Show cost if any cost > 0, otherwise show tokens
          const showCost = maxCost > 0;
          const maxVal = showCost ? Math.max(maxCost, 0.0001) : Math.max(maxTokens, 1);
          const chartTitle = showCost ? 'Daily API Cost (Last 14 Days)' : 'Daily Token Usage (Last 14 Days)';
          const unitPrefix = showCost ? '$' : '';
          const precision = showCost ? 4 : 0;

          return (
            <div className="mb-10 rounded-2xl p-6" style={{ background: '#fff', border: `1.5px solid ${LILAC_BORDER}`, boxShadow: '0 1px 8px rgba(181,123,238,0.08)' }}>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: TEXT_HEADING }}>
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                {chartTitle}
              </h3>
              
              <div className="h-64 w-full relative mb-4">
                {(() => {
                  // Create full 14 day array filling in missing dates
                  const today = new Date();
                  const data = [];
                  for(let i=13; i>=0; i--) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    
                    const dayData = analytics.timeseries.find(t => t.date === dateStr);
                    data.push({
                      date: dateStr.substring(5), // MM-DD for display
                      val: showCost ? (dayData?.daily_cost || 0) : (dayData?.daily_tokens || 0),
                      fullValue: showCost ? (dayData?.daily_cost || 0) : (dayData?.daily_tokens || 0)
                    });
                  }

                  const color = LILAC;
                  const gradientId = 'colorAnalytics';

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={LILAC_BORDER} opacity={0.5} />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: TEXT_MUTED, fontSize: 10 }}
                          minTickGap={20}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: TEXT_MUTED, fontSize: 10 }}
                          tickFormatter={(v) => `${unitPrefix}${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`}
                        />
                        <Tooltip
                          contentStyle={{ 
                            background: '#fff', 
                            border: `1.5px solid ${LILAC_BORDER}`,
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            fontSize: '12px'
                          }}
                          formatter={(v) => [`${unitPrefix}${v.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}`, showCost ? 'Cost' : 'Tokens']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="val" 
                          stroke={color} 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill={`url(#${gradientId})`} 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
              
              {analytics.byModel && analytics.byModel.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: TEXT_MUTED }}>Details by Model</h4>
                  <div className="flex flex-wrap gap-3">
                    {analytics.byModel.map(m => (
                      <div key={m.model_used} className="px-3 py-2 rounded-lg flex items-center gap-3" style={{ background: '#f8fafc', border: `1px solid #e2e8f0` }}>
                        <span className="text-xs font-semibold text-slate-700">{m.model_used}</span>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">${m.cost.toFixed(4)}</span>
                        <span className="text-[10px] text-slate-400">{m.total_tokens.toLocaleString()} tokens</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}
              className="group block rounded-2xl p-7 transition-all duration-200"
              style={{ background: '#fff', border: `1.5px solid ${LILAC_BORDER}`, boxShadow: '0 1px 8px rgba(181,123,238,0.08)' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(181,123,238,0.18)'; e.currentTarget.style.borderColor = LILAC; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 8px rgba(181,123,238,0.08)'; e.currentTarget.style.borderColor = LILAC_BORDER; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200"
                style={{ background: LILAC_LIGHT, color: LILAC }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{card.icon}</svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: TEXT_HEADING }}>{card.title}</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: TEXT_MUTED }}>{card.desc}</p>
              <span className="text-sm font-semibold flex items-center gap-1" style={{ color: LILAC }}>
                {card.cta} <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

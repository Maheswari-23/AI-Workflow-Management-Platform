'use client';
import { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';
const COLORS = ['#b57bee', '#8b5cf6', '#d8b4fe', '#7c3aed', '#6d28d9', '#4c1d95'];

// Icons
const IconCost = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconTokens = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 11h.01M7 15h.01M11 7h.01M11 11h.01M11 15h.01M15 7h.01M15 11h.01M15 15h.01M19 7h.01M19 11h.01M19 15h.01M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const IconEfficiency = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const IconBudget = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

export default function CostPage() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [budgetLimit, setBudgetLimit] = useState(100);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    const saved = localStorage.getItem('orchestr_budget_limit');
    if (saved) setBudgetLimit(parseFloat(saved));
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/history/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudget = () => {
    localStorage.setItem('orchestr_budget_limit', budgetLimit.toString());
    setShowBudgetForm(false);
  };

  const totals = analytics?.totals || { cost: 0, promptTokens: 0, completionTokens: 0, runs: 0 };
  const budgetUsagePercent = (totals.cost / budgetLimit) * 100;
  const isNearLimit = budgetUsagePercent > 80;
  const isOverBudget = budgetUsagePercent > 100;

  const modelData = (analytics?.byModel || []).map(m => ({
    name: m.model_used,
    value: parseFloat(m.cost.toFixed(4)),
    tokens: m.total_tokens
  })).filter(m => m.value > 0);

  const timeseriesData = (analytics?.timeseries || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: parseFloat(d.daily_cost.toFixed(4)),
    tokens: d.daily_tokens
  }));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      <PageHeader 
        title="Cost Management" 
        description="Monitor and optimize your LLM spend with model-level granularity."
        buttonText="Set Budget"
        buttonAction={() => setShowBudgetForm(true)}
      />

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Budget Form Modal */}
          {showBudgetForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowBudgetForm(false)}>
              <div className="rounded-2xl p-8 max-w-md w-full shadow-2xl border border-purple-100"
                style={{ background: '#fff' }}
                onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2" style={{ color: TH }}>Set Spending Limit</h3>
                <p className="text-sm mb-6" style={{ color: TM }}>Enter your desired monthly budget in USD.</p>
                <div className="relative mb-6">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold" style={{ color: TM }}>$</span>
                  <input 
                    type="number" 
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-4 rounded-xl text-lg font-bold"
                    style={{ border: `1.5px solid ${LB}`, color: TH, outline: 'none' }}
                    placeholder="100.00"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={saveBudget} className="flex-1 px-6 py-3.5 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-md"
                    style={{ background: L }}>Save Changes</button>
                  <button onClick={() => setShowBudgetForm(false)} className="px-6 py-3.5 font-bold rounded-xl hover:bg-gray-50 transition-all"
                    style={{ color: TM }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-100 border-t-purple-600"></div>
              <p className="text-sm font-medium" style={{ color: TM }}>Gathering analytics data...</p>
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Expenditure', val: `$${totals.cost.toFixed(2)}`, sub: `${totals.runs} Total Runs`, icon: <IconCost />, color: '#10b981' },
                  { label: 'Token Usage', val: (totals.promptTokens + totals.completionTokens).toLocaleString(), sub: `${totals.completionTokens.toLocaleString()} Completion`, icon: <IconTokens />, color: L },
                  { label: 'Efficiency', val: `$${(totals.runs > 0 ? totals.cost / totals.runs : 0).toFixed(3)}`, sub: 'Avg. cost per task', icon: <IconEfficiency />, color: '#3b82f6' },
                  { label: 'Budget Limit', val: `$${budgetLimit.toFixed(0)}`, sub: `${budgetUsagePercent.toFixed(1)}% Consumed`, icon: <IconBudget />, color: isOverBudget ? '#ef4444' : '#f59e0b' },
                ].map((card, i) => (
                  <div key={i} className="rounded-2xl p-5 shadow-sm border" style={{ background: '#fff', borderColor: LB }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg" style={{ background: `${card.color}10`, color: card.color }}>{card.icon}</div>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TM }}>{card.label}</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: TH }}>{card.val}</p>
                    <p className="text-[11px] font-medium mt-1" style={{ color: TM }}>{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gauge Card */}
                <div className="lg:col-span-1 rounded-2xl p-6 shadow-sm border flex flex-col" style={{ background: '#fff', borderColor: LB }}>
                  <h3 className="text-sm font-bold mb-6 flex items-center gap-2" style={{ color: TH }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: L }}></span> Budget Status
                  </h3>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="relative h-40 w-40 mb-6">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        <circle cx="50" cy="50" r="42" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                        <circle cx="50" cy="50" r="42" stroke={isOverBudget ? '#ef4444' : isNearLimit ? '#f59e0b' : L} 
                          strokeWidth="8" fill="none" strokeDasharray={`${Math.min(100, budgetUsagePercent) * 2.64} 264`} 
                          strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold" style={{ color: TH }}>{Math.min(100, budgetUsagePercent).toFixed(0)}%</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: TM }}>Consumed</span>
                      </div>
                    </div>
                    <div className="w-full space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-xs font-medium" style={{ color: TM }}>Spent so far</span>
                        <span className="text-xs font-bold" style={{ color: TH }}>${totals.cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs font-medium" style={{ color: TM }}>Remaining</span>
                        <span className="text-xs font-bold" style={{ color: isOverBudget ? '#ef4444' : '#10b981' }}>
                          ${Math.max(0, budgetLimit - totals.cost).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pie Chart Card */}
                <div className="lg:col-span-2 rounded-2xl p-6 shadow-sm border" style={{ background: '#fff', borderColor: LB }}>
                  <h3 className="text-sm font-bold mb-6 flex items-center gap-2" style={{ color: TH }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }}></span> Model Expenditure
                  </h3>
                  <div className="h-[280px] w-full">
                    {modelData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={modelData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                            {modelData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} formatter={(v) => [`$${v}`, 'Expenditure']} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '20px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs font-medium" style={{ color: TM }}>No data available.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Trend Card */}
              <div className="rounded-2xl p-6 shadow-sm border" style={{ background: '#fff', borderColor: LB }}>
                <h3 className="text-sm font-bold mb-8 flex items-center gap-2" style={{ color: TH }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }}></span> Daily Cost Trend
                </h3>
                <div className="h-[300px] w-full">
                  {timeseriesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeseriesData}>
                        <defs>
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={L} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={L} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={LL} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: TM, fontSize: 10 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: TM, fontSize: 10 }} dx={-10} tickFormatter={(v) => `$${v}`} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} formatter={(v) => [`$${v}`, 'Cost']} />
                        <Area type="monotone" dataKey="cost" stroke={L} strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs font-medium" style={{ color: TM }}>No trend data recorded.</div>
                  )}
                </div>
              </div>

              {/* Optimization Section */}
              <div className="rounded-2xl p-6 border flex flex-col md:flex-row items-center gap-6" style={{ background: `${LL}40`, borderColor: LB }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-white" style={{ color: L }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h3 className="text-sm font-bold" style={{ color: TH }}>Usage Recommendation</h3>
                  </div>
                  <p className="text-xs" style={{ color: TM }}>Your heavy reliance on high-cost models detected. Switching background validation tasks to **Groq Llama 3** could reduce monthly burn by ~35%.</p>
                </div>
                <button className="whitespace-nowrap px-6 py-2.5 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-sm"
                  style={{ background: L }}>Apply Optimizations</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

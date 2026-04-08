'use client';
import { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

export default function CostPage() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [budgetLimit, setBudgetLimit] = useState(100);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  useEffect(() => {
    fetchTasks();
    // Load budget from localStorage
    const saved = localStorage.getItem('orchestr_budget_limit');
    if (saved) setBudgetLimit(parseFloat(saved));
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudget = () => {
    localStorage.setItem('orchestr_budget_limit', budgetLimit.toString());
    setShowBudgetForm(false);
  };

  // Calculate token usage and costs
  const calculateCosts = () => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    // Estimate tokens from workflow_steps and description
    const totalTokens = completedTasks.reduce((sum, task) => {
      const stepsLength = (task.workflow_steps || '').length;
      const descLength = (task.description || '').length;
      return sum + Math.floor((stepsLength + descLength) / 4); // ~4 chars per token
    }, 0);

    // Pricing (example rates - adjust based on actual LLM provider)
    const inputCostPer1k = 0.01; // $0.01 per 1k input tokens
    const outputCostPer1k = 0.03; // $0.03 per 1k output tokens
    
    // Assume 60% input, 40% output
    const inputTokens = Math.floor(totalTokens * 0.6);
    const outputTokens = Math.floor(totalTokens * 0.4);
    
    const inputCost = (inputTokens / 1000) * inputCostPer1k;
    const outputCost = (outputTokens / 1000) * outputCostPer1k;
    const totalCost = inputCost + outputCost;

    return {
      totalTokens,
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost,
      completedTasks: completedTasks.length,
      avgCostPerTask: completedTasks.length > 0 ? totalCost / completedTasks.length : 0,
    };
  };

  const costs = calculateCosts();
  const budgetUsagePercent = (costs.totalCost / budgetLimit) * 100;
  const isNearLimit = budgetUsagePercent > 80;
  const isOverBudget = budgetUsagePercent > 100;

  // Group tasks by month for breakdown
  const tasksByMonth = tasks.reduce((acc, task) => {
    if (task.status !== 'completed') return acc;
    const date = new Date(task.updated_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(task);
    return acc;
  }, {});

  // Generate daily cost data for the last 14 days
  const generateDailyCostData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const yearStr = date.getFullYear();
      const monthStr = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
      
      const dayTasks = tasks.filter(t => {
        if (t.status !== 'completed') return false;
        const tDate = new Date(t.updated_at);
        const tYear = tDate.getFullYear();
        const tMonth = String(tDate.getMonth() + 1).padStart(2, '0');
        const tDay = String(tDate.getDate()).padStart(2, '0');
        return `${tYear}-${tMonth}-${tDay}` === dateStr;
      });
      
      const dayCost = dayTasks.reduce((sum, task) => {
        const stepsLength = (task.workflow_steps || '').length;
        const descLength = (task.description || '').length;
        const tokens = Math.floor((stepsLength + descLength) / 4);
        const inputTokens = Math.floor(tokens * 0.6);
        const outputTokens = Math.floor(tokens * 0.4);
        const inputCost = (inputTokens / 1000) * 0.01;
        const outputCost = (outputTokens / 1000) * 0.03;
        return sum + inputCost + outputCost;
      }, 0);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cost: parseFloat(dayCost.toFixed(2)),
        tokens: dayTasks.reduce((sum, task) => {
          const tokens = Math.floor(((task.workflow_steps || '').length + (task.description || '').length) / 4);
          return sum + tokens;
        }, 0),
        fullDate: dateStr
      });
    }
    
    return data;
  };

  const dailyCostData = generateDailyCostData();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      <PageHeader 
        title="Cost Management" 
        description="Track LLM token usage and costs across all workflows."
        buttonText="Set Budget"
        buttonAction={() => setShowBudgetForm(true)}
      />

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-7xl mx-auto">

          {/* Budget Form Modal */}
          {showBudgetForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowBudgetForm(false)}>
              <div className="rounded-2xl p-6 max-w-md w-full"
                style={{ background: '#fff' }}
                onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4" style={{ color: TH }}>Set Monthly Budget</h3>
                <input 
                  type="number" 
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl text-sm mb-4"
                  style={{ border: `1.5px solid ${LB}`, color: TH }}
                  placeholder="Budget in USD"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={saveBudget}
                    className="flex-1 px-6 py-3 text-white font-semibold rounded-xl hover:opacity-85"
                    style={{ background: L }}>
                    Save Budget
                  </button>
                  <button 
                    onClick={() => setShowBudgetForm(false)}
                    className="px-6 py-3 font-semibold rounded-xl hover:opacity-85"
                    style={{ background: LL, color: L }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-20" style={{ color: TM }}>Loading cost data...</div>
          ) : (
            <>
              {/* Budget Alert */}
              {isOverBudget && (
                <div className="mb-6 p-4 rounded-2xl" style={{ background: '#fef2f2', border: `1.5px solid #fecaca` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#991b1b' }}>Budget Exceeded!</p>
                      <p className="text-xs" style={{ color: '#7f1d1d' }}>
                        You've spent ${costs.totalCost.toFixed(2)} of your ${budgetLimit.toFixed(2)} monthly budget.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isNearLimit && !isOverBudget && (
                <div className="mb-6 p-4 rounded-2xl" style={{ background: '#fffbeb', border: `1.5px solid #fcd34d` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#92400e' }}>Approaching Budget Limit</p>
                      <p className="text-xs" style={{ color: '#78350f' }}>
                        You've used {budgetUsagePercent.toFixed(1)}% of your monthly budget.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-2xl p-5" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: TM }}>Total Cost</p>
                  <p className="text-3xl font-bold" style={{ color: TH }}>${costs.totalCost.toFixed(2)}</p>
                  <p className="text-xs mt-1" style={{ color: TM }}>{costs.completedTasks} completed tasks</p>
                </div>

                <div className="rounded-2xl p-5" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: TM }}>Total Tokens</p>
                  <p className="text-3xl font-bold" style={{ color: TH }}>{costs.totalTokens.toLocaleString()}</p>
                  <p className="text-xs mt-1" style={{ color: TM }}>
                    {costs.inputTokens.toLocaleString()} in / {costs.outputTokens.toLocaleString()} out
                  </p>
                </div>

                <div className="rounded-2xl p-5" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: TM }}>Avg Cost/Task</p>
                  <p className="text-3xl font-bold" style={{ color: TH }}>${costs.avgCostPerTask.toFixed(3)}</p>
                  <p className="text-xs mt-1" style={{ color: TM }}>Per completed workflow</p>
                </div>

                <div className="rounded-2xl p-5" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: TM }}>Budget Remaining</p>
                  <p className="text-3xl font-bold" style={{ 
                    color: isOverBudget ? '#991b1b' : isNearLimit ? '#92400e' : '#065f46' 
                  }}>
                    ${Math.max(0, budgetLimit - costs.totalCost).toFixed(2)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: TM }}>
                    {budgetUsagePercent.toFixed(1)}% used
                  </p>
                </div>
              </div>

              {/* Budget Progress Bar */}
              <div className="rounded-2xl p-5 mb-6" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold" style={{ color: TH }}>Budget Usage</p>
                  <p className="text-xs" style={{ color: TM }}>
                    ${costs.totalCost.toFixed(2)} / ${budgetLimit.toFixed(2)}
                  </p>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                  <div 
                    className="h-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, budgetUsagePercent)}%`,
                      background: isOverBudget ? '#ef4444' : isNearLimit ? '#f59e0b' : L
                    }}
                  />
                </div>
              </div>

              {/* Daily Cost Chart */}
              {(() => {
                const maxCost = Math.max(...dailyCostData.map(d => d.cost || 0));
                const maxTokens = Math.max(...dailyCostData.map(d => d.tokens || 0));
                
                if (maxCost === 0 && maxTokens === 0) return null;

                const showCost = maxCost > 0;
                const chartTitle = showCost ? 'Daily API Cost (Last 14 Days)' : 'Daily Token Usage (Last 14 Days)';
                const dataKey = showCost ? 'cost' : 'tokens';
                const unit = showCost ? '$' : '';
                const precision = showCost ? 2 : 0;

                return (
                  <div className="rounded-2xl p-6 mb-6" style={{ background: '#fff', border: `1.5px solid ${LB}`, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                    <h3 className="text-sm font-bold mb-6 flex items-center gap-2" style={{ color: TH }}>
                      <svg className={`w-5 h-5 ${showCost ? 'text-emerald-500' : 'text-purple-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      {chartTitle}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyCostData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={LB} />
                        <XAxis 
                          dataKey="date" 
                          stroke={TM}
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke={TM}
                          style={{ fontSize: '12px' }}
                          label={{ value: showCost ? 'Cost ($)' : 'Tokens', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            background: '#fff', 
                            border: `1.5px solid ${LB}`,
                            borderRadius: '8px'
                          }}
                          formatter={(value) => `${unit}${value.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}`}
                          labelStyle={{ color: TH }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey={dataKey} 
                          stroke={L} 
                          strokeWidth={2}
                          dot={{ fill: L, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              {/* Cost Breakdown by Month */}
              <div className="rounded-2xl p-5 mb-6" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: TH }}>Monthly Breakdown</h3>
                {Object.keys(tasksByMonth).length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: TM }}>No completed tasks yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(tasksByMonth).reverse().map(([month, monthTasks]) => {
                      const monthTokens = monthTasks.reduce((sum, t) => {
                        return sum + Math.floor(((t.workflow_steps || '').length + (t.description || '').length) / 4);
                      }, 0);
                      const monthCost = (monthTokens / 1000) * 0.02; // Simplified calculation
                      
                      return (
                        <div key={month} className="flex items-center justify-between p-3 rounded-xl" 
                          style={{ background: '#fafafa', border: `1px solid ${LB}` }}>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: TH }}>{month}</p>
                            <p className="text-xs" style={{ color: TM }}>
                              {monthTasks.length} tasks • {monthTokens.toLocaleString()} tokens
                            </p>
                          </div>
                          <p className="text-sm font-bold" style={{ color: L }}>${monthCost.toFixed(2)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cost Optimization Tips */}
              <div className="rounded-2xl p-5" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: TH }}>💡 Cost Optimization Tips</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs">✓</span>
                    <p className="text-xs" style={{ color: TM }}>
                      Use shorter, more focused workflow descriptions to reduce token usage
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs">✓</span>
                    <p className="text-xs" style={{ color: TM }}>
                      Reuse agents with memory instead of creating new ones for similar tasks
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs">✓</span>
                    <p className="text-xs" style={{ color: TM }}>
                      Test workflows with dry runs before full execution
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs">✓</span>
                    <p className="text-xs" style={{ color: TM }}>
                      Consider using cheaper LLM models for simple tasks
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

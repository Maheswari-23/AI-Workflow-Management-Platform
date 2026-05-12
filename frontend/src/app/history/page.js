'use client';
import { useState, useEffect } from 'react';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

const statusStyle = {
  completed: { background: '#d1fae5', color: '#065f46' },
  failed:    { background: '#fee2e2', color: '#991b1b' },
  running:   { background: LL, color: L },
};

function formatDuration(ms) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history?limit=100');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = history.filter(r =>
    (r.task_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.id).includes(searchTerm) ||
    (r.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.trigger_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total:   history.length,
    success: history.filter(r => r.status === 'completed').length,
    failed:  history.filter(r => r.status === 'failed').length,
    running: history.filter(r => r.status === 'running').length,
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between" style={{ background: '#fff', borderBottom: `1.5px solid ${LB}` }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TH }}>Run History</h1>
          <p className="text-sm" style={{ color: TM }}>Real-time execution logs. Auto-refreshes every 10s.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchHistory} className="px-3 py-1.5 text-sm rounded-lg font-medium hover:opacity-85"
            style={{ background: LL, color: L, border: `1.5px solid ${LB}` }}>↻ Refresh</button>
          <div className="relative">
            <input type="text" placeholder="Filter by task, status, trigger..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm w-64 rounded-xl" style={{ border: `1.5px solid ${LB}`, background: '#fff', color: TH }} />
            <svg className="w-4 h-4 absolute left-3 top-2.5" style={{ color: L }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-7xl mx-auto">

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Runs',  value: stats.total,   color: L },
              { label: 'Successful',  value: stats.success, color: '#059669' },
              { label: 'Failed',      value: stats.failed,  color: '#dc2626' },
              { label: 'Running',     value: stats.running, color: '#d97706' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-5" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
                <div className="text-3xl font-extrabold mb-1" style={{ color: s.color }}>{s.value}</div>
                <div className="text-sm" style={{ color: TM }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            {/* Table */}
            <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr style={{ background: LL }}>
                      {['ID', 'Task', 'Trigger', 'Duration', 'Started', 'Logs', 'Status'].map(col => (
                        <th key={col} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: L }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan="7" className="px-5 py-10 text-center text-sm" style={{ color: TM }}>Loading history...</td></tr>
                    ) : filtered.length > 0 ? filtered.map(run => (
                      <tr key={run.id} onClick={() => setSelectedRun(run)}
                        className="cursor-pointer"
                        style={{ borderTop: `1px solid ${LB}`, background: selectedRun?.id === run.id ? LL : 'transparent' }}
                        onMouseEnter={e => { if (selectedRun?.id !== run.id) e.currentTarget.style.background = '#fdf8ff'; }}
                        onMouseLeave={e => { if (selectedRun?.id !== run.id) e.currentTarget.style.background = 'transparent'; }}>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: LL, color: L }}>#{run.id}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-sm font-semibold" style={{ color: TH }}>{run.task_name || '—'}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full uppercase font-medium" style={{ background: '#f3f4f6', color: '#4b5563' }}>{run.trigger_type}</span>
                        </td>
                        <td className="px-5 py-3 text-sm font-mono" style={{ color: TM }}>{formatDuration(run.duration_ms)}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: TM }}>
                          {run.started_at ? new Date(run.started_at + 'Z').toLocaleString() : '—'}
                        </td>
                        <td className="px-5 py-3">
                          <a href={`/api/history/${run.id}/download`} download onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:bg-purple-100 group"
                            style={{ color: L, border: `1.5px solid ${LB}`, background: '#fff' }}>
                            <span className="text-xs font-bold">View Logs</span>
                            <svg className="w-4 h-4 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </a>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${run.status === 'running' ? 'animate-pulse' : ''}`}
                            style={statusStyle[run.status] || { background: '#f3f4f6', color: '#6b7280' }}>
                            {run.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="7" className="px-5 py-14 text-center" style={{ color: TM }}>
                        {searchTerm ? `No records found for "${searchTerm}".` : 'No runs yet. Create a task and run it!'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1.5px solid ${LB}`, background: '#fdf8ff' }}>
                <span className="text-sm" style={{ color: TM }}>Showing {filtered.length} of {history.length} runs</span>
                <button onClick={fetchHistory} className="text-xs font-medium" style={{ color: L }}>Refresh</button>
              </div>
            </div>

            {/* Detail Panel */}
            {selectedRun && (
              <div className="w-96 rounded-2xl p-5 flex-shrink-0 flex flex-col" style={{ background: '#fff', border: `1.5px solid ${LB}`, maxHeight: '80vh' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm" style={{ color: TH }}>Run #{selectedRun.id} Details</h3>
                  <button onClick={() => setSelectedRun(null)} style={{ color: TM }} className="hover:text-red-500">✕</button>
                </div>
                
                <div className="mb-4 flex gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={statusStyle[selectedRun.status] || {}}>{selectedRun.status}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f3f4f6', color: '#4b5563' }}>{selectedRun.trigger_type}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: LL, color: L }}>{formatDuration(selectedRun.duration_ms)}</span>
                </div>

                <div className="flex gap-2 mb-4">
                  <a href={`/api/history/${selectedRun.id}/download`} download className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all hover:opacity-90"
                    style={{ background: L, color: '#fff' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download Logs
                  </a>
                  <button onClick={() => window.open(`/api/history/${selectedRun.id}/download`, '_blank')} className="px-3 py-2 text-xs font-bold rounded-xl transition-all hover:bg-gray-100"
                    style={{ border: `1.5px solid ${LB}`, color: L }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TM }}>Output Logs</span>
                    <button className="text-[10px] font-bold hover:underline" style={{ color: L }} 
                      onClick={() => {
                        const win = window.open('', '_blank');
                        win.document.write(`<pre style="font-family: monospace; padding: 20px;">${selectedRun.output || 'No logs'}</pre>`);
                        win.document.title = `Logs - Run #${selectedRun.id}`;
                      }}>
                      View Raw
                    </button>
                  </div>
                  
                  {selectedRun.error && (
                    <div className="mb-2 p-3 rounded-xl text-xs font-mono text-red-700 bg-red-50 border border-red-100">{selectedRun.error}</div>
                  )}
                  
                  <div className="flex-1 overflow-y-auto p-3 rounded-xl font-mono text-[11px] leading-relaxed shadow-inner" 
                    style={{ background: '#fafafa', color: TH, border: `1px solid ${LB}` }}>
                    {selectedRun.output ? (
                      selectedRun.output.split('\n').map((line, i) => (
                        <div key={i} className={line.startsWith('---') || line.startsWith('===') ? 'font-bold mt-2 text-purple-700' : ''}>
                          {line || ' '}
                        </div>
                      ))
                    ) : (
                      <span className="italic text-gray-400">No output recorded.</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-dashed flex flex-col gap-1" style={{ borderColor: LB }}>
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: TM }}>Started At</span>
                    <span style={{ color: TH }}>{new Date(selectedRun.started_at + 'Z').toLocaleString()}</span>
                  </div>
                  {selectedRun.completed_at && (
                    <div className="flex justify-between text-[10px]">
                      <span style={{ color: TM }}>Completed At</span>
                      <span style={{ color: TH }}>{new Date(selectedRun.completed_at + 'Z').toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: TM }}>Tokens</span>
                    <span style={{ color: TH }}>{selectedRun.prompt_tokens + selectedRun.completion_tokens}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

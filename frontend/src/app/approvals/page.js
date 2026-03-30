'use client';
import { useState, useEffect } from 'react';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

const statusStyle = {
  pending:  { background: '#fef3c7', color: '#92400e' },
  approved: { background: '#d1fae5', color: '#065f46' },
  rejected: { background: '#fee2e2', color: '#991b1b' },
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/approvals');
      const data = await res.json();
      setApprovals(data.approvals || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const decide = async (id, decision) => {
    setDeciding(true);
    try {
      await fetch(`/api/approvals/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, feedback }),
      });
      setFeedback('');
      setSelected(null);
      fetchApprovals();
    } catch (err) { console.error(err); }
    finally { setDeciding(false); }
  };

  const pending = approvals.filter(a => a.status === 'pending');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TH }}>Human-in-the-Loop Approvals</h1>
          <p className="text-sm mt-0.5" style={{ color: TM }}>
            Review and approve workflow steps before execution continues.
            {pending.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#fef3c7', color: '#92400e' }}>{pending.length} pending</span>}
          </p>
        </div>
        <button onClick={fetchApprovals} className="px-3 py-1.5 text-sm rounded-lg font-medium hover:opacity-85"
          style={{ background: LL, color: L, border: `1.5px solid ${LB}` }}>↻ Refresh</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-5xl mx-auto">

          {/* Pending approvals highlighted */}
          {pending.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl" style={{ background: '#fffbeb', border: '1.5px solid #fcd34d' }}>
              <p className="text-sm font-bold text-yellow-800 mb-3">⏸ {pending.length} workflow(s) waiting for your approval</p>
              <div className="space-y-3">
                {pending.map(a => (
                  <div key={a.id} className="p-4 rounded-xl" style={{ background: '#fff', border: '1.5px solid #fcd34d' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: TH }}>{a.task_name}</p>
                        <p className="text-xs mt-1" style={{ color: TM }}>{a.step_description}</p>
                        <pre className="text-xs mt-2 p-3 rounded-lg whitespace-pre-wrap font-mono max-h-32 overflow-y-auto"
                          style={{ background: '#fafafa', border: `1px solid ${LB}`, color: TH }}>
                          {a.agent_output?.slice(0, 600) || 'No output'}
                        </pre>
                        {selected?.id === a.id && (
                          <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                            placeholder="Optional feedback or instructions for the next agent..."
                            rows={2} className="w-full mt-2 px-3 py-2 rounded-lg text-sm"
                            style={{ border: `1.5px solid ${LB}`, color: TH, resize: 'none' }} />
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {selected?.id === a.id ? (
                          <>
                            <button onClick={() => decide(a.id, 'approved')} disabled={deciding}
                              className="px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
                              style={{ background: '#10b981' }}>✓ Approve</button>
                            <button onClick={() => decide(a.id, 'rejected')} disabled={deciding}
                              className="px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
                              style={{ background: '#ef4444' }}>✕ Reject</button>
                            <button onClick={() => setSelected(null)}
                              className="px-4 py-2 text-sm font-semibold rounded-xl hover:opacity-85"
                              style={{ background: LL, color: L }}>Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => { setSelected(a); setFeedback(''); }}
                            className="px-4 py-2 text-sm font-semibold rounded-xl hover:opacity-85"
                            style={{ background: L, color: '#fff' }}>Review</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All approvals table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
            <table className="min-w-full text-left">
              <thead>
                <tr style={{ background: LL }}>
                  {['ID', 'Task', 'Step', 'Status', 'Decision', 'Created'].map(col => (
                    <th key={col} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: L }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="px-5 py-10 text-center text-sm" style={{ color: TM }}>Loading...</td></tr>
                ) : approvals.length === 0 ? (
                  <tr><td colSpan="6" className="px-5 py-14 text-center" style={{ color: TM }}>No approvals yet. Run a multi-agent workflow to see approval gates here.</td></tr>
                ) : approvals.map(a => (
                  <tr key={a.id} style={{ borderTop: `1px solid ${LB}` }}>
                    <td className="px-5 py-3"><span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: LL, color: L }}>#{a.id}</span></td>
                    <td className="px-5 py-3 text-sm font-semibold" style={{ color: TH }}>{a.task_name}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: TM }}>{a.step_description?.slice(0, 50)}...</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={statusStyle[a.status] || {}}>{a.status}</span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: TM }}>{a.feedback || a.decision || '—'}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: TM }}>{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

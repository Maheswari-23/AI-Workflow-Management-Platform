'use client';
import { useState, useEffect } from 'react';
import AgentMainPanel from '../../components/AgentMainPanel';
import { toast, confirm } from '../../components/Toast';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => { fetchAgents(); }, []);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/agents');
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (data.agent) {
        setAgents(prev => [data.agent, ...prev]);
        setSelectedAgent(data.agent);
        setNewName('');
        setShowForm(false);
        toast.success(`Agent "${data.agent.name}" created!`);
      }
    } catch (err) { toast.error('Failed to create agent: ' + err.message); }
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    const ok = await confirm(`Delete agent "${name}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      setAgents(prev => prev.filter(a => a.id !== id));
      if (selectedAgent?.id === id) setSelectedAgent(null);
      toast.success('Agent deleted.');
    } catch (err) { toast.error('Delete failed: ' + err.message); }
  };

  const handleSaveAgent = async (id, updates) => {
    const res = await fetch(`/api/agents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.agent) {
      setSelectedAgent(data.agent);
      setAgents(prev => prev.map(a => a.id === id ? data.agent : a));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TH }}>Agents</h1>
          <p className="text-sm mt-0.5" style={{ color: TM }}>Create and configure AI agents with skills and system prompts.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85"
          style={{ background: L, boxShadow: `0 4px 12px rgba(181,123,238,0.3)` }}>
          + New Agent
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-7xl mx-auto">

          {showForm && (
            <div className="mb-5 p-4 rounded-2xl" style={{ background: '#fff', border: `1.5px solid ${L}` }}>
              <form onSubmit={handleCreate} className="flex gap-3 items-center">
                <input autoFocus type="text" placeholder="Agent name..." value={newName} onChange={e => setNewName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm" style={{ border: `1.5px solid ${LB}`, color: TH }} />
                <button type="submit" className="px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85" style={{ background: L }}>Create</button>
                <button type="button" onClick={() => { setShowForm(false); setNewName(''); }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl hover:opacity-85" style={{ background: LL, color: L }}>Cancel</button>
              </form>
            </div>
          )}

          {selectedAgent && (
            <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#fff', border: `1.5px solid ${L}` }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1.5px solid ${LB}`, background: LL }}>
                <span className="text-sm font-bold" style={{ color: L }}>Editing Agent: {selectedAgent.name}</span>
                <button onClick={() => setSelectedAgent(null)} style={{ color: TM }}>✕</button>
              </div>
              <AgentMainPanel
                selectedAgent={selectedAgent}
                onAgentUpdate={fetchAgents}
                onSaveAgent={handleSaveAgent}
              />
            </div>
          )}

          <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
            <table className="min-w-full text-left">
              <thead>
                <tr style={{ background: LL }}>
                  {['Name', 'Status', 'System Prompt', 'Actions'].map(col => (
                    <th key={col} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: L }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="4" className="px-5 py-10 text-center text-sm" style={{ color: TM }}>Loading agents...</td></tr>
                ) : agents.length === 0 ? (
                  <tr><td colSpan="4" className="px-5 py-14 text-center" style={{ color: TM }}>No agents yet. Click "+ New Agent" to create one.</td></tr>
                ) : agents.map(agent => (
                  <tr key={agent.id} onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                    className="cursor-pointer"
                    style={{ borderTop: `1px solid ${LB}`, background: selectedAgent?.id === agent.id ? LL : 'transparent' }}
                    onMouseEnter={e => { if (selectedAgent?.id !== agent.id) e.currentTarget.style.background = '#fdf8ff'; }}
                    onMouseLeave={e => { if (selectedAgent?.id !== agent.id) e.currentTarget.style.background = 'transparent'; }}>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold" style={{ color: TH }}>{agent.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                        <span className="text-xs capitalize" style={{ color: TM }}>{agent.status || 'offline'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: TM, maxWidth: '300px' }}>
                      <span className="truncate block">{agent.system_prompt ? agent.system_prompt.slice(0, 60) + '...' : '—'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={(e) => handleDelete(agent.id, agent.name, e)}
                        className="text-xs px-3 py-1 rounded-lg hover:opacity-80"
                        style={{ background: '#fee2e2', color: '#991b1b' }}>Delete</button>
                    </td>
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

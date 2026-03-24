'use client';
import { useState } from 'react';

const L = '#b57bee';
const LL = '#f3e8ff';
const LB = '#e9d5ff';
const TH = '#1e0a35';
const TM = '#9b87ba';


export default function AgentsSidebar({ agents, selectedAgent, onAgentSelect, onAgentCreate, onAgentDelete, isLoading }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAgentCreate({ name });
    setName('');
    setShowForm(false);
  };

  return (
    <div className="w-80 flex flex-col" style={{ background: '#fff', borderRight: `1.5px solid ${LB}` }}>
      <div className="p-5" style={{ borderBottom: `1px solid ${LB}` }}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: TH }}>Agents</h2>
          <button onClick={() => setShowForm(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold hover:scale-110 transition-transform text-white"
            style={{ background: L, boxShadow: `0 2px 8px rgba(181,123,238,0.4)` }}>+</button>
        </div>
      </div>

      {showForm && (
        <div className="p-4" style={{ background: '#fdf8ff', borderBottom: `1px solid ${LB}` }}>
          <form onSubmit={handleCreate}>
            <input type="text" placeholder="Agent name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded-lg mb-2 text-sm" style={{ border: `1.5px solid ${LB}`, background: '#fff', color: TH }} autoFocus />
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1.5 text-white rounded-lg text-sm font-medium hover:opacity-90" style={{ background: L }}>Create</button>
              <button type="button" onClick={() => { setShowForm(false); setName(''); }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: LL, color: L }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="p-4 text-center text-sm" style={{ color: TM }}>Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: LL }}>
              <svg className="w-5 h-5" style={{ color: L }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-xs" style={{ color: TM }}>No agents yet. Click + to create one.</p>
          </div>
        ) : agents.map((agent) => (
          <div key={agent.id} onClick={() => onAgentSelect(agent)}
            className="p-3 rounded-xl cursor-pointer mb-1.5 transition-all duration-150 relative group"
            style={selectedAgent?.id === agent.id
              ? { background: LL, border: `1.5px solid ${L}` }
              : { background: '#fafafa', border: '1.5px solid transparent' }}
            onMouseEnter={(e) => { if (selectedAgent?.id !== agent.id) { e.currentTarget.style.background = '#f9f5ff'; e.currentTarget.style.borderColor = LB; }}}
            onMouseLeave={(e) => { if (selectedAgent?.id !== agent.id) { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = 'transparent'; }}}>
            <h3 className="font-medium text-sm pr-6" style={{ color: TH }}>{agent.name}</h3>
            <div className="flex items-center mt-1">
              <span className={`w-2 h-2 rounded-full mr-2 ${agent.status === 'online' ? 'bg-green-400' : 'bg-gray-300'}`}></span>
              <span className="text-xs capitalize" style={{ color: TM }}>{agent.status}</span>
            </div>
            {onAgentDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onAgentDelete(agent.id); }}
                className="absolute top-3 right-3 w-6 h-6 rounded-full items-center justify-center text-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hidden group-hover:flex hover:scale-125 select-none"
                style={{ color: TM }}
                title="Double click to delete"
              >⋮</button>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}

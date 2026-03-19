'use client';
import { useState } from 'react';

const L = '#b57bee';
const LL = '#f3e8ff';
const LB = '#e9d5ff';
const TH = '#1e0a35';
const TM = '#9b87ba';

const navLinks = [
  { href: '/', label: 'Dashboard', bold: true, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
  { href: '/tasks', label: 'Tasks Management', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
  { href: '/tools', label: 'Tools Management', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
  { href: '/scheduler', label: 'Task Scheduler', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { href: '/history', label: 'Run History', border: true, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { href: '/settings/llms', label: 'LLM Settings', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
];

export default function AgentsSidebar({ agents, selectedAgent, onAgentSelect, onAgentCreate, isLoading }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAgentCreate({ id: Date.now(), name, status: 'offline', skillFile: null, systemPrompt: '' });
    setName('');
    setShowForm(false);
  };

  return (
    <div className="w-80 flex flex-col" style={{ background: '#fff', borderRight: `1.5px solid ${LB}` }}>
      {/* Brand */}
      <div className="p-5" style={{ borderBottom: `1px solid ${LB}` }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: LL }}>
            <svg className="w-5 h-5" style={{ color: L }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <span className="font-bold text-sm" style={{ color: TH }}>AI Workflow Platform</span>
        </div>
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
            className="p-3 rounded-xl cursor-pointer mb-1.5 transition-all duration-150"
            style={selectedAgent?.id === agent.id
              ? { background: LL, border: `1.5px solid ${L}` }
              : { background: '#fafafa', border: '1.5px solid transparent' }}
            onMouseEnter={(e) => { if (selectedAgent?.id !== agent.id) { e.currentTarget.style.background = '#f9f5ff'; e.currentTarget.style.borderColor = LB; }}}
            onMouseLeave={(e) => { if (selectedAgent?.id !== agent.id) { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = 'transparent'; }}}>
            <h3 className="font-medium text-sm" style={{ color: TH }}>{agent.name}</h3>
            <div className="flex items-center mt-1">
              <span className={`w-2 h-2 rounded-full mr-2 ${agent.status === 'online' ? 'bg-green-400' : 'bg-gray-300'}`}></span>
              <span className="text-xs capitalize" style={{ color: TM }}>{agent.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4" style={{ borderTop: `1.5px solid ${LB}` }}>
        {navLinks.map((link) => (
          <a key={link.href} href={link.href}
            className={`flex items-center text-sm mb-2 transition-colors ${link.border ? 'pb-2 mb-3' : ''}`}
            style={{ color: link.bold ? L : TM, fontWeight: link.bold ? '600' : '400', borderBottom: link.border ? `1px solid ${LB}` : 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = L; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = link.bold ? L : TM; }}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">{link.icon}</svg>
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

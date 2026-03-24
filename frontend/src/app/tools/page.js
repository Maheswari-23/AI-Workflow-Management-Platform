'use client';
import { useState, useEffect } from 'react';
import ToolsMainPanel from '../../components/ToolsMainPanel';
import { toast, confirm } from '../../components/Toast';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

export default function ToolsPage() {
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => { fetchTools(); }, []);

  const fetchTools = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/tools');
      const data = await res.json();
      setTools(data.tools || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, type: 'api' }),
      });
      const data = await res.json();
      if (data.tool) {
        setTools(prev => [data.tool, ...prev]);
        setSelectedTool(data.tool);
        setNewName('');
        setShowForm(false);
        toast.success(`Tool "${data.tool.name}" created!`);
      }
    } catch (err) { toast.error('Failed to create tool: ' + err.message); }
  };

  const handleToolSave = (updatedTool) => {
    setTools(prev => prev.map(t => t.id === updatedTool.id ? updatedTool : t));
    setSelectedTool(updatedTool);
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    const ok = await confirm(`Delete tool "${name}"?`);
    if (!ok) return;
    try {
      await fetch(`/api/tools/${id}`, { method: 'DELETE' });
      setTools(prev => prev.filter(t => t.id !== id));
      if (selectedTool?.id === id) setSelectedTool(null);
      toast.success('Tool deleted.');
    } catch (err) { toast.error('Delete failed: ' + err.message); }
  };

  const typeColor = {
    api:      { bg: LL, color: L },
    script:   { bg: '#fef3c7', color: '#92400e' },
    database: { bg: '#d1fae5', color: '#065f46' },
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TH }}>Tools Registry</h1>
          <p className="text-sm mt-0.5" style={{ color: TM }}>View and manage registered enterprise capabilities available to your agents.</p>
        </div>
        {/* + New Tool hidden for User Persona Demo */}
        {/* 
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85"
          style={{ background: L, boxShadow: `0 4px 12px rgba(181,123,238,0.3)` }}>
          + New Tool
        </button>
        */}
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-7xl mx-auto">

          {showForm && (
            <div className="mb-5 p-4 rounded-2xl" style={{ background: '#fff', border: `1.5px solid ${L}` }}>
              <form onSubmit={handleCreate} className="flex gap-3 items-center">
                <input autoFocus type="text" placeholder="Tool name..." value={newName} onChange={e => setNewName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm" style={{ border: `1.5px solid ${LB}`, color: TH }} />
                <button type="submit" className="px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85" style={{ background: L }}>Create</button>
                <button type="button" onClick={() => { setShowForm(false); setNewName(''); }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl hover:opacity-85" style={{ background: LL, color: L }}>Cancel</button>
              </form>
            </div>
          )}

          {selectedTool && (
            <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#fff', border: `1.5px solid ${L}` }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1.5px solid ${LB}`, background: LL }}>
                <span className="text-sm font-bold" style={{ color: L }}>Editing Tool: {selectedTool.name}</span>
                <button onClick={() => setSelectedTool(null)} style={{ color: TM }}>✕</button>
              </div>
              <ToolsMainPanel selectedTool={selectedTool} onSave={handleToolSave} />
            </div>
          )}

          <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
            <table className="min-w-full text-left">
              <thead>
                <tr style={{ background: LL }}>
                  {['Name', 'Type', 'Description'].map(col => (
                    <th key={col} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: L }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="3" className="px-5 py-10 text-center text-sm" style={{ color: TM }}>Loading tools...</td></tr>
                ) : tools.length === 0 ? (
                  <tr><td colSpan="3" className="px-5 py-14 text-center" style={{ color: TM }}>No tools yet. Select agents to see available skills.</td></tr>
                ) : tools.map(tool => (
                  <tr key={tool.id} onClick={() => setSelectedTool(selectedTool?.id === tool.id ? null : tool)}
                    className="cursor-pointer"
                    style={{ borderTop: `1px solid ${LB}`, background: selectedTool?.id === tool.id ? LL : 'transparent' }}
                    onMouseEnter={e => { if (selectedTool?.id !== tool.id) e.currentTarget.style.background = '#fdf8ff'; }}
                    onMouseLeave={e => { if (selectedTool?.id !== tool.id) e.currentTarget.style.background = 'transparent'; }}>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold" style={{ color: TH }}>{tool.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium uppercase"
                        style={typeColor[tool.type] || { background: '#f3f4f6', color: '#6b7280' }}>
                        {tool.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: TM }}>
                      {tool.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail Panel moved up */}
        </div>
      </div>
    </div>
  );
}

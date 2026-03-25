'use client';
import { useState, useEffect } from 'react';
import ToolsMainPanel from '../../components/ToolsMainPanel';
import PageHeader from '../../components/PageHeader';
import { toast, confirm } from '../../components/Toast';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

export default function ToolsPage() {
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => { fetchTools(); }, []);

  const fetchTools = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/tools');
      const data = await res.json();
      const fetchedTools = data.tools || [];
      setTools(fetchedTools);
      
      // Auto-expand all groups on initial load
      const initialExpanded = {};
      const types = [...new Set(fetchedTools.map(t => t.type || 'unknown'))];
      types.forEach(t => initialExpanded[t] = true);
      setExpandedGroups(initialExpanded);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const toggleGroup = (type) => setExpandedGroups(p => ({ ...p, [type]: !p[type] }));

  const groupedTools = tools.reduce((acc, tool) => {
    const type = tool.type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(tool);
    return acc;
  }, {});

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
    fs:       { bg: '#e0f2fe', color: '#0369a1' },
    browser:  { bg: '#e0e7ff', color: '#4338ca' },
    code:     { bg: '#fef08a', color: '#b45309' },
    memory:   { bg: '#fae8ff', color: '#a21caf' },
    document: { bg: '#fce7f3', color: '#be185d' },
    system:   { bg: '#f3f4f6', color: '#4b5563' },
    agent:    { bg: '#ffedd5', color: '#b45309' },
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      <PageHeader 
        title="Tools Registry" 
        description="View and manage registered enterprise capabilities available to your agents."
      />

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

          <div className="space-y-4 mb-6">
            {isLoading ? (
              <div className="p-10 text-center text-sm" style={{ color: TM, background: '#fff', borderRadius: '16px', border: `1.5px solid ${LB}` }}>Loading tools...</div>
            ) : tools.length === 0 ? (
              <div className="p-14 text-center" style={{ color: TM, background: '#fff', borderRadius: '16px', border: `1.5px solid ${LB}` }}>No tools yet.</div>
            ) : Object.entries(groupedTools).map(([type, typeTools]) => (
              <div key={type} className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(type)}
                  className="w-full px-5 py-4 flex items-center justify-between font-bold uppercase tracking-wider text-xs"
                  style={{ background: LL, color: L, transition: 'background 0.2s', borderBottom: expandedGroups[type] ? `1.5px solid ${LB}` : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-3 py-1 rounded-lg text-xs font-extrabold shadow-sm" 
                      style={typeColor[type] || { background: '#f3f4f6', color: '#6b7280' }}
                    >
                      {type}
                    </span>
                    <span style={{ color: TM, fontWeight: 600 }}>{typeTools.length} Tool{typeTools.length !== 1 && 's'}</span>
                  </div>
                  <span style={{ transform: expandedGroups[type] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                </button>
                
                {/* Accordion Body */}
                {expandedGroups[type] && (
                  <table className="min-w-full text-left">
                    <thead>
                      <tr style={{ background: '#fafafa' }}>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: TM, width: '25%' }}>Name</th>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: TM }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeTools.map(tool => (
                        <tr key={tool.id} onClick={() => setSelectedTool(selectedTool?.id === tool.id ? null : tool)}
                          className="cursor-pointer transition-colors"
                          style={{ borderTop: `1px solid ${LB}`, background: selectedTool?.id === tool.id ? LL : 'transparent' }}
                          onMouseEnter={e => { if (selectedTool?.id !== tool.id) e.currentTarget.style.background = '#fdf8ff'; }}
                          onMouseLeave={e => { if (selectedTool?.id !== tool.id) e.currentTarget.style.background = 'transparent'; }}>
                          <td className="px-5 py-4">
                            <span className="text-sm font-bold" style={{ color: TH }}>{tool.name}</span>
                          </td>
                          <td className="px-5 py-4 text-xs font-medium" style={{ color: TM, lineHeight: '1.4' }}>
                            {tool.description || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>

          {/* Detail Panel moved up */}
        </div>
      </div>
    </div>
  );
}

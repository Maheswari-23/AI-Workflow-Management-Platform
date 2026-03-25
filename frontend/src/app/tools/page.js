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

          <div className="space-y-8 mb-6">
            {isLoading ? (
              <div className="p-10 text-center text-sm" style={{ color: TM, background: '#fff', borderRadius: '16px', border: `1.5px solid ${LB}` }}>Loading tools...</div>
            ) : tools.length === 0 ? (
              <div className="p-14 text-center" style={{ color: TM, background: '#fff', borderRadius: '16px', border: `1.5px solid ${LB}` }}>No tools yet.</div>
            ) : Object.entries(groupedTools).map(([type, typeTools]) => (
              <div key={type} className="flex flex-col">
                {/* Minimal Section Header */}
                <div 
                  className="flex justify-between items-center pb-2 mb-4 border-b transition-colors cursor-pointer select-none group"
                  style={{ borderColor: expandedGroups[type] ? LB : '#f3f4f6' }}
                  onClick={() => toggleGroup(type)}
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-extrabold uppercase tracking-widest" style={{ color: TH }}>{type}</h2>
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold" 
                      style={{ background: LL, color: L, border: `1px solid ${LB}` }}
                    >
                      {typeTools.length}
                    </span>
                  </div>
                  <span 
                    className="text-xs transition-transform duration-200" 
                    style={{ color: TM, transform: expandedGroups[type] ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    ▼
                  </span>
                </div>
                
                {/* Modern Card Grid */}
                {expandedGroups[type] && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeTools.map(tool => (
                      <div 
                        key={tool.id} 
                        onClick={() => setSelectedTool(selectedTool?.id === tool.id ? null : tool)}
                        className="rounded-2xl p-5 cursor-pointer transition-all duration-300"
                        style={{
                          background: selectedTool?.id === tool.id ? '#fbf8ff' : '#fff',
                          border: `1.5px solid ${selectedTool?.id === tool.id ? L : LB}`,
                          boxShadow: selectedTool?.id === tool.id ? `0 4px 14px rgba(181,123,238,0.2)` : 'none',
                          transform: selectedTool?.id === tool.id ? 'translateY(-2px)' : 'none'
                        }}
                      >
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="text-sm font-bold truncate leading-tight" style={{ color: TH }} title={tool.name}>
                            {tool.name}
                          </h3>
                          <span 
                            className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0" 
                            style={{ background: '#fafafa', color: TM, border: `1px solid #e5e7eb` }}
                          >
                            {tool.method}
                          </span>
                        </div>
                        <p className="text-xs mt-1 webkit-line-clamp-2 line-clamp-2" style={{ color: TM, lineHeight: '1.6' }}>
                          {tool.description || 'No description provided.'}
                        </p>
                      </div>
                    ))}
                  </div>
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

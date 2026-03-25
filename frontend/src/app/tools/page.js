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
      const fetched = data.tools || [];
      setTools(fetched);
      const init = {};
      [...new Set(fetched.map(t => t.type || 'other'))].forEach(t => init[t] = true);
      setExpandedGroups(init);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const toggleGroup = (type) => setExpandedGroups(p => ({ ...p, [type]: !p[type] }));

  const groupedTools = tools.reduce((acc, tool) => {
    const type = tool.type || 'other';
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

  // Tool type icons for a nice touch
  const typeIcon = {
    fs: '📁', api: '🌐', browser: '🔍', code: '💻',
    database: '🗄️', memory: '🧠', document: '📄',
    system: '⚙️', agent: '🤖', script: '📜', other: '🔧',
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      <PageHeader
        title="Tools Registry"
        description="View and manage registered enterprise capabilities available to your agents."
      />

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-5xl mx-auto">

          {/* New Tool Form */}
          {showForm && (
            <div className="mb-6 p-4 rounded-2xl" style={{ background: '#fff', border: `1.5px solid ${L}` }}>
              <form onSubmit={handleCreate} className="flex gap-3 items-center">
                <input autoFocus type="text" placeholder="Tool name..." value={newName} onChange={e => setNewName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm" style={{ border: `1.5px solid ${LB}`, color: TH, outline: 'none' }} />
                <button type="submit" className="px-4 py-2 text-white text-sm font-semibold rounded-xl" style={{ background: L }}>Create</button>
                <button type="button" onClick={() => { setShowForm(false); setNewName(''); }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl" style={{ background: LL, color: L }}>Cancel</button>
              </form>
            </div>
          )}

          {/* Edit Panel */}
          {selectedTool && (
            <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#fff', border: `1.5px solid ${L}` }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1.5px solid ${LB}`, background: LL }}>
                <span className="text-sm font-bold" style={{ color: L }}>Editing: {selectedTool.name}</span>
                <button onClick={() => setSelectedTool(null)} style={{ color: TM, fontSize: '16px' }}>✕</button>
              </div>
              <ToolsMainPanel selectedTool={selectedTool} onSave={handleToolSave} />
            </div>
          )}

          {/* Tool Groups */}
          {isLoading ? (
            <div className="p-12 text-center text-sm rounded-2xl" style={{ background: '#fff', border: `1.5px solid ${LB}`, color: TM }}>
              Loading tools...
            </div>
          ) : tools.length === 0 ? (
            <div className="p-12 text-center rounded-2xl" style={{ background: '#fff', border: `1.5px solid ${LB}`, color: TM }}>
              No tools registered yet.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedTools).map(([type, typeTools]) => (
                <div key={type} className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>

                  {/* Group Header — full width, clean stripe */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(type)}
                    className="w-full flex items-center justify-between px-5 py-3.5"
                    style={{ background: '#fff', borderBottom: expandedGroups[type] ? `1px solid ${LB}` : 'none' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{typeIcon[type] || '🔧'}</span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                        style={{ background: LL, color: L }}
                      >
                        {type}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: TM }}>
                        {typeTools.length} tool{typeTools.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: TM, transform: expandedGroups[type] ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
                  </button>

                  {/* Tool Cards Grid */}
                  {expandedGroups[type] && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {typeTools.map(tool => (
                        <div
                          key={tool.id}
                          onClick={() => setSelectedTool(selectedTool?.id === tool.id ? null : tool)}
                          className="rounded-xl p-4 cursor-pointer"
                          style={{
                            background: selectedTool?.id === tool.id ? LL : '#fafafa',
                            border: `1.5px solid ${selectedTool?.id === tool.id ? L : '#ede9f5'}`,
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => { if (selectedTool?.id !== tool.id) e.currentTarget.style.border = `1.5px solid ${LB}`; }}
                          onMouseLeave={e => { if (selectedTool?.id !== tool.id) e.currentTarget.style.border = `1.5px solid #ede9f5`; }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <p className="text-sm font-bold leading-snug" style={{ color: TH }}>{tool.name}</p>
                            {tool.method && (
                              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0"
                                style={{ background: '#fff', color: TM, border: `1px solid ${LB}` }}>
                                {tool.method}
                              </span>
                            )}
                          </div>
                          <p className="text-xs line-clamp-2" style={{ color: TM, lineHeight: '1.6' }}>
                            {tool.description || 'No description provided.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

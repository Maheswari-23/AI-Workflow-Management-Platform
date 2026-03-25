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

  // Tool type SVG icons
  const typeIcon = {
    fs:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>,
    api:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>,
    browser:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
    code:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    database: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
    memory:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 8v4l3 3"/></svg>,
    document: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    system:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 014.93 19.07M19.07 19.07A10 10 0 014.93 4.93"/></svg>,
    agent:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="7" r="4"/></svg>,
    script:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
    other:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/></svg>,
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
                      <span
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                        style={{ background: LL, color: L }}
                      >
                        {typeIcon[type] || typeIcon.other}
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

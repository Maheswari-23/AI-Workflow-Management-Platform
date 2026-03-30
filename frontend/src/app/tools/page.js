'use client';
import { useState, useEffect } from 'react';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

export default function ToolsPage() {
  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedTool, setSelectedTool] = useState(null);

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

  const typeIcon = {
    fs:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>,
    api:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>,
    browser:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
    system:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 014.93 19.07M19.07 19.07A10 10 0 014.93 4.93"/></svg>,
    ai:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M8 12h8M12 8v8"/></svg>,
    database: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
    other:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/></svg>,
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      <div className="px-6 py-4" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <h1 className="text-2xl font-bold" style={{ color: TH }}>Tools Library</h1>
        <p className="text-sm mt-0.5" style={{ color: TM }}>{tools.length} built-in tools available to all agents. Click any tool to see its details.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-5xl mx-auto">

          {/* Tool detail popup */}
          {selectedTool && (
            <div className="mb-6 p-5 rounded-2xl" style={{ background: '#fff', border: `1.5px solid ${L}` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold" style={{ color: TH }}>{selectedTool.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium uppercase" style={{ background: LL, color: L }}>{selectedTool.type}</span>
                </div>
                <button onClick={() => setSelectedTool(null)} style={{ color: TM }}>✕</button>
              </div>
              <p className="text-sm mb-3" style={{ color: TH }}>{selectedTool.description}</p>
              {selectedTool.endpoint && (
                <p className="text-xs font-mono px-3 py-2 rounded-lg" style={{ background: '#fafafa', color: TM, border: `1px solid ${LB}` }}>
                  {selectedTool.method} {selectedTool.endpoint}
                </p>
              )}
              <p className="text-xs mt-3" style={{ color: TM }}>
                Built-in tool — automatically available to all agents when active.
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="p-12 text-center text-sm rounded-2xl" style={{ background: '#fff', border: `1.5px solid ${LB}`, color: TM }}>Loading tools...</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedTools).map(([type, typeTools]) => (
                <div key={type} className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
                  <button type="button" onClick={() => toggleGroup(type)}
                    className="w-full flex items-center justify-between px-5 py-3.5"
                    style={{ background: '#fff', borderBottom: expandedGroups[type] ? `1px solid ${LB}` : 'none' }}>
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide" style={{ background: LL, color: L }}>
                        {typeIcon[type] || typeIcon.other}{type}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: TM }}>{typeTools.length} tool{typeTools.length !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-xs" style={{ color: TM, transform: expandedGroups[type] ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
                  </button>

                  {expandedGroups[type] && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {typeTools.map(tool => (
                        <div key={tool.id} onClick={() => setSelectedTool(selectedTool?.id === tool.id ? null : tool)}
                          className="rounded-xl p-4 cursor-pointer"
                          style={{ background: selectedTool?.id === tool.id ? LL : '#fafafa', border: `1.5px solid ${selectedTool?.id === tool.id ? L : '#ede9f5'}`, transition: 'all 0.15s' }}
                          onMouseEnter={e => { if (selectedTool?.id !== tool.id) e.currentTarget.style.border = `1.5px solid ${LB}`; }}
                          onMouseLeave={e => { if (selectedTool?.id !== tool.id) e.currentTarget.style.border = `1.5px solid #ede9f5`; }}>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <p className="text-sm font-bold leading-snug" style={{ color: TH }}>{tool.name}</p>
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0"
                              style={{ background: '#fff', color: TM, border: `1px solid ${LB}` }}>built-in</span>
                          </div>
                          <p className="text-xs line-clamp-2" style={{ color: TM, lineHeight: '1.6' }}>{tool.description}</p>
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

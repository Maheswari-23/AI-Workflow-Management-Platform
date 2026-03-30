'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

const NODE_TYPES = {
  start:    { label: 'Start',    color: '#10b981', bg: '#d1fae5' },
  agent:    { label: 'Agent',    color: L,         bg: LL },
  approval: { label: 'Approval', color: '#f59e0b', bg: '#fef3c7' },
  end:      { label: 'End',      color: '#6b7280', bg: '#f3f4f6' },
};

function Node({ node, agents, selected, onSelect, onDrag, onDelete }) {
  const typeInfo = NODE_TYPES[node.type] || NODE_TYPES.agent;
  const dragStart = useRef(null);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    onSelect(node.id);
    dragStart.current = { mx: e.clientX, my: e.clientY, nx: node.x, ny: node.y };

    const onMove = (me) => {
      const dx = me.clientX - dragStart.current.mx;
      const dy = me.clientY - dragStart.current.my;
      onDrag(node.id, dragStart.current.nx + dx, dragStart.current.ny + dy);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const agentName = node.agentId ? agents.find(a => String(a.id) === String(node.agentId))?.name : null;

  return (
    <div onMouseDown={handleMouseDown}
      style={{
        position: 'absolute', left: node.x, top: node.y,
        width: 160, cursor: 'grab', userSelect: 'none',
        background: typeInfo.bg, border: `2px solid ${selected ? typeInfo.color : LB}`,
        borderRadius: 12, padding: '10px 14px',
        boxShadow: selected ? `0 0 0 3px ${typeInfo.color}33` : '0 2px 8px rgba(0,0,0,0.08)',
      }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: typeInfo.color }}>{typeInfo.label}</span>
        <button onMouseDown={e => { e.stopPropagation(); onDelete(node.id); }}
          className="text-xs hover:opacity-70" style={{ color: TM }}>✕</button>
      </div>
      <p className="text-sm font-semibold truncate" style={{ color: TH }}>{node.label}</p>
      {agentName && <p className="text-xs mt-0.5 truncate" style={{ color: TM }}>{agentName}</p>}
    </div>
  );
}

function Edges({ nodes, edges }) {
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={L} />
        </marker>
      </defs>
      {edges.map((edge, i) => {
        const src = nodes.find(n => n.id === edge.source);
        const tgt = nodes.find(n => n.id === edge.target);
        if (!src || !tgt) return null;
        const x1 = src.x + 80, y1 = src.y + 40;
        const x2 = tgt.x + 80, y2 = tgt.y + 40;
        const cx = (x1 + x2) / 2;
        return (
          <path key={i} d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
            fill="none" stroke={L} strokeWidth="2" markerEnd="url(#arrow)" opacity="0.7" />
        );
      })}
    </svg>
  );
}

export default function CanvasPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [agents, setAgents] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [connecting, setConnecting] = useState(null); // source node id
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(d => setTasks(d.tasks || []));
    fetch('/api/agents').then(r => r.json()).then(d => setAgents(d.agents || []));
  }, []);

  useEffect(() => {
    if (!selectedTaskId) return;
    fetch(`/api/canvas/${selectedTaskId}`)
      .then(r => r.json())
      .then(d => {
        setNodes((d.nodes || []).map(n => ({ id: n.node_id, type: n.type, label: n.label, agentId: n.agent_id, x: n.position_x, y: n.position_y })));
        setEdges((d.edges || []).map(e => ({ source: e.source_node_id, target: e.target_node_id })));
        setSelectedNode(null);
      });
  }, [selectedTaskId]);

  const addNode = (type) => {
    const id = `node_${Date.now()}`;
    const label = type === 'start' ? 'Start' : type === 'end' ? 'End' : type === 'approval' ? 'Approval Gate' : 'New Agent';
    setNodes(prev => [...prev, { id, type, label, agentId: null, x: 100 + Math.random() * 200, y: 100 + Math.random() * 150 }]);
  };

  const updateNode = (id, updates) => setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  const deleteNode = (id) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
    if (selectedNode === id) setSelectedNode(null);
  };

  const handleNodeClick = (id) => {
    if (connecting) {
      if (connecting !== id) {
        const exists = edges.find(e => e.source === connecting && e.target === id);
        if (!exists) setEdges(prev => [...prev, { source: connecting, target: id }]);
      }
      setConnecting(null);
    } else {
      setSelectedNode(id === selectedNode ? null : id);
    }
  };

  const save = async () => {
    if (!selectedTaskId) return;
    setIsSaving(true);
    try {
      await fetch(`/api/canvas/${selectedTaskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.map(n => ({ id: n.id, type: n.type, label: n.label, agentId: n.agentId, position: { x: n.x, y: n.y } })),
          edges,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setIsSaving(false); }
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-4 flex-wrap" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: TH }}>Visual Workflow Canvas</h1>
          <p className="text-sm mt-0.5" style={{ color: TM }}>Drag nodes, connect them, and build visual agent pipelines.</p>
        </div>
        <select value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm" style={{ border: `1.5px solid ${LB}`, color: TH, minWidth: 180 }}>
          <option value="">Select a task...</option>
          {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="flex gap-2">
          {Object.entries(NODE_TYPES).map(([type, info]) => (
            <button key={type} onClick={() => addNode(type)} disabled={!selectedTaskId}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg hover:opacity-85 disabled:opacity-40"
              style={{ background: info.bg, color: info.color, border: `1.5px solid ${info.color}44` }}>
              + {info.label}
            </button>
          ))}
        </div>
        {connecting && (
          <span className="text-xs px-3 py-1.5 rounded-lg font-medium animate-pulse" style={{ background: '#fef3c7', color: '#92400e' }}>
            Click another node to connect...
          </span>
        )}
        <button onClick={save} disabled={isSaving || !selectedTaskId}
          className="px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
          style={{ background: saved ? '#10b981' : L }}>
          {saved ? '✓ Saved' : isSaving ? 'Saving...' : 'Save Canvas'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div ref={canvasRef} className="flex-1 relative overflow-hidden"
          style={{ background: '#fafafa', backgroundImage: 'radial-gradient(circle, #e9d5ff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          onClick={() => { if (!connecting) setSelectedNode(null); }}>
          {!selectedTaskId && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm" style={{ color: TM }}>Select a task to start building its visual workflow</p>
            </div>
          )}
          <Edges nodes={nodes} edges={edges} />
          {nodes.map(node => (
            <Node key={node.id} node={node} agents={agents}
              selected={selectedNode === node.id || connecting === node.id}
              onSelect={handleNodeClick}
              onDrag={(id, x, y) => updateNode(id, { x, y })}
              onDelete={deleteNode} />
          ))}
        </div>

        {/* Properties panel */}
        {selectedNodeData && (
          <div className="w-64 flex-shrink-0 overflow-y-auto p-4" style={{ borderLeft: `1.5px solid ${LB}`, background: '#fff' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: L }}>Node Properties</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: TM }}>Label</label>
                <input value={selectedNodeData.label} onChange={e => updateNode(selectedNodeData.id, { label: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: `1.5px solid ${LB}`, color: TH }} />
              </div>
              {selectedNodeData.type === 'agent' && (
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: TM }}>Assign Agent</label>
                  <select value={selectedNodeData.agentId || ''} onChange={e => updateNode(selectedNodeData.id, { agentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: `1.5px solid ${LB}`, color: TH }}>
                    <option value="">None</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <button onClick={() => setConnecting(selectedNodeData.id)}
                className="w-full px-3 py-2 text-sm font-semibold rounded-lg hover:opacity-85"
                style={{ background: LL, color: L, border: `1.5px solid ${LB}` }}>
                → Connect to node
              </button>
              <button onClick={() => deleteNode(selectedNodeData.id)}
                className="w-full px-3 py-2 text-sm font-semibold rounded-lg hover:opacity-85"
                style={{ background: '#fee2e2', color: '#991b1b' }}>
                Delete Node
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

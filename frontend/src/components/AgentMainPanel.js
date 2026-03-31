'use client';
import { useState, useRef, useEffect } from 'react';
import DashboardContent from './DashboardContent';
import { toast } from './Toast';

const L = '#b57bee', LL = '#f3e8ff', LB = '#e9d5ff', TH = '#1e0a35', TM = '#9b87ba';
const card = { background: '#fff', border: `1.5px solid ${LB}`, borderRadius: '16px', padding: '20px' };
const inp = { width: '100%', padding: '10px 14px', border: `1.5px solid ${LB}`, borderRadius: '10px', background: '#fff', color: TH, fontSize: '14px', resize: 'none' };

export default function AgentMainPanel({ selectedAgent, onAgentUpdate, onSaveAgent }) {
  const [skillFile, setSkillFile] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState(selectedAgent?.system_prompt || '');
  const [samplePrompt, setSamplePrompt] = useState('');
  const [executionResult, setExecutionResult] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isDryRun, setIsDryRun] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  const [memory, setMemory] = useState([]);
  const [memorySearch, setMemorySearch] = useState('');
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryValue, setNewMemoryValue] = useState('');
  const fileInputRef = useRef(null);

  // Sync system prompt when a new agent is selected
  useEffect(() => {
    setSystemPrompt(selectedAgent?.system_prompt || '');
    setActiveTab('config');
    if (selectedAgent?.id) fetchMemory(selectedAgent.id);
  }, [selectedAgent?.id]);

  const fetchMemory = async (agentId) => {
    try {
      const url = memorySearch 
        ? `/api/memory/${agentId}?search=${encodeURIComponent(memorySearch)}`
        : `/api/memory/${agentId}`;
      const res = await fetch(url);
      const data = await res.json();
      setMemory(data.memory || []);
    } catch (err) { console.error(err); }
  };

  const clearMemory = async () => {
    if (!confirm('Clear all memory for this agent?')) return;
    await fetch(`/api/memory/${selectedAgent.id}`, { method: 'DELETE' });
    setMemory([]);
  };

  const deleteMemoryKey = async (key) => {
    await fetch(`/api/memory/${selectedAgent.id}/${encodeURIComponent(key)}`, { method: 'DELETE' });
    setMemory(prev => prev.filter(m => m.key !== key));
  };

  const addMemory = async () => {
    if (!newMemoryKey.trim() || !newMemoryValue.trim()) return;
    try {
      await fetch(`/api/memory/${selectedAgent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newMemoryKey, value: newMemoryValue }),
      });
      await fetchMemory(selectedAgent.id);
      setNewMemoryKey('');
      setNewMemoryValue('');
      setShowAddMemory(false);
      toast.success('Memory added!');
    } catch (err) {
      toast.error('Failed to add memory: ' + err.message);
    }
  };

  const handleSkillFileUpload = (e) => {
    const file = e.target.files[0];
    file?.name.endsWith('.md') ? setSkillFile(file) : alert('Please upload a .md file');
  };

  const checkAvailability = async () => {
    if (!selectedAgent) return;
    try {
      const r = await fetch(`/api/agents/${selectedAgent.id}/status`);
      const d = await r.json();
      toast.info(`Agent "${d.name}" is ${d.status}`);
    } catch {
      toast.error('Error checking availability');
    }
  };

  const handleSavePrompt = async () => {
    if (!selectedAgent || !onSaveAgent) return;
    setIsSaving(true);
    try {
      await onSaveAgent(selectedAgent.id, { system_prompt: systemPrompt });
      toast.success('System prompt saved!');
    } catch (err) {
      toast.error('Error saving: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDryRun = async () => {
    if (!samplePrompt.trim()) { toast.info('Enter a sample prompt first'); return; }
    setIsDryRun(true);
    setExecutionResult('🧪 Dry Run started — sending prompt to AI...');
    try {
      const r = await fetch(`/api/agents/${selectedAgent.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: samplePrompt,
          systemPrompt: `[DRY RUN MODE] You are in a safe simulation. Proceed with the request using your available tools to show the user how you would handle this. Do not hesitate to emit tool calls.\n\n${systemPrompt}`,
          skillFile: skillFile?.name,
        }),
      });
      const d = await r.json();
      setExecutionResult(`🧪 DRY RUN RESULT:\n\n${d.result || 'No response from AI.'}`);
    } catch (err) {
      setExecutionResult('Dry Run Error: ' + err.message);
    } finally {
      setIsDryRun(false);
    }
  };

  const handleExecute = async () => {
    if (!samplePrompt.trim()) { toast.info('Enter a sample prompt first'); return; }
    setIsExecuting(true);
    setExecutionResult('Executing...');
    try {
      const r = await fetch(`/api/agents/${selectedAgent.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: samplePrompt, systemPrompt, skillFile: skillFile?.name }),
      });
      const d = await r.json();
      setExecutionResult(d.result || 'Execution completed.');
    } catch (err) {
      setExecutionResult('Error: ' + err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  if (!selectedAgent) return <DashboardContent />;

  return (
    <div className="flex-1 flex flex-col" style={{ background: '#fff' }}>
      <div className="p-6" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <h1 className="text-2xl font-bold" style={{ color: TH }}>{selectedAgent.name}</h1>
        <div className="flex items-center mt-2">
          <span className={`w-2.5 h-2.5 rounded-full mr-2 ${selectedAgent.status === 'online' ? 'bg-green-400' : 'bg-gray-300'}`}></span>
          <span className="text-sm capitalize" style={{ color: TM }}>{selectedAgent.status}</span>
          <button onClick={checkAvailability} className="ml-4 px-4 py-1.5 text-white text-sm rounded-lg hover:opacity-85 transition-opacity"
            style={{ background: L, boxShadow: `0 2px 8px rgba(181,123,238,0.35)` }}>Check Availability</button>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {['config', 'test', 'memory'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 text-sm font-semibold rounded-lg capitalize"
              style={activeTab === tab ? { background: L, color: '#fff' } : { background: LL, color: L }}>
              {tab === 'memory' ? `Memory (${memory.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto" style={{ background: '#fafafa' }}>
        <div className="max-w-4xl mx-auto space-y-5">

          {activeTab === 'config' && (<>
            <div style={card}>
              <h3 className="text-sm font-bold mb-3" style={{ color: TH }}>Skill File (.md)</h3>
              <input type="file" ref={fileInputRef} onChange={handleSkillFileUpload} accept=".md" className="hidden" />
              <div className="flex items-center gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm rounded-lg font-medium hover:opacity-80"
                  style={{ background: LL, color: L, border: `1.5px solid ${LB}` }}>Upload Skill File</button>
                {skillFile && <span className="text-sm font-medium text-green-600">✓ {skillFile.name}</span>}
              </div>
            </div>
            <div style={card}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold" style={{ color: TH }}>System Instructions</h3>
                <button onClick={handleSavePrompt} disabled={isSaving}
                  className="px-3 py-1 text-xs font-semibold text-white rounded-lg hover:opacity-85 disabled:opacity-50"
                  style={{ background: L }}>
                  {isSaving ? 'Saving...' : 'Save Prompt'}
                </button>
              </div>
              <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter system instructions for this agent..." rows={4} style={inp} />
            </div>
          </>)}

          {activeTab === 'test' && (
            <div style={card}>
              <h3 className="text-sm font-bold mb-4" style={{ color: TH }}>Test Execution</h3>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: TM }}>Sample Prompt</label>
              <textarea value={samplePrompt} onChange={(e) => setSamplePrompt(e.target.value)}
                placeholder="Enter a sample prompt to test the agent..." rows={3} style={{ ...inp, marginBottom: '16px' }} />
              <div className="flex gap-3 mb-4">
                <button onClick={handleDryRun} disabled={isDryRun || isExecuting}
                  className="px-4 py-2 text-sm rounded-lg font-medium hover:opacity-85 disabled:opacity-50"
                  style={{ background: LL, color: L, border: `1.5px solid ${LB}` }}>
                  {isDryRun ? 'Running...' : 'Dry Run'}
                </button>
                <button onClick={handleExecute} disabled={isExecuting || isDryRun}
                  className="px-4 py-2 text-white text-sm rounded-lg font-medium hover:opacity-85 disabled:opacity-50"
                  style={{ background: L, boxShadow: `0 2px 8px rgba(181,123,238,0.3)` }}>
                  {isExecuting ? 'Executing...' : 'Execute'}
                </button>
              </div>
              {executionResult && (
                <div className="rounded-xl p-4" style={{ background: '#fafafa', border: `1.5px solid ${LB}` }}>
                  <h4 className="text-xs font-bold mb-2" style={{ color: L }}>Result:</h4>
                  <pre className="text-sm whitespace-pre-wrap font-mono" style={{ color: TH }}>{executionResult}</pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'memory' && (
            <div style={card}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold" style={{ color: TH }}>Long-Term Memory</h3>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddMemory(!showAddMemory)} 
                    className="text-xs px-3 py-1 rounded-lg hover:opacity-80 font-semibold"
                    style={{ background: LL, color: L, border: `1px solid ${LB}` }}>
                    + Add Memory
                  </button>
                  {memory.length > 0 && (
                    <button onClick={clearMemory} className="text-xs px-3 py-1 rounded-lg hover:opacity-80"
                      style={{ background: '#fee2e2', color: '#991b1b' }}>Clear All</button>
                  )}
                </div>
              </div>

              {/* Add Memory Form */}
              {showAddMemory && (
                <div className="mb-4 p-4 rounded-xl" style={{ background: '#fafafa', border: `1.5px solid ${LB}` }}>
                  <input 
                    type="text" 
                    placeholder="Memory key (e.g., user_preference, last_topic)..."
                    value={newMemoryKey}
                    onChange={(e) => setNewMemoryKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm mb-2"
                    style={{ border: `1.5px solid ${LB}`, color: TH }}
                  />
                  <textarea 
                    placeholder="Memory value..."
                    value={newMemoryValue}
                    onChange={(e) => setNewMemoryValue(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg text-sm mb-2"
                    style={{ border: `1.5px solid ${LB}`, color: TH, resize: 'vertical' }}
                  />
                  <div className="flex gap-2">
                    <button onClick={addMemory} 
                      className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-85"
                      style={{ background: L }}>
                      Save Memory
                    </button>
                    <button onClick={() => { setShowAddMemory(false); setNewMemoryKey(''); setNewMemoryValue(''); }}
                      className="px-4 py-2 text-sm font-semibold rounded-lg hover:opacity-85"
                      style={{ background: LL, color: L }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Search Bar */}
              {memory.length > 0 && (
                <div className="mb-4 relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: TM }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search memory..."
                    value={memorySearch}
                    onChange={(e) => { setMemorySearch(e.target.value); fetchMemory(selectedAgent.id); }}
                    className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                    style={{ border: `1.5px solid ${LB}`, color: TH }}
                  />
                  {memorySearch && (
                    <button
                      onClick={() => { setMemorySearch(''); fetchMemory(selectedAgent.id); }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm hover:opacity-70"
                      style={{ color: TM }}>
                      ✕
                    </button>
                  )}
                </div>
              )}

              {memory.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: TM }}>
                  {memorySearch ? 'No memory found matching your search.' : 'No memory yet. Run this agent on a task or add memory manually.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {memory.map(m => (
                    <div key={m.id} className="p-3 rounded-xl flex items-start gap-3" style={{ background: '#fafafa', border: `1px solid ${LB}` }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono font-bold truncate" style={{ color: L }}>{m.key}</p>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: TH }}>{m.value}</p>
                        <p className="text-xs mt-1" style={{ color: TM }}>{new Date(m.updated_at).toLocaleString()}</p>
                      </div>
                      <button onClick={() => deleteMemoryKey(m.key)} className="text-xs hover:opacity-70 flex-shrink-0" style={{ color: TM }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

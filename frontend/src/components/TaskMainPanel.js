'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardContent from './DashboardContent';
import { toast } from './Toast';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';
const card={background:'#fff',border:`1.5px solid ${LB}`,borderRadius:'16px',padding:'20px'};
const inp={width:'100%',padding:'10px 14px',border:`1.5px solid ${LB}`,borderRadius:'10px',background:'#fff',color:TH,fontSize:'14px'};
const lbl={display:'block',fontSize:'13px',fontWeight:'600',marginBottom:'8px',color:'#4a3b66'};

export default function TaskMainPanel({ selectedTask, onTaskUpdate }) {
  const [formData, setFormData] = useState({ name:'', description:'', agents:[], workflow_steps:'' });
  const [availableAgents, setAvailableAgents] = useState([]);
  const [versions, setVersions] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState('');
  const [runStatus, setRunStatus] = useState(null); // null | 'running' | 'completed' | 'failed' | 'retrying' | 'awaiting_approval'
  const [runStage, setRunStage] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [approvalFeedback, setApprovalFeedback] = useState('');
  const [isDeciding, setIsDeciding] = useState(false);
  const elapsedRef = useRef(null);
  const outputRef = useRef(null);

  // Load available agents from DB
  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(d => setAvailableAgents(d.agents || []))
      .catch(e => console.error('Failed to load agents:', e));
  }, []);

  // Sync form when selected task changes
  useEffect(() => {
    if (selectedTask) {
      setFormData({
        name: selectedTask.name || '',
        description: selectedTask.description || '',
        agents: selectedTask.agents || [],
        workflow_steps: selectedTask.workflow_steps || '',
      });
      setRunOutput('');
      setRunStatus(null);
      setRunStage('');
      setElapsed(0);
      setPendingApproval(null);
      setApprovalFeedback('');
    }
  }, [selectedTask]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (!isSaving && selectedTask) {
        handleSave();
        toast.success('Keyboard shortcut: Ctrl+S');
      }
    }
    // Ctrl+Enter or Cmd+Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isRunning && formData.workflow_steps && selectedTask) {
        handleRun();
        toast.success('Keyboard shortcut: Ctrl+Enter');
      }
    }
    // Esc to close modals
    if (e.key === 'Escape') {
      if (showVersions) setShowVersions(false);
      if (pendingApproval) {
        setPendingApproval(null);
        setApprovalFeedback('');
      }
    }
  }, [isSaving, isRunning, formData.workflow_steps, selectedTask, showVersions, pendingApproval]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const toggleAgent = (id) => setFormData(p => ({
    ...p,
    agents: p.agents.includes(id) ? p.agents.filter(a => a !== id) : [...p.agents, id],
  }));

  const loadVersions = async () => {
    const res = await fetch(`/api/tasks/${selectedTask.id}/versions`);
    const data = await res.json();
    setVersions(data.versions || []);
    setShowVersions(true);
  };

  const restoreVersion = async (versionId) => {
    if (!confirm('Restore this version? Current changes will be overwritten.')) return;
    const res = await fetch(`/api/tasks/${selectedTask.id}/restore/${versionId}`, { method: 'POST' });
    const data = await res.json();
    if (data.task) { onTaskUpdate(data.task); setShowVersions(false); toast.success('Version restored!'); }
  };

  const handleGenerate = async () => {
    if (!formData.description) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/generate-steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: formData.description }),
      });
      const data = await res.json();
      if (data.steps) {
        setFormData(p => ({ ...p, workflow_steps: data.steps }));
        toast.success('Workflow steps generated!');
      } else {
        toast.error('Error generating steps: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          agents: formData.agents,
          workflow_steps: formData.workflow_steps,
          status: 'saved',
        }),
      });
      const data = await res.json();
      if (data.task) {
        onTaskUpdate(data.task);
        toast.success('Task saved successfully!');
      }
    } catch (err) {
      toast.error('Error saving: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprovalDecision = async (decision) => {
    if (!pendingApproval) return;
    setIsDeciding(true);
    try {
      await fetch(`/api/approvals/${pendingApproval.id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, feedback: approvalFeedback }),
      });
      toast.success(`Workflow ${decision}!`);
      setPendingApproval(null);
      setApprovalFeedback('');
      if (decision === 'rejected') {
        setRunStatus('failed');
        setRunStage('Rejected by user');
        clearInterval(elapsedRef.current);
        setIsRunning(false);
      }
    } catch (err) {
      toast.error('Failed to submit decision: ' + err.message);
    } finally {
      setIsDeciding(false);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setRunOutput('');
    setRunStatus('running');
    setRunStage('Starting workflow...');
    setElapsed(0);

    const startTime = Date.now();
    elapsedRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const finish = (status, stage) => {
      clearInterval(elapsedRef.current);
      setRunStatus(status);
      setRunStage(stage);
      setIsRunning(false);
    };

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/run`, { method: 'POST' });
      const data = await res.json();
      if (!data.runId) {
        setRunOutput('Error: ' + (data.error || 'Failed to start'));
        finish('failed', 'Failed to start');
        return;
      }

      const runId = data.runId;
      setRunStage('Workflow running...');

      // Poll every 1.5s — show output as it grows in the DB
      let lastLength = 0;
      const poll = setInterval(async () => {
        try {
          const r = await fetch(`/api/tasks/${selectedTask.id}/run/${runId}/output`);
          const d = await r.json();

          if (d.output && d.output.length > lastLength) {
            lastLength = d.output.length;
            setRunOutput(d.output);
            setTimeout(() => { outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
            // Detect stage
            if (d.output.includes('-> [') || d.output.includes('Tool call')) setRunStage('Calling tools...');
            else if (d.output.includes('Agent:') || d.output.includes('Handing off')) setRunStage('Agent executing...');
            else if (d.output.includes('Approval')) setRunStage('Waiting for approval...');
            else if (d.output.includes('Retrying')) setRunStage('Retrying...');
            else if (d.output.includes('Final Report') || d.output.includes('Output:')) setRunStage('Generating output...');
          }

          // Check for awaiting_approval status
          if (d.status === 'awaiting_approval') {
            setRunStatus('awaiting_approval');
            setRunStage('⏸ Waiting for your approval');
            // Fetch pending approval for this run
            const approvalRes = await fetch('/api/approvals/pending');
            const approvalData = await approvalRes.json();
            const approval = approvalData.approvals?.find(a => a.run_id === runId && a.status === 'pending');
            if (approval && !pendingApproval) {
              setPendingApproval(approval);
              toast.success('Approval required! Review the output below.', 10000);
            }
          } else if (d.status === 'running') {
            // If status changed back to running (after approval), clear approval state
            if (runStatus === 'awaiting_approval') {
              setPendingApproval(null);
              setRunStatus('running');
              setRunStage('Workflow continuing...');
            }
          } else if (d.status === 'completed') {
            clearInterval(poll);
            setRunOutput(d.output || 'Completed.');
            finish('completed', 'Completed');
            onTaskUpdate({ ...selectedTask, status: 'completed' });
            setPendingApproval(null);
          } else if (d.status === 'failed') {
            clearInterval(poll);
            setRunOutput(d.output || d.error || 'Run failed.');
            finish('failed', 'Failed');
            setPendingApproval(null);
          }
        } catch(e) {}
      }, 1500);

      setTimeout(() => { clearInterval(poll); finish('failed', 'Timed out'); }, 600000);

    } catch (err) {
      setRunOutput('Error: ' + err.message);
      finish('failed', 'Error');
    }
  };

  if (!selectedTask) return <DashboardContent />;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto" style={{ background: '#fafafa' }}>
      <div className="p-6" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: TH }}>Edit Task Configuration</h1>
            <p className="text-sm mt-1" style={{ color: TM }}>Define task parameters, assign agents, and generate workflow steps.</p>
          </div>
          <button onClick={loadVersions} className="text-xs px-3 py-1.5 rounded-lg font-medium hover:opacity-80"
            style={{ background: LL, color: L, border: `1px solid ${LB}` }}>
            Version History
          </button>
        </div>
      </div>
      <div className="p-6 max-w-4xl mx-auto w-full space-y-5">
        {/* Version History Panel */}
        {showVersions && (
          <div style={card}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: TH }}>Version History</h3>
              <button onClick={() => setShowVersions(false)} style={{ color: TM }}>✕</button>
            </div>
            {versions.length === 0 ? (
              <p className="text-sm" style={{ color: TM }}>No versions saved yet. Save the task to create a version.</p>
            ) : versions.map(v => (
              <div key={v.id} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${LB}` }}>
                <div>
                  <span className="text-sm font-medium" style={{ color: TH }}>Version {v.version_number}</span>
                  <span className="text-xs ml-2" style={{ color: TM }}>{new Date(v.created_at).toLocaleString()}</span>
                </div>
                <button onClick={() => restoreVersion(v.id)} className="text-xs px-3 py-1 rounded-lg hover:opacity-80"
                  style={{ background: LL, color: L }}>Restore</button>
              </div>
            ))}
          </div>
        )}

        <div style={card}><label style={lbl}>Task Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} style={inp} /></div>
        <div style={card}><label style={lbl}>Description</label><textarea name="description" rows="4" value={formData.description} onChange={handleChange} placeholder="Describe what this task should accomplish..." style={{ ...inp, resize: 'vertical' }} /></div>
        
        {/* Agent Assignment */}
        <div style={card}>
          <label style={lbl}>Assign Agents {availableAgents.length === 0 && <span style={{ color: TM, fontWeight: 400 }}>(Create agents first)</span>}</label>
          {availableAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableAgents.map(a => (
                <label key={a.id} className="flex items-center p-3 rounded-xl cursor-pointer transition-all"
                  style={formData.agents.includes(String(a.id)) ? { background: LL, border: `1.5px solid ${L}` } : { background: '#fafafa', border: `1.5px solid ${LB}` }}>
                  <input type="checkbox" checked={formData.agents.includes(String(a.id))} onChange={() => toggleAgent(String(a.id))}
                    className="w-4 h-4 mr-3" style={{ accentColor: L }} />
                  <div>
                    <span className="block text-sm font-medium" style={{ color: TH }}>{a.name}</span>
                    <span className="block text-xs capitalize" style={{ color: TM }}>{a.status}</span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: TM }}>No agents created yet. Create agents in the <a href="/agents" style={{ color: L }}>Agents section</a>.</p>
          )}
        </div>

        {/* Workflow Steps */}
        <div style={card}>
          <button type="button" onClick={handleGenerate} disabled={!formData.description || isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-85 disabled:opacity-50 mb-4"
            style={{ background: L, boxShadow: `0 4px 12px rgba(181,123,238,0.3)` }}>
            {isGenerating ? (<><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating...</>) : 'Generate Workflow Steps (AI)'}
          </button>
          <label style={lbl}>Workflow Steps</label>
          <textarea name="workflow_steps" rows="6" value={formData.workflow_steps} onChange={handleChange}
            placeholder="Workflow steps appear here after AI generation, or type manually..."
            style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px', background: '#fafafa' }} />
        </div>

        {/* Run Status Bar + Live Output */}
        {runStatus && (
          <div style={{ ...card, padding: 0, overflow: 'hidden', border: `1.5px solid ${
            runStatus === 'completed' ? '#86efac' :
            runStatus === 'failed' ? '#fecaca' :
            runStatus === 'awaiting_approval' ? '#fcd34d' :
            runStatus === 'retrying' ? '#fcd34d' : LB
          }` }}>
            {/* Status header */}
            <div className="px-5 py-3 flex items-center justify-between" style={{
              background: runStatus === 'completed' ? '#f0fdf4' : 
                         runStatus === 'failed' ? '#fef2f2' : 
                         runStatus === 'awaiting_approval' ? '#fffbeb' :
                         runStatus === 'retrying' ? '#fffbeb' : LL
            }}>
              <div className="flex items-center gap-3">
                {/* Animated icon */}
                {runStatus === 'running' || runStatus === 'retrying' ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" style={{ color: L }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : runStatus === 'awaiting_approval' ? (
                  <span className="text-yellow-600 text-base animate-pulse">⏸</span>
                ) : runStatus === 'completed' ? (
                  <span className="text-green-600 text-base">✓</span>
                ) : (
                  <span className="text-red-500 text-base">✕</span>
                )}
                <div>
                  <p className="text-xs font-bold" style={{
                    color: runStatus === 'completed' ? '#065f46' : 
                           runStatus === 'failed' ? '#991b1b' : 
                           runStatus === 'awaiting_approval' ? '#92400e' :
                           runStatus === 'retrying' ? '#92400e' : L
                  }}>{runStage}</p>
                  <p className="text-xs" style={{ color: TM }}>Elapsed: {elapsed}s</p>
                </div>
              </div>
              {/* Animated progress bar for running state */}
              {(runStatus === 'running' || runStatus === 'retrying') && (
                <div className="flex-1 mx-4 h-1.5 rounded-full overflow-hidden" style={{ background: LB }}>
                  <div className="h-full rounded-full animate-pulse" style={{
                    background: `linear-gradient(90deg, ${L}, #d8b4fe)`,
                    width: '60%',
                    animation: 'progress-slide 1.5s ease-in-out infinite',
                  }}/>
                </div>
              )}
              {runStatus === 'completed' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#d1fae5', color: '#065f46' }}>Done in {elapsed}s</span>
              )}
              {runStatus === 'failed' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#fee2e2', color: '#991b1b' }}>Failed</span>
              )}
              {runStatus === 'awaiting_approval' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse" style={{ background: '#fef3c7', color: '#92400e' }}>Approval Required</span>
              )}
            </div>

            {/* Approval Modal Inline */}
            {pendingApproval && runStatus === 'awaiting_approval' && (
              <div className="px-5 py-4" style={{ background: '#fffbeb', borderTop: '1.5px solid #fcd34d', borderBottom: '1.5px solid #fcd34d' }}>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold mb-2" style={{ color: '#92400e' }}>
                      🔔 Approval Required: {pendingApproval.step_description}
                    </p>
                    <p className="text-xs mb-3" style={{ color: '#78350f' }}>
                      Review the agent output below and decide whether to continue or reject this workflow.
                    </p>
                    <textarea 
                      value={approvalFeedback} 
                      onChange={e => setApprovalFeedback(e.target.value)}
                      placeholder="Optional: Add feedback or instructions for the next step..."
                      rows={2} 
                      className="w-full px-3 py-2 rounded-lg text-sm mb-3"
                      style={{ border: '1.5px solid #fcd34d', background: '#fff', color: TH, resize: 'none' }} 
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprovalDecision('approved')} 
                        disabled={isDeciding}
                        className="px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
                        style={{ background: '#10b981' }}>
                        {isDeciding ? 'Processing...' : '✓ Approve & Continue'}
                      </button>
                      <button 
                        onClick={() => handleApprovalDecision('rejected')} 
                        disabled={isDeciding}
                        className="px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
                        style={{ background: '#ef4444' }}>
                        {isDeciding ? 'Processing...' : '✕ Reject & Stop'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live log output */}
            <div ref={outputRef} className="overflow-y-auto p-4" style={{ maxHeight: '320px', background: '#0f0f0f' }}>
              <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed" style={{ color: '#e2e8f0' }}>
                {runOutput || ' '}
              </pre>
            </div>
          </div>
        )}

        <style>{`
          @keyframes progress-slide {
            0% { transform: translateX(-100%); width: 40%; }
            50% { width: 70%; }
            100% { transform: translateX(200%); width: 40%; }
          }
        `}</style>

        <div className="flex flex-wrap gap-4 pb-6">
          <button type="button" onClick={handleSave} disabled={isSaving}
            className="flex-1 md:flex-none px-6 py-3 text-white font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
            style={{ background: L, boxShadow: `0 4px 12px rgba(181,123,238,0.3)` }}
            title="Keyboard shortcut: Ctrl+S">
            {isSaving ? 'Saving...' : 'Save Task'}
          </button>
          <button type="button" onClick={handleRun} disabled={isRunning || !formData.workflow_steps}
            className="flex-1 md:flex-none px-6 py-3 font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
            style={{ background: LL, color: L, border: `1.5px solid ${LB}` }}
            title="Keyboard shortcut: Ctrl+Enter">
            {isRunning ? 'Running...' : '▶ Run Workflow'}
          </button>
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-center pb-4" style={{ color: TM }}>
          💡 Tip: Press <kbd className="px-2 py-1 rounded" style={{ background: LL, color: L, border: `1px solid ${LB}` }}>Ctrl+S</kbd> to save, 
          <kbd className="px-2 py-1 rounded ml-1" style={{ background: LL, color: L, border: `1px solid ${LB}` }}>Ctrl+Enter</kbd> to run, 
          <kbd className="px-2 py-1 rounded ml-1" style={{ background: LL, color: L, border: `1px solid ${LB}` }}>Esc</kbd> to close modals
        </div>
      </div>
    </div>
  );
}

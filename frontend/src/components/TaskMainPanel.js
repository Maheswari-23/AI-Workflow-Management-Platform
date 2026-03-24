'use client';
import { useState, useEffect } from 'react';
import DashboardContent from './DashboardContent';
import { toast } from './Toast';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';
const card={background:'#fff',border:`1.5px solid ${LB}`,borderRadius:'16px',padding:'20px'};
const inp={width:'100%',padding:'10px 14px',border:`1.5px solid ${LB}`,borderRadius:'10px',background:'#fff',color:TH,fontSize:'14px'};
const lbl={display:'block',fontSize:'13px',fontWeight:'600',marginBottom:'8px',color:'#4a3b66'};

export default function TaskMainPanel({ selectedTask, onTaskUpdate }) {
  const [formData, setFormData] = useState({ name:'', description:'', agents:[], workflow_steps:'' });
  const [availableAgents, setAvailableAgents] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState('');

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
    }
  }, [selectedTask]);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const toggleAgent = (id) => setFormData(p => ({
    ...p,
    agents: p.agents.includes(id) ? p.agents.filter(a => a !== id) : [...p.agents, id],
  }));

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

  const handleRun = async () => {
    setIsRunning(true);
    setRunOutput('Starting workflow run...');
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/run`, { method: 'POST' });
      const data = await res.json();
      if (data.run) {
        setRunOutput(data.run.output || 'Run completed.');
        onTaskUpdate({ ...selectedTask, status: 'completed' });
      } else {
        setRunOutput('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setRunOutput('Error: ' + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  if (!selectedTask) return <DashboardContent />;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto" style={{ background: '#fafafa' }}>
      <div className="p-6" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <h1 className="text-2xl font-bold" style={{ color: TH }}>Edit Task Configuration</h1>
        <p className="text-sm mt-1" style={{ color: TM }}>Define task parameters, assign agents, and generate workflow steps.</p>
      </div>
      <div className="p-6 max-w-4xl mx-auto w-full space-y-5">
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
            {isGenerating ? (<><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating...</>) : '✨ Generate Workflow Steps (AI)'}
          </button>
          <label style={lbl}>Workflow Steps</label>
          <textarea name="workflow_steps" rows="6" value={formData.workflow_steps} onChange={handleChange}
            placeholder="Workflow steps appear here after AI generation, or type manually..."
            style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px', background: '#fafafa' }} />
        </div>

        {/* Run Output */}
        {runOutput && (
          <div style={{ ...card, background: '#f0fdf4', border: `1.5px solid #86efac` }}>
            <h4 className="text-xs font-bold mb-2 text-green-700">Workflow Run Output:</h4>
            <pre className="text-sm whitespace-pre-wrap font-mono text-green-900">{runOutput}</pre>
          </div>
        )}

        <div className="flex flex-wrap gap-4 pb-6">
          <button type="button" onClick={handleSave} disabled={isSaving}
            className="flex-1 md:flex-none px-6 py-3 text-white font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
            style={{ background: L, boxShadow: `0 4px 12px rgba(181,123,238,0.3)` }}>
            {isSaving ? 'Saving...' : 'Save Task'}
          </button>
          <button type="button" onClick={handleRun} disabled={isRunning || !formData.workflow_steps}
            className="flex-1 md:flex-none px-6 py-3 font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
            style={{ background: LL, color: L, border: `1.5px solid ${LB}` }}>
            {isRunning ? 'Running...' : '▶ Run Workflow'}
          </button>
        </div>
      </div>
    </div>
  );
}

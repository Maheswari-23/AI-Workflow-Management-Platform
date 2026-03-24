'use client';
import { useState, useEffect } from 'react';
import DashboardContent from './DashboardContent';
import { toast } from './Toast';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';
const card={background:'#fff',border:`1.5px solid ${LB}`,borderRadius:'16px',padding:'20px'};
const inp={width:'100%',padding:'10px 14px',border:`1.5px solid ${LB}`,borderRadius:'10px',background:'#fff',color:TH,fontSize:'14px'};
const lbl={display:'block',fontSize:'13px',fontWeight:'600',marginBottom:'8px',color:'#4a3b66'};

export default function ToolsMainPanel({ selectedTool, onSave }) {
  const [formData, setFormData] = useState({ name:'', type:'api', description:'', endpoint:'' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedTool) {
      setFormData({
        name: selectedTool.name || '',
        type: selectedTool.type || 'api',
        description: selectedTool.description || '',
        endpoint: selectedTool.endpoint || '',
      });
    }
  }, [selectedTool]);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tools/${selectedTool.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.tool) {
        onSave(data.tool);
        toast.success('Tool configuration saved!');
      }
    } catch (err) {
      toast.error('Error saving: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedTool) return <DashboardContent />;
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto" style={{ background: '#fafafa' }}>
      <div className="p-6" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <h1 className="text-2xl font-bold" style={{ color: TH }}>Edit Tool Configuration</h1>
        <p className="text-sm mt-1" style={{ color: TM }}>Provide connection details for {selectedTool.name}.</p>
      </div>
      <div className="p-6 max-w-2xl mx-auto w-full">
        <form onSubmit={handleSave} className="space-y-5">
          <div style={card}><label style={lbl}>Tool Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} style={inp} required /></div>
          <div style={card}><label style={lbl}>Tool Type</label><select name="type" value={formData.type} onChange={handleChange} style={inp}><option value="api">REST API</option><option value="script">Script Execution</option><option value="database">Database Query</option></select></div>
          <div style={card}><label style={lbl}>Description</label><textarea name="description" rows="3" value={formData.description} onChange={handleChange} placeholder="What does this tool do?" style={{ ...inp, resize: 'vertical' }} /></div>
          <div style={card}><label style={lbl}>{formData.type === 'api' ? 'Endpoint URL' : formData.type === 'database' ? 'Connection String' : 'Execution Path'}</label><input type="text" name="endpoint" value={formData.endpoint} onChange={handleChange} placeholder="https://api.example.com/v1" style={{ ...inp, fontFamily: 'monospace', fontSize: '13px' }} required /></div>
          <button type="submit" disabled={isSaving} className="px-6 py-3 text-white font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
            style={{ background: L, boxShadow: `0 4px 12px rgba(181,123,238,0.3)` }}>
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import DashboardContent from './DashboardContent';
import { toast } from './Toast';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';
const card={background:'#fff',border:`1.5px solid ${LB}`,borderRadius:'16px',padding:'24px'};
const inp={width:'100%',padding:'10px 14px',border:`1.5px solid ${LB}`,borderRadius:'10px',background:'#fff',color:TH,fontSize:'14px'};
const lbl={display:'block',fontSize:'13px',fontWeight:'600',marginBottom:'8px',color:'#4a3b66'};

export default function SchedulerMainPanel({ selectedSchedule, onSave }) {
  const [formData, setFormData] = useState({ name:'', task_id:'', triggerType:'cron', cronExpression:'0 0 * * *', status:'active' });
  const [availableTasks, setAvailableTasks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState('');

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(d => setAvailableTasks(d.tasks || []))
      .catch(e => console.error('Failed to load tasks:', e));
  }, []);

  useEffect(() => {
    if (selectedSchedule) {
      setFormData({
        name: selectedSchedule.name || '',
        task_id: selectedSchedule.task_id || '',
        triggerType: selectedSchedule.trigger_type || 'cron',
        cronExpression: selectedSchedule.cron_expression || '0 0 * * *',
        status: selectedSchedule.status || 'active',
      });
      setTriggerResult('');
    }
  }, [selectedSchedule]);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/schedules/${selectedSchedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          task_id: formData.task_id || null,
          trigger_type: formData.triggerType,
          cron_expression: formData.cronExpression,
          status: formData.status,
        }),
      });
      const data = await res.json();
      if (data.schedule) {
        onSave(data.schedule);
        toast.success('Schedule saved!');
      }
    } catch (err) {
      toast.error('Error saving: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTrigger = async () => {
    setIsTriggering(true);
    setTriggerResult('Triggering workflow...');
    try {
      const res = await fetch(`/api/schedules/${selectedSchedule.id}/trigger`, { method: 'POST' });
      const data = await res.json();
      if (data.run) {
        setTriggerResult(data.run.output || data.message || 'Triggered successfully!');
      } else {
        setTriggerResult('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setTriggerResult('Error: ' + err.message);
    } finally {
      setIsTriggering(false);
    }
  };

  if (!selectedSchedule) return <DashboardContent />;
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto" style={{ background: '#fafafa' }}>
      <div className="p-6 flex justify-between items-center" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TH }}>Edit Schedule: {selectedSchedule.name}</h1>
          <p className="text-sm mt-1" style={{ color: TM }}>Automate task execution via CRON or event triggers.</p>
        </div>
        <button onClick={handleTrigger} disabled={isTriggering || !formData.task_id}
          className="px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
          style={{ background: '#10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
          {isTriggering ? 'Running...' : '▶ Trigger Now'}
        </button>
      </div>
      <div className="p-6 max-w-2xl mx-auto w-full space-y-4">
        <div style={card}>
          <h2 className="text-base font-bold mb-5" style={{ color: TH }}>Configuration</h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div><label style={lbl}>Schedule Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} style={inp} required /></div>
            <div>
              <label style={lbl}>Target Task {availableTasks.length === 0 && <span style={{ color: TM, fontWeight: 400 }}>(Create tasks first)</span>}</label>
              <select name="task_id" value={formData.task_id} onChange={handleChange} style={inp} required>
                <option value="" disabled>Select a Task...</option>
                {availableTasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Trigger Type</label>
              <div className="flex gap-5">
                {[{v:'cron',l:'Cron Schedule'},{v:'event',l:'Event / Webhook'}].map(opt => (
                  <label key={opt.v} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#4a3b66' }}>
                    <input type="radio" name="triggerType" value={opt.v} checked={formData.triggerType===opt.v} onChange={handleChange} style={{ accentColor: L }} />{opt.l}
                  </label>
                ))}
              </div>
            </div>
            {formData.triggerType==='cron' && (
              <div><label style={lbl}>Cron Expression</label><input type="text" name="cronExpression" value={formData.cronExpression} onChange={handleChange} placeholder="* * * * *" style={{ ...inp, fontFamily: 'monospace' }} /><p className="text-xs mt-1" style={{ color: TM }}>Min Hour Day Month Weekday</p></div>
            )}
            {formData.triggerType==='event' && (
              <div><label style={lbl}>Webhook URL</label><input type="text" disabled value={`http://localhost:5000/api/schedules/${selectedSchedule.id}/trigger`} style={{ ...inp, fontFamily: 'monospace', fontSize: '12px', background: '#fafafa', color: TM }} /></div>
            )}
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#4a3b66' }}>
              <input type="checkbox" checked={formData.status==='active'} onChange={e => setFormData(p => ({ ...p, status: e.target.checked ? 'active' : 'paused' }))} style={{ accentColor: L }} /> Schedule Active
            </label>
            <div className="pt-3" style={{ borderTop: `1.5px solid ${LB}` }}>
              <button type="submit" disabled={isSaving} className="w-full px-6 py-3 text-white font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
                style={{ background: L, boxShadow: `0 4px 12px rgba(181,123,238,0.3)` }}>
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
        {/* Trigger Output */}
        {triggerResult && (
          <div style={{ ...card, background: '#f0fdf4', border: '1.5px solid #86efac' }}>
            <h4 className="text-xs font-bold mb-2 text-green-700">Trigger Output:</h4>
            <pre className="text-xs whitespace-pre-wrap font-mono text-green-900 max-h-60 overflow-y-auto">{triggerResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import SchedulerMainPanel from '../../components/SchedulerMainPanel';
import { toast, confirm } from '../../components/Toast';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

export default function SchedulerPage() {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => { fetchSchedules(); }, []);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/schedules');
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (data.schedule) {
        setSchedules(prev => [data.schedule, ...prev]);
        setSelectedSchedule(data.schedule);
        setNewName('');
        setShowForm(false);
        toast.success(`Schedule "${data.schedule.name}" created!`);
      }
    } catch (err) { toast.error('Failed to create schedule: ' + err.message); }
  };

  const handleUpdate = (updatedSchedule) => {
    setSchedules(prev => prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s));
    setSelectedSchedule(updatedSchedule);
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    const ok = await confirm(`Delete schedule "${name}"?`);
    if (!ok) return;
    try {
      await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      setSchedules(prev => prev.filter(s => s.id !== id));
      if (selectedSchedule?.id === id) setSelectedSchedule(null);
      toast.success('Schedule deleted.');
    } catch (err) { toast.error('Delete failed: ' + err.message); }
  };

  const statusColor = {
    active:   { bg: '#d1fae5', color: '#065f46' },
    paused:   { bg: '#fef3c7', color: '#92400e' },
    inactive: { bg: '#f3f4f6', color: '#6b7280' },
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      <PageHeader 
        title="Task Scheduler" 
        description="Set up CRON jobs and event triggers to automate workflows."
        buttonText="+ New Schedule"
        buttonAction={() => setShowForm(true)}
      />

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-7xl mx-auto">

          {showForm && (
            <div className="mb-5 p-4 rounded-2xl" style={{ background: '#fff', border: `1.5px solid ${L}` }}>
              <form onSubmit={handleCreate} className="flex gap-3 items-center">
                <input autoFocus type="text" placeholder="Schedule name..." value={newName} onChange={e => setNewName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm" style={{ border: `1.5px solid ${LB}`, color: TH }} />
                <button type="submit" className="px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85" style={{ background: L }}>Create</button>
                <button type="button" onClick={() => { setShowForm(false); setNewName(''); }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl hover:opacity-85" style={{ background: LL, color: L }}>Cancel</button>
              </form>
            </div>
          )}

          {selectedSchedule && (
            <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#fff', border: `1.5px solid ${L}` }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1.5px solid ${LB}`, background: LL }}>
                <span className="text-sm font-bold" style={{ color: L }}>Managing Schedule: {selectedSchedule.name}</span>
                <button onClick={() => setSelectedSchedule(null)} style={{ color: TM }}>✕</button>
              </div>
              <SchedulerMainPanel
                schedule={selectedSchedule}
                onUpdate={() => { fetchSchedules(); setSelectedSchedule(null); }}
              />
            </div>
          )}

          <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
            <table className="min-w-full text-left">
              <thead>
                <tr style={{ background: LL }}>
                  {['Name', 'Task', 'Trigger', 'Cron', 'Status', 'Actions'].map(col => (
                    <th key={col} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: L }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="px-5 py-10 text-center text-sm" style={{ color: TM }}>Loading schedules...</td></tr>
                ) : schedules.length === 0 ? (
                  <tr><td colSpan="6" className="px-5 py-14 text-center" style={{ color: TM }}>No schedules yet. Click "+ New Schedule" to create one.</td></tr>
                ) : schedules.map(s => (
                  <tr key={s.id} onClick={() => setSelectedSchedule(selectedSchedule?.id === s.id ? null : s)}
                    className="cursor-pointer"
                    style={{ borderTop: `1px solid ${LB}`, background: selectedSchedule?.id === s.id ? LL : 'transparent' }}
                    onMouseEnter={e => { if (selectedSchedule?.id !== s.id) e.currentTarget.style.background = '#fdf8ff'; }}
                    onMouseLeave={e => { if (selectedSchedule?.id !== s.id) e.currentTarget.style.background = 'transparent'; }}>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold" style={{ color: TH }}>{s.name}</span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: TM }}>
                      {s.task_name || <span style={{ color: '#d1d5db' }}>Not assigned</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium uppercase"
                        style={{ background: '#f3f4f6', color: '#4b5563' }}>{s.trigger_type || 'cron'}</span>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono" style={{ color: TM }}>{s.cron_expression || '—'}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={statusColor[s.status] || { background: '#f3f4f6', color: '#6b7280' }}>
                        {s.status || 'inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={(e) => handleDelete(s.id, s.name, e)}
                        className="text-xs px-3 py-1 rounded-lg hover:opacity-80"
                        style={{ background: '#fee2e2', color: '#991b1b' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail Panel moved up to line 100 */}
        </div>
      </div>
    </div>
  );
}

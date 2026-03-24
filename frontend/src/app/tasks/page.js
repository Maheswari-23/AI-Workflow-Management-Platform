'use client';
import { useState, useEffect } from 'react';
import TaskMainPanel from '../../components/TaskMainPanel';
import { toast, confirm } from '../../components/Toast';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (data.task) {
        setTasks(prev => [data.task, ...prev]);
        setSelectedTask(data.task);
        setNewName('');
        setShowForm(false);
        toast.success(`Task "${data.task.name}" created!`);
      }
    } catch (err) { toast.error('Failed to create task: ' + err.message); }
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    const ok = await confirm(`Delete task "${name}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
      if (selectedTask?.id === id) setSelectedTask(null);
      toast.success('Task deleted.');
    } catch (err) { toast.error('Delete failed: ' + err.message); }
  };

  const statusColor = {
    draft:     { bg: LL, color: L },
    saved:     { bg: '#d1fae5', color: '#065f46' },
    completed: { bg: '#d1fae5', color: '#065f46' },
    running:   { bg: '#fef3c7', color: '#92400e' },
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TH }}>Tasks Management</h1>
          <p className="text-sm mt-0.5" style={{ color: TM }}>Create and configure tasks with agents and workflow steps.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85"
          style={{ background: L, boxShadow: `0 4px 12px rgba(181,123,238,0.3)` }}>
          + New Task
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-7xl mx-auto">

          {showForm && (
            <div className="mb-5 p-4 rounded-2xl" style={{ background: '#fff', border: `1.5px solid ${L}` }}>
              <form onSubmit={handleCreate} className="flex gap-3 items-center">
                <input autoFocus type="text" placeholder="Task name..." value={newName} onChange={e => setNewName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm" style={{ border: `1.5px solid ${LB}`, color: TH }} />
                <button type="submit" className="px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85" style={{ background: L }}>Create</button>
                <button type="button" onClick={() => { setShowForm(false); setNewName(''); }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl hover:opacity-85" style={{ background: LL, color: L }}>Cancel</button>
              </form>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
            <table className="min-w-full text-left">
              <thead>
                <tr style={{ background: LL }}>
                  {['Name', 'Status', 'Agents', 'Actions'].map(col => (
                    <th key={col} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: L }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="4" className="px-5 py-10 text-center text-sm" style={{ color: TM }}>Loading tasks...</td></tr>
                ) : tasks.length === 0 ? (
                  <tr><td colSpan="4" className="px-5 py-14 text-center" style={{ color: TM }}>No tasks yet. Click "+ New Task" to create one.</td></tr>
                ) : tasks.map(task => (
                  <tr key={task.id} onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                    className="cursor-pointer"
                    style={{ borderTop: `1px solid ${LB}`, background: selectedTask?.id === task.id ? LL : 'transparent' }}
                    onMouseEnter={e => { if (selectedTask?.id !== task.id) e.currentTarget.style.background = '#fdf8ff'; }}
                    onMouseLeave={e => { if (selectedTask?.id !== task.id) e.currentTarget.style.background = 'transparent'; }}>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold" style={{ color: TH }}>{task.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={statusColor[task.status] || { background: '#f3f4f6', color: '#6b7280' }}>
                        {task.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: TM }}>
                      {Array.isArray(task.agents) ? task.agents.length : 0} assigned
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={(e) => handleDelete(task.id, task.name, e)}
                        className="text-xs px-3 py-1 rounded-lg hover:opacity-80"
                        style={{ background: '#fee2e2', color: '#991b1b' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedTask && (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1.5px solid ${L}` }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1.5px solid ${LB}`, background: LL }}>
                <span className="text-sm font-bold" style={{ color: L }}>Editing: {selectedTask.name}</span>
                <button onClick={() => setSelectedTask(null)} style={{ color: TM }}>✕</button>
              </div>
              <TaskMainPanel selectedTask={selectedTask} onTaskUpdate={handleTaskUpdate} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

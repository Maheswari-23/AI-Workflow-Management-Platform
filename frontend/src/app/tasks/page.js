'use client';
import { useState, useEffect } from 'react';
import { TasksSidebar } from '../../components/TasksSidebar';
import TaskMainPanel from '../../components/TaskMainPanel';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskCreate = async (taskData) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: taskData.name }),
      });
      const data = await res.json();
      if (data.task) {
        setTasks(prev => [data.task, ...prev]);
        setSelectedTask(data.task);
      }
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleTaskDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
      if (selectedTask?.id === id) setSelectedTask(null);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#ffffff' }}>
      <TasksSidebar
        tasks={tasks}
        selectedTask={selectedTask}
        onTaskSelect={setSelectedTask}
        onTaskCreate={handleTaskCreate}
        onTaskDelete={handleTaskDelete}
      />
      <TaskMainPanel
        selectedTask={selectedTask}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  );
}

'use client';
import { useState } from 'react';
import TasksSidebar from '../../components/TasksSidebar';
import TaskMainPanel from '../../components/TaskMainPanel';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
  };

  const handleTaskCreate = (newTask) => {
    setTasks([...tasks, newTask]);
    setSelectedTask(newTask);
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks((prev) => 
      prev.map((t) => t.id === updatedTask.id ? updatedTask : t)
    );
    setSelectedTask(updatedTask);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#ffffff' }}>
      <TasksSidebar 
        tasks={tasks}
        selectedTask={selectedTask}
        onTaskSelect={handleTaskSelect}
        onTaskCreate={handleTaskCreate}
      />
      <TaskMainPanel 
        selectedTask={selectedTask}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  );
}

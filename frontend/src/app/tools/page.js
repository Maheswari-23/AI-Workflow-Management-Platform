'use client';
import { useState, useEffect } from 'react';
import ToolsSidebar from '../../components/ToolsSidebar';
import ToolsMainPanel from '../../components/ToolsMainPanel';

export default function ToolsPage() {
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/tools');
      const data = await res.json();
      setTools(data.tools || []);
    } catch (err) {
      console.error('Error fetching tools:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolCreate = async (toolData) => {
    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: toolData.name, type: toolData.type || 'api' }),
      });
      const data = await res.json();
      if (data.tool) {
        setTools(prev => [data.tool, ...prev]);
        setSelectedTool(data.tool);
      }
    } catch (err) {
      console.error('Error creating tool:', err);
    }
  };

  const handleToolSave = (updatedTool) => {
    setTools(prev => prev.map(t => t.id === updatedTool.id ? updatedTool : t));
    setSelectedTool(updatedTool);
  };

  const handleToolDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;
    try {
      await fetch(`/api/tools/${id}`, { method: 'DELETE' });
      setTools(prev => prev.filter(t => t.id !== id));
      if (selectedTool?.id === id) setSelectedTool(null);
    } catch (err) {
      console.error('Error deleting tool:', err);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#ffffff' }}>
      <ToolsSidebar
        tools={tools}
        selectedTool={selectedTool}
        onToolSelect={setSelectedTool}
        onToolCreate={handleToolCreate}
        onToolDelete={handleToolDelete}
        isLoading={isLoading}
      />
      <ToolsMainPanel
        selectedTool={selectedTool}
        onSave={handleToolSave}
      />
    </div>
  );
}

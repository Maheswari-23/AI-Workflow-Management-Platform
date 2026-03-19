'use client';
import { useState } from 'react';
import ToolsSidebar from '../../components/ToolsSidebar';
import ToolsMainPanel from '../../components/ToolsMainPanel';

// Demo initial tools
const initialTools = [
  { id: 'tool-1', name: 'Web Scraper', type: 'script', description: 'Scrape URLs to markdown', endpoint: './scripts/scrape.py', status: 'active' },
  { id: 'tool-2', name: 'Wikipedia Search', type: 'api', description: 'Query wikipedia articles', endpoint: 'https://en.wikipedia.org/w/api.php', status: 'active' },
];

export default function ToolsPage() {
  const [tools, setTools] = useState(initialTools);
  const [selectedTool, setSelectedTool] = useState(null);

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
  };

  const handleToolCreate = (newTool) => {
    setTools([...tools, newTool]);
    setSelectedTool(newTool);
  };

  const handleToolSave = (updatedTool) => {
    setTools((prev) => 
      prev.map((t) => t.id === updatedTool.id ? updatedTool : t)
    );
    setSelectedTool(updatedTool);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#ffffff' }}>
      <ToolsSidebar 
        tools={tools}
        selectedTool={selectedTool}
        onToolSelect={handleToolSelect}
        onToolCreate={handleToolCreate}
      />
      <ToolsMainPanel 
        selectedTool={selectedTool}
        onSave={handleToolSave}
      />
    </div>
  );
}

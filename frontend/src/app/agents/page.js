'use client';
import { useState, useEffect } from 'react';
import AgentsSidebar from '../../components/AgentsSidebar';
import AgentMainPanel from '../../components/AgentMainPanel';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/agents');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentCreate = async (agentData) => {
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: agentData.name }),
      });
      const data = await res.json();
      if (data.agent) {
        setAgents(prev => [data.agent, ...prev]);
        setSelectedAgent(data.agent);
      }
    } catch (err) {
      console.error('Error creating agent:', err);
    }
  };

  const handleAgentDelete = async (agentId) => {
    try {
      await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
      setAgents(prev => prev.filter(a => a.id !== agentId));
      if (selectedAgent?.id === agentId) setSelectedAgent(null);
    } catch (err) {
      console.error('Error deleting agent:', err);
    }
  };

  return (
    <div className="flex h-screen" style={{ background: '#ffffff' }}>
      <AgentsSidebar
        agents={agents}
        selectedAgent={selectedAgent}
        onAgentSelect={setSelectedAgent}
        onAgentCreate={handleAgentCreate}
        onAgentDelete={handleAgentDelete}
        isLoading={isLoading}
      />
      <AgentMainPanel
        selectedAgent={selectedAgent}
        onAgentUpdate={fetchAgents}
        onSaveAgent={async (id, updates) => {
          const res = await fetch(`/api/agents/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          const data = await res.json();
          if (data.agent) {
            setSelectedAgent(data.agent);
            setAgents(prev => prev.map(a => a.id === id ? data.agent : a));
          }
        }}
      />
    </div>
  );
}

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
      const response = await fetch('/api/agents');
      const data = await response.json();
      setAgents(data.agents || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setIsLoading(false);
    }
  };

  const handleAgentSelect = (agent) => {
    setSelectedAgent(agent);
  };

  const handleAgentCreate = (newAgent) => {
    setAgents([...agents, newAgent]);
    setSelectedAgent(newAgent);
  };

  return (
    <div className="flex h-screen" style={{ background: '#ffffff' }}>
      <AgentsSidebar 
        agents={agents}
        selectedAgent={selectedAgent}
        onAgentSelect={handleAgentSelect}
        onAgentCreate={handleAgentCreate}
        isLoading={isLoading}
      />
      <AgentMainPanel 
        selectedAgent={selectedAgent}
        onAgentUpdate={fetchAgents}
      />
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import LLMSidebar from '../../../components/LLMSidebar';
import LLMConfigPanel from '../../../components/LLMConfigPanel';

const initialProviders = [
  { id: 'openai', name: 'OpenAI', defaultBaseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4-turbo-preview', configured: false },
  { id: 'anthropic', name: 'Anthropic', defaultBaseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-opus-20240229', configured: false },
  { id: 'google', name: 'Google Gemini', defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-1.5-pro-latest', configured: false },
  { id: 'groq', name: 'Groq', defaultBaseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'mixtral-8x7b-32768', configured: false },
  { id: 'custom', name: 'Custom Strategy', defaultBaseUrl: 'http://localhost:8080/v1', defaultModel: 'llama3', configured: false }
];

export default function LLMSettingsPage() {
  const [providers, setProviders] = useState(initialProviders);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // In a real application, we would fetch existing configurations from the backend here
  // useEffect(() => { fetchProviders(); }, []);

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
  };

  const handleProviderSave = (updatedProvider) => {
    setProviders((prev) => 
      prev.map((p) => p.id === updatedProvider.id ? updatedProvider : p)
    );
    setSelectedProvider(updatedProvider);
    
    // Here we would actually save to the backend:
    // fetch('/api/llm/settings', { method: 'POST', body: JSON.stringify(updatedProvider) })
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#ffffff' }}>
      {/* 
        We use similar layout as AgentsPage: a flex container with h-screen
        Sidebar for selection, main panel for configuration.
      */}
      <LLMSidebar 
        providers={providers}
        selectedProvider={selectedProvider}
        onProviderSelect={handleProviderSelect}
      />
      <LLMConfigPanel 
        selectedProvider={selectedProvider}
        onSave={handleProviderSave}
      />
    </div>
  );
}

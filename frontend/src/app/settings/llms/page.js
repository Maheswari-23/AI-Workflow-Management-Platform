'use client';
import { useState, useEffect } from 'react';
import LLMSidebar from '../../../components/LLMSidebar';
import LLMConfigPanel from '../../../components/LLMConfigPanel';

export default function LLMSettingsPage() {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/llm/providers');
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSave = async (updatedProvider) => {
    try {
      const res = await fetch('/api/llm/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedProvider.name,
          api_key: updatedProvider.apiKey,
          base_url: updatedProvider.baseUrl,
          model: updatedProvider.model,
          temperature: updatedProvider.temperature,
          max_tokens: updatedProvider.maxTokens,
        }),
      });
      const data = await res.json();
      if (data.provider) {
        setProviders(prev => prev.map(p => p.name === updatedProvider.name ? data.provider : p));
        setSelectedProvider(data.provider);
        alert('Provider configuration saved!');
      }
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
  };

  const handleTestConnection = async (providerName) => {
    try {
      const res = await fetch('/api/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_name: providerName }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Connection successful!\nResponse: ${data.response}`);
      } else {
        alert(`❌ Connection failed: ${data.error}`);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#ffffff' }}>
      <LLMSidebar
        providers={providers}
        selectedProvider={selectedProvider}
        onProviderSelect={setSelectedProvider}
        isLoading={isLoading}
      />
      <LLMConfigPanel
        selectedProvider={selectedProvider}
        onSave={handleProviderSave}
        onTestConnection={handleTestConnection}
      />
    </div>
  );
}

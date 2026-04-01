'use client';
import { useState, useEffect } from 'react';
import LLMConfigPanel from '../../../components/LLMConfigPanel';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

export default function LLMSettingsPage() {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchProviders(); }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/llm/providers');
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleSetDefault = async (name) => {
    try {
      const res = await fetch(`/api/llm/providers/${name}/set-default`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setProviders(prev => prev.map(p => ({ ...p, is_default: p.name === name ? 1 : 0 })));
      }
    } catch (err) { console.error(err); }
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
    } catch (err) { alert('Error saving: ' + err.message); }
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
    } catch (err) { alert('Error: ' + err.message); }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TH }}>LLM Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: TM }}>Configure your own API keys for each LLM provider. Set one as default for task execution.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-7xl mx-auto">

          {/* Providers table */}
          <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#fff', border: `1.5px solid ${LB}` }}>
            <table className="min-w-full text-left">
              <thead>
                <tr style={{ background: LL }}>
                  {['Provider', 'Model', 'Base URL', 'Status', 'Default', ''].map(col => (
                    <th key={col} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider" style={{ color: L }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="px-5 py-10 text-center text-sm" style={{ color: TM }}>Loading providers...</td></tr>
                ) : providers.length === 0 ? (
                  <tr><td colSpan="6" className="px-5 py-14 text-center" style={{ color: TM }}>No providers found.</td></tr>
                ) : providers.map(p => (
                  <tr key={p.id || p.name} onClick={() => setSelectedProvider(selectedProvider?.name === p.name ? null : p)}
                    className="cursor-pointer"
                    style={{ borderTop: `1px solid ${LB}`, background: selectedProvider?.name === p.name ? LL : 'transparent' }}
                    onMouseEnter={e => { if (selectedProvider?.name !== p.name) e.currentTarget.style.background = '#fdf8ff'; }}
                    onMouseLeave={e => { if (selectedProvider?.name !== p.name) e.currentTarget.style.background = 'transparent'; }}>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold" style={{ color: TH }}>{p.name}</span>
                    </td>
                    <td className="px-5 py-3 text-sm font-mono" style={{ color: TM }}>{p.model || '—'}</td>
                    <td className="px-5 py-3 text-xs font-mono" style={{ color: TM }}>{p.base_url || p.baseUrl || '—'}</td>
                    <td className="px-5 py-3">
                      {p.configured || p.hasKey ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#d1fae5', color: '#065f46' }}>✓ Configured</span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#fee2e2', color: '#991b1b' }}>Not Configured</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {p.is_default ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: LL, color: L }}>★ Default</span>
                      ) : (
                        <span className="text-xs" style={{ color: TM }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {!p.is_default && (
                        <button onClick={(e) => { e.stopPropagation(); handleSetDefault(p.name); }}
                          className="text-xs px-3 py-1 rounded-lg hover:opacity-80 font-medium"
                          style={{ background: LL, color: L, border: `1px solid ${LB}` }}>
                          Set Default
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Inline config panel */}
          {selectedProvider && (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1.5px solid ${L}` }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1.5px solid ${LB}`, background: LL }}>
                <span className="text-sm font-bold" style={{ color: L }}>Configuring: {selectedProvider.name}</span>
                <button onClick={() => setSelectedProvider(null)} style={{ color: TM }}>✕</button>
              </div>
              <LLMConfigPanel
                selectedProvider={selectedProvider}
                onSave={handleProviderSave}
                onTestConnection={handleTestConnection}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

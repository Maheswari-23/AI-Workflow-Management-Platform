'use client';
import { useState, useEffect } from 'react';
import DashboardContent from './DashboardContent';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';
const card={background:'#fff',border:`1.5px solid ${LB}`,borderRadius:'16px',padding:'20px'};
const inp={width:'100%',padding:'10px 14px',border:`1.5px solid ${LB}`,borderRadius:'10px',background:'#fff',color:TH,fontSize:'14px'};
const lbl={display:'block',fontSize:'13px',fontWeight:'600',marginBottom:'8px',color:'#4a3b66'};

export default function LLMConfigPanel({ selectedProvider, onSave, onTestConnection }) {
  const [formData, setFormData] = useState({ apiKey:'', baseUrl:'', model:'', temperature:0.7, maxTokens:2048 });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (selectedProvider) {
      setFormData({
        apiKey: '',  // never pre-fill key for security
        baseUrl: selectedProvider.base_url || selectedProvider.baseUrl || '',
        model: selectedProvider.model || '',
        temperature: selectedProvider.temperature ?? 0.7,
        maxTokens: selectedProvider.max_tokens || selectedProvider.maxTokens || 2048,
      });
    }
  }, [selectedProvider]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ ...selectedProvider, ...formData, name: selectedProvider.name });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await onTestConnection(selectedProvider.name);
    } finally {
      setIsTesting(false);
    }
  };

  if (!selectedProvider) return <DashboardContent />;
  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: '#fff' }}>
      <div className="p-6" style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: TH }}>{selectedProvider.name} Configuration</h1>
            <p className="text-sm mt-1" style={{ color: TM }}>
              {selectedProvider.is_default ? '⭐ This is your default provider for task execution' : 'Configure and set as default to use for tasks'}
            </p>
          </div>
          {selectedProvider.configured || selectedProvider.hasKey ? (
            <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: '#d1fae5', color: '#065f46' }}>✓ Configured</span>
          ) : (
            <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: '#fee2e2', color: '#991b1b' }}>⚠ API Key Required</span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div style={card}>
              <label style={lbl}>API Key <span style={{ color: L }}>* Required</span></label>
              <input type="password" name="apiKey" value={formData.apiKey} onChange={handleChange}
                placeholder={selectedProvider.hasKey ? '••••••••••••• (leave blank to keep existing)' : 'Enter your API key (required)'}
                style={inp} 
                required={!selectedProvider.hasKey} />
              <p className="text-xs mt-1.5" style={{ color: TM }}>
                Your API key is encrypted and stored securely. Never shared or exposed.
              </p>
            </div>
            <div style={card}>
              <label style={lbl}>Base URL</label>
              <input type="url" name="baseUrl" value={formData.baseUrl} onChange={handleChange}
                placeholder={selectedProvider.base_url || selectedProvider.defaultBaseUrl || 'https://api.openai.com/v1'}
                style={inp} />
              <p className="text-xs mt-1.5" style={{ color: TM }}>Optional — override the default API base URL.</p>
            </div>
            <div style={card}>
              <label style={lbl}>Default Model</label>
              <input type="text" name="model" value={formData.model} onChange={handleChange}
                placeholder={selectedProvider.model || selectedProvider.defaultModel || 'gpt-4'}
                style={inp} />
            </div>
            <div style={card}>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label style={lbl}>Temperature ({formData.temperature})</label>
                  <input type="range" name="temperature" min="0" max="2" step="0.1" value={formData.temperature} onChange={handleChange} className="w-full" style={{ accentColor: L }} />
                  <div className="flex justify-between text-xs mt-1" style={{ color: TM }}><span>Precise</span><span>Creative</span></div>
                </div>
                <div>
                  <label style={lbl}>Max Tokens</label>
                  <input type="number" name="maxTokens" min="1" max="128000" value={formData.maxTokens} onChange={handleChange} style={inp} />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
                style={{ background: L, boxShadow: `0 4px 12px rgba(181,123,238,0.3)` }}>
                {isSaving ? (<><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving...</>) : 'Save Configuration'}
              </button>
              {onTestConnection && (
                <button type="button" onClick={handleTest} disabled={isTesting || !selectedProvider.hasKey}
                  className="px-5 py-3 font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
                  style={{ background: LL, color: L, border: `1.5px solid ${LB}` }}>
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

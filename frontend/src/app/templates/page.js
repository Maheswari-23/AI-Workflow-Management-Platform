'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '../../components/PageHeader';
import { toast } from '../../components/Toast';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

const categoryColors = {
  Research: { bg: '#dbeafe', color: '#1e40af', icon: '🔍' },
  Content: { bg: '#fce7f3', color: '#9f1239', icon: '✍️' },
  Finance: { bg: '#d1fae5', color: '#065f46', icon: '📈' },
  Automation: { bg: '#fef3c7', color: '#92400e', icon: '⚙️' },
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customDescription, setCustomDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFromTemplate = async (templateId) => {
    setIsCreating(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_description: customDescription }),
      });
      const data = await res.json();
      if (data.task) {
        toast.success(`Task created from template!`);
        setSelectedTemplate(null);
        setCustomDescription('');
        // Navigate to tasks page
        router.push('/tasks');
      } else {
        toast.error(data.error || 'Failed to create task');
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      <PageHeader 
        title="Workflow Templates" 
        description="Pre-built workflows to get started quickly. One-click import and customize."
        buttonText="↻ Refresh"
        buttonAction={fetchTemplates}
      />

      <div className="flex-1 overflow-y-auto p-6" style={{ background: '#fafafa' }}>
        <div className="max-w-7xl mx-auto">
          
          {isLoading ? (
            <div className="text-center py-20" style={{ color: TM }}>Loading templates...</div>
          ) : (
            Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <div key={category} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{categoryColors[category]?.icon || '📋'}</span>
                  <h2 className="text-xl font-bold" style={{ color: TH }}>{category}</h2>
                  <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: LL, color: L }}>
                    {categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTemplates.map(template => (
                    <div key={template.id} 
                      className="rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg"
                      style={{ background: '#fff', border: `1.5px solid ${LB}` }}
                      onClick={() => setSelectedTemplate(template)}>
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{template.icon}</span>
                        <span className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ 
                            background: categoryColors[template.category]?.bg || LL, 
                            color: categoryColors[template.category]?.color || L 
                          }}>
                          {template.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: TH }}>{template.name}</h3>
                      <p className="text-sm mb-3" style={{ color: TM }}>{template.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.suggested_tools.slice(0, 3).map(tool => (
                          <span key={tool} className="text-xs px-2 py-0.5 rounded-full" style={{ background: LL, color: L }}>
                            {tool}
                          </span>
                        ))}
                        {template.suggested_tools.length > 3 && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: LL, color: L }}>
                            +{template.suggested_tools.length - 3} more
                          </span>
                        )}
                      </div>
                      <button 
                        className="w-full px-4 py-2 text-sm font-semibold rounded-xl hover:opacity-85"
                        style={{ background: L, color: '#fff' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedTemplate(template); }}>
                        Use Template →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Template Detail Modal */}
          {selectedTemplate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedTemplate(null)}>
              <div className="rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                style={{ background: '#fff' }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{selectedTemplate.icon}</span>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: TH }}>{selectedTemplate.name}</h2>
                      <span className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ 
                          background: categoryColors[selectedTemplate.category]?.bg || LL, 
                          color: categoryColors[selectedTemplate.category]?.color || L 
                        }}>
                        {selectedTemplate.category}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTemplate(null)} className="text-2xl" style={{ color: TM }}>✕</button>
                </div>

                <p className="text-sm mb-4" style={{ color: TM }}>{selectedTemplate.description}</p>

                <div className="mb-4">
                  <h3 className="text-sm font-bold mb-2" style={{ color: TH }}>Workflow Steps:</h3>
                  <pre className="text-xs p-4 rounded-xl whitespace-pre-wrap font-mono"
                    style={{ background: '#fafafa', color: TH, border: `1px solid ${LB}` }}>
                    {selectedTemplate.workflow_steps}
                  </pre>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-bold mb-2" style={{ color: TH }}>Suggested Agents:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.agents.map(agent => (
                      <span key={agent} className="text-sm px-3 py-1 rounded-full font-medium"
                        style={{ background: LL, color: L, border: `1px solid ${LB}` }}>
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-bold mb-2" style={{ color: TH }}>Required Tools:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.suggested_tools.map(tool => (
                      <span key={tool} className="text-xs px-2 py-1 rounded-full" style={{ background: LL, color: L }}>
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2" style={{ color: TH }}>
                    Customize Description (Optional):
                  </label>
                  <textarea 
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder={selectedTemplate.example_description}
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl text-sm"
                    style={{ border: `1.5px solid ${LB}`, color: TH, resize: 'vertical' }}
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleCreateFromTemplate(selectedTemplate.id)}
                    disabled={isCreating}
                    className="flex-1 px-6 py-3 text-white font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
                    style={{ background: L }}>
                    {isCreating ? 'Creating...' : '✨ Create Task from Template'}
                  </button>
                  <button 
                    onClick={() => setSelectedTemplate(null)}
                    className="px-6 py-3 font-semibold rounded-xl hover:opacity-85"
                    style={{ background: LL, color: L, border: `1.5px solid ${LB}` }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

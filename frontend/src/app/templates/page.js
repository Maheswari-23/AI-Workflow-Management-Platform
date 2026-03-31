'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '../../components/PageHeader';
import { toast } from '../../components/Toast';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

const categoryColors = {
  Research: { bg: '#dbeafe', color: '#1e40af' },
  Content: { bg: '#fce7f3', color: '#9f1239' },
  Finance: { bg: '#d1fae5', color: '#065f46' },
  Automation: { bg: '#fef3c7', color: '#92400e' },
};

const iconMap = {
  'search': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  'newspaper': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />,
  'trending-up': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
  'edit': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
  'folder': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
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
        toast.success('Task created from template!');
        setSelectedTemplate(null);
        setCustomDescription('');
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
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" 
                    style={{ background: categoryColors[category]?.bg, border: `1.5px solid ${categoryColors[category]?.color}20` }}>
                    <svg className="w-5 h-5" style={{ color: categoryColors[category]?.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {category === 'Research' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />}
                      {category === 'Content' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />}
                      {category === 'Finance' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
                      {category === 'Automation' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />}
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: TH }}>{category}</h2>
                  <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: LL, color: L }}>
                    {categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTemplates.map(template => (
                    <div key={template.id} 
                      className="rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg"
                      style={{ background: '#fff', border: `1.5px solid ${LB}` }}
                      onClick={() => setSelectedTemplate(template)}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" 
                          style={{ background: categoryColors[template.category]?.bg }}>
                          <svg className="w-6 h-6" style={{ color: categoryColors[template.category]?.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {iconMap[template.icon]}
                          </svg>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ 
                            background: categoryColors[template.category]?.bg, 
                            color: categoryColors[template.category]?.color 
                          }}>
                          {template.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: TH }}>{template.name}</h3>
                      <p className="text-sm mb-4 line-clamp-2" style={{ color: TM }}>{template.description}</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.suggested_tools.slice(0, 3).map(tool => (
                          <span key={tool} className="text-xs px-2 py-0.5 rounded-full" style={{ background: LL, color: L }}>
                            {tool}
                          </span>
                        ))}
                        {template.suggested_tools.length > 3 && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: LL, color: L }}>
                            +{template.suggested_tools.length - 3}
                          </span>
                        )}
                      </div>
                      <button 
                        className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl hover:opacity-85 transition-all"
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
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" 
                      style={{ background: categoryColors[selectedTemplate.category]?.bg }}>
                      <svg className="w-8 h-8" style={{ color: categoryColors[selectedTemplate.category]?.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {iconMap[selectedTemplate.icon]}
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1" style={{ color: TH }}>{selectedTemplate.name}</h2>
                      <span className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ 
                          background: categoryColors[selectedTemplate.category]?.bg, 
                          color: categoryColors[selectedTemplate.category]?.color 
                        }}>
                        {selectedTemplate.category}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTemplate(null)} className="text-2xl hover:opacity-70" style={{ color: TM }}>✕</button>
                </div>

                <p className="text-sm mb-6" style={{ color: TM }}>{selectedTemplate.description}</p>

                <div className="mb-6">
                  <h3 className="text-sm font-bold mb-3" style={{ color: TH }}>Workflow Steps:</h3>
                  <pre className="text-xs p-4 rounded-xl whitespace-pre-wrap font-mono leading-relaxed"
                    style={{ background: '#fafafa', color: TH, border: `1px solid ${LB}` }}>
                    {selectedTemplate.workflow_steps}
                  </pre>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold mb-3" style={{ color: TH }}>Suggested Agents:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.agents.map(agent => (
                      <span key={agent} className="text-sm px-3 py-1.5 rounded-full font-medium"
                        style={{ background: LL, color: L, border: `1px solid ${LB}` }}>
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold mb-3" style={{ color: TH }}>Required Tools ({selectedTemplate.suggested_tools.length}):</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.suggested_tools.map(tool => (
                      <span key={tool} className="text-xs px-2 py-1 rounded-full" style={{ background: LL, color: L }}>
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2" style={{ color: TH }}>
                    Customize Description (Optional):
                  </label>
                  <textarea 
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder={selectedTemplate.example_description}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{ border: `1.5px solid ${LB}`, color: TH, resize: 'vertical' }}
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleCreateFromTemplate(selectedTemplate.id)}
                    disabled={isCreating}
                    className="flex-1 px-6 py-3 text-white font-semibold rounded-xl hover:opacity-85 disabled:opacity-50 transition-all"
                    style={{ background: L, boxShadow: '0 4px 12px rgba(181,123,238,0.3)' }}>
                    {isCreating ? 'Creating...' : 'Create Task from Template'}
                  </button>
                  <button 
                    onClick={() => setSelectedTemplate(null)}
                    className="px-6 py-3 font-semibold rounded-xl hover:opacity-85 transition-all"
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

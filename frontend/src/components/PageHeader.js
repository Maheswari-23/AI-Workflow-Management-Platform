'use client';

/**
 * Unified Page Header Component
 * Unifies padding, spacing, and styling across all entity management pages.
 * Ensures consistent 'Breathing Room' and layout.
 */
export default function PageHeader({ 
  title, 
  description, 
  buttonAction, 
  buttonText, 
  customContent 
}) {
  const L = '#b57bee', LB = '#e9d5ff', TH = '#1e0a35', TM = '#9b87ba';

  return (
    <div className="px-6 pt-12 pb-6 flex items-center justify-between" 
      style={{ borderBottom: `1.5px solid ${LB}`, background: '#fff' }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: TH }}>{title}</h1>
        {description && <p className="text-sm mt-0.5" style={{ color: TM }}>{description}</p>}
      </div>
      
      <div className="flex items-center gap-3">
        {customContent}
        {buttonText && buttonAction && (
          <button onClick={buttonAction}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85 transition-opacity"
            style={{ background: L, boxShadow: `0 4px 12px rgba(181,123,238,0.3)` }}>
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}

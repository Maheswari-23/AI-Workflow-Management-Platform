'use client';
import { useState, useCallback, useRef, useEffect } from 'react';

const L = '#b57bee';

// ─── Toast Store (singleton, no context needed) ───────────────────────────────
let _setToasts = null;

export function toast(message, type = 'success', duration = 3500) {
  if (!_setToasts) return;
  const id = Date.now() + Math.random();
  _setToasts(prev => [...prev, { id, message, type }]);
  setTimeout(() => {
    _setToasts(prev => prev.filter(t => t.id !== id));
  }, duration);
}
toast.success = (msg) => toast(msg, 'success');
toast.error   = (msg) => toast(msg, 'error');
toast.info    = (msg) => toast(msg, 'info');

// Replaces window.confirm — returns a Promise<boolean>
export function confirm(message) {
  return new Promise(resolve => {
    if (!_setToasts) { resolve(window.confirm(message)); return; }
    const id = Date.now() + Math.random();
    _setToasts(prev => [...prev, { id, message, type: 'confirm', resolve }]);
  });
}

// ─── Provider component (mount once in layout) ────────────────────────────────
export function ToastProvider() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const typeStyles = {
    success: { bg: '#f0fdf4', border: '#86efac', icon: '✓', iconColor: '#16a34a', textColor: '#14532d' },
    error:   { bg: '#fef2f2', border: '#fca5a5', icon: '✕', iconColor: '#dc2626', textColor: '#7f1d1d' },
    info:    { bg: '#f3e8ff', border: L,         icon: 'ℹ', iconColor: L,         textColor: '#1e0a35' },
    confirm: { bg: '#fff',    border: L,         icon: '?', iconColor: L,         textColor: '#1e0a35' },
  };

  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px' }}>
      {toasts.map(t => {
        const s = typeStyles[t.type] || typeStyles.info;
        return (
          <div key={t.id}
            style={{
              background: s.bg,
              border: `1.5px solid ${s.border}`,
              borderRadius: '14px',
              padding: '14px 16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              animation: 'slideIn 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: s.iconColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>{s.icon}</span>
              <p style={{ fontSize: '13px', color: s.textColor, flex: 1, margin: 0, lineHeight: '1.4' }}>{t.message}</p>
              {t.type !== 'confirm' && (
                <button onClick={() => dismiss(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b87ba', fontSize: '16px', lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>
            {t.type === 'confirm' && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => { t.resolve(false); dismiss(t.id); }}
                  style={{ padding: '6px 14px', borderRadius: '8px', border: '1.5px solid #e9d5ff', background: '#fff', color: '#9b87ba', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={() => { t.resolve(true); dismiss(t.id); }}
                  style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: L, color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Confirm
                </button>
              </div>
            )}
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

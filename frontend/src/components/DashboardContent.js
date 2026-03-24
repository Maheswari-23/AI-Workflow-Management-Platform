'use client';
import Link from 'next/link';

const LILAC = '#b57bee';
const LILAC_LIGHT = '#f3e8ff';
const LILAC_BORDER = '#e9d5ff';
const TEXT_HEADING = '#1e0a35';
const TEXT_MUTED = '#9b87ba';

const cards = [
  { href: '/agents', title: 'Agents', desc: 'Create, equip, and monitor standalone AI actors capable of executing modular tasks.', cta: 'Manage Agents', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /> },
  { href: '/tasks', title: 'Tasks', desc: 'Draft detailed prompt requests, assign agents, and use LLMs to automate steps mapping.', cta: 'Manage Tasks', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
  { href: '/scheduler', title: 'Scheduler', desc: 'Set up CRON jobs or Event Triggers to automatically run defined workflows passively.', cta: 'Manage Schedules', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { href: '/tools', title: 'Tools', desc: 'Register APIs, databases, or execution scripts to be assigned dynamically to agents.', cta: 'Manage Tools', icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></> },
  { href: '/history', title: 'Run History', desc: 'View comprehensive logs, statuses, and execution metadata for all scheduled tasks.', cta: 'View History', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { href: '/settings/llms', title: 'LLM Models', desc: 'Update default providers, API Keys, Base URLs, and parameters across the entire platform.', cta: 'Global Settings', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /> },
];

export default function DashboardContent() {
  return (
    <div className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto" style={{ background: '#fff' }}>
      <div className="max-w-5xl w-full">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4" style={{ color: TEXT_HEADING }}>
            AI Workflow{' '}
            <span style={{ color: LILAC }}>Management</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: TEXT_MUTED }}>
            Centralized orchestration dashboard to define intelligent agents, map out robust workflows, and automate task scheduling at scale.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}
              className="group block rounded-2xl p-7 transition-all duration-200"
              style={{ background: '#fff', border: `1.5px solid ${LILAC_BORDER}`, boxShadow: '0 1px 8px rgba(181,123,238,0.08)' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(181,123,238,0.18)'; e.currentTarget.style.borderColor = LILAC; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 8px rgba(181,123,238,0.08)'; e.currentTarget.style.borderColor = LILAC_BORDER; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200"
                style={{ background: LILAC_LIGHT, color: LILAC }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{card.icon}</svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: TEXT_HEADING }}>{card.title}</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: TEXT_MUTED }}>{card.desc}</p>
              <span className="text-sm font-semibold flex items-center gap-1" style={{ color: LILAC }}>
                {card.cta} <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

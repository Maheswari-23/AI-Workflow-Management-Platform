'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const L = '#b57bee';
const LL = '#f3e8ff';
const LB = '#e9d5ff';
const TH = '#1e0a35';
const TM = '#9b87ba';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
  { href: '/agents', label: 'Agents', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /> },
  { href: '/tasks', label: 'Tasks', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
  { href: '/tools', label: 'Tools', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
  { href: '/approvals', label: 'Approvals', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { href: '/scheduler', label: 'Scheduler', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { href: '/history', label: 'Run History', border: true, icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-3-3v6" /></> },
  { href: '/settings/llms', label: 'LLM Settings', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /> },
];

export default function GlobalSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-50" style={{ background: '#fff', borderRight: `1.5px solid ${LB}` }}>
      {/* Brand */}
      <div className="p-6" style={{ borderBottom: `1px solid ${LB}` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: LL }}>
            <svg className="w-6 h-6" style={{ color: L }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: TH }}>OpenCode</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 mt-4">
        <p className="text-[10px] uppercase tracking-widest font-bold mb-4 px-3" style={{ color: TM }}>Menu</p>
        <div className="space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${link.border ? 'mb-2' : ''}`}
                style={isActive 
                  ? { background: LL, color: L, fontWeight: '600' } 
                  : { color: TM, fontWeight: '400' }}
              >
                <svg className={`w-5 h-5 mr-3 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: isActive ? L : TM }}>
                  {link.icon}
                </svg>
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer / User Profile Placeholder */}
      <div className="p-4" style={{ borderTop: `1.5px solid ${LB}` }}>
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: L, color: '#fff' }}>M</div>
          <div>
            <p className="text-xs font-bold" style={{ color: TH }}>Maheswari</p>
            <p className="text-[10px]" style={{ color: TM }}>Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}

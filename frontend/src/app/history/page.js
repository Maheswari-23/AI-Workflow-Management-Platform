'use client';
import { useState } from 'react';
import Link from 'next/link';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

const mockData=[
  {id:'run-1',runId:'A8B9C1',taskName:'Nightly Sync',scheduleName:'Production Sync',runOn:'3/18/2026, 12:00:01 AM',status:'Success',statusCode:'200 OK',duration:'45s'},
  {id:'run-2',runId:'B7X3R9',taskName:'Daily SEO Report',scheduleName:'SEO Morning Brief',runOn:'3/18/2026, 06:00:00 AM',status:'Success',statusCode:'200 OK',duration:'2m 10s'},
  {id:'run-3',runId:'C4L8T2',taskName:'Scrape Competitor Pricing',scheduleName:'Hourly Price Check',runOn:'3/18/2026, 09:00:05 AM',status:'Failed',statusCode:'503 Service Unavailable',duration:'15s'},
  {id:'run-4',runId:'X7Y8Z9',taskName:'Nightly Sync',scheduleName:'Production Sync',runOn:'3/17/2026, 12:00:02 AM',status:'Success',statusCode:'200 OK',duration:'43s'},
  {id:'run-5',runId:'M4N5P6',taskName:'Nightly Sync',scheduleName:'Production Sync',runOn:'3/16/2026, 12:00:15 AM',status:'Failed',statusCode:'500 Server Error',duration:'5s'},
  {id:'run-6',runId:'P9Q8R7',taskName:'Sync CRM Contacts',scheduleName:'Salesforce Pull',runOn:'3/15/2026, 03:00:00 PM',status:'Running',statusCode:'202 Accepted',duration:'...'},
];

const statusBadge={
  Success:{background:'#d1fae5',color:'#065f46'},
  Failed:{background:'#fee2e2',color:'#991b1b'},
  Running:{background:LL,color:L},
};

export default function HistoryPage(){
  const [history]=useState(mockData);
  const [searchTerm,setSearchTerm]=useState('');
  const filtered=history.filter(r=>r.taskName.toLowerCase().includes(searchTerm.toLowerCase())||r.runId.toLowerCase().includes(searchTerm.toLowerCase())||r.status.toLowerCase().includes(searchTerm.toLowerCase()));

  return(
    <div className="flex h-screen flex-col overflow-hidden" style={{background:'#fff'}}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{background:'#fff',borderBottom:`1.5px solid ${LB}`}}>
        <div className="flex items-center gap-4">
          <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:LL,color:L}}
            onMouseEnter={e=>{e.currentTarget.style.background=LB;}} onMouseLeave={e=>{e.currentTarget.style.background=LL;}}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{color:TH}}>Run History</h1>
            <p className="text-sm" style={{color:TM}}>Comprehensive execution logs for all automated tasks.</p>
          </div>
        </div>
        <div className="relative">
          <input type="text" placeholder="Filter by Task, ID, Status..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 text-sm w-64 rounded-xl" style={{border:`1.5px solid ${LB}`,background:'#fff',color:TH}}/>
          <svg className="w-4 h-4 absolute left-3 top-2.5" style={{color:L}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8" style={{background:'#fafafa'}}>
        <div className="max-w-7xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {label:'Total Runs',value:history.length,color:L},
              {label:'Successful',value:history.filter(r=>r.status==='Success').length,color:'#059669'},
              {label:'Failed',value:history.filter(r=>r.status==='Failed').length,color:'#dc2626'},
            ].map(s=>(
              <div key={s.label} className="rounded-2xl p-5" style={{background:'#fff',border:`1.5px solid ${LB}`}}>
                <div className="text-3xl font-extrabold mb-1" style={{color:s.color}}>{s.value}</div>
                <div className="text-sm" style={{color:TM}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{background:'#fff',border:`1.5px solid ${LB}`,boxShadow:'0 1px 8px rgba(181,123,238,0.07)'}}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr style={{background:LL}}>
                    {['Run ID','Task & Schedule','Run On','Duration','Status'].map(col=>(
                      <th key={col} className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider" style={{color:L}}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length>0?filtered.map(run=>(
                    <tr key={run.id} style={{borderTop:`1px solid ${LB}`}}
                      onMouseEnter={e=>{e.currentTarget.style.background='#fdf8ff';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs px-2.5 py-1 rounded-lg" style={{background:LL,color:L}}>{run.runId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold" style={{color:TH}}>{run.taskName}</div>
                        <div className="text-xs mt-0.5" style={{color:TM}}>{run.scheduleName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color:'#4a3b66'}}>{run.runOn}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono" style={{color:TM}}>{run.duration}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${run.status==='Running'?'animate-pulse':''}`} style={statusBadge[run.status]}>{run.status}</span>
                        <div className="text-xs font-mono mt-1" style={{color:TM}}>{run.statusCode}</div>
                      </td>
                    </tr>
                  )):(
                    <tr><td colSpan="5" className="px-6 py-14 text-center" style={{color:TM}}>No records found for &quot;{searchTerm}&quot;.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 flex items-center justify-between" style={{borderTop:`1.5px solid ${LB}`,background:'#fdf8ff'}}>
              <span className="text-sm" style={{color:TM}}>Showing {filtered.length} of {history.length} runs</span>
              <div className="flex gap-2">
                <button disabled className="px-3 py-1.5 text-sm rounded-lg cursor-not-allowed" style={{background:LL,color:LB}}>Previous</button>
                <button className="px-3 py-1.5 text-sm rounded-lg text-white" style={{background:L}}>Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

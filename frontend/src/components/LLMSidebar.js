'use client';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

export default function LLMSidebar({providers,selectedProvider,onProviderSelect}){
  return(
    <div className="w-80 flex flex-col h-full" style={{background:'#fff',borderRight:`1.5px solid ${LB}`}}>
      <div className="p-5" style={{borderBottom:`1.5px solid ${LB}`}}>
        <h2 className="text-base font-bold" style={{color:TH}}>LLM Providers</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {providers.map(p=>(
          <div key={p.id} onClick={()=>onProviderSelect(p)} className="p-3 rounded-xl cursor-pointer mb-1.5 transition-all duration-150"
            style={selectedProvider?.id===p.id?{background:LL,border:`1.5px solid ${L}`}:{background:'#fafafa',border:'1.5px solid transparent'}}
            onMouseEnter={e=>{if(selectedProvider?.id!==p.id){e.currentTarget.style.background='#f9f5ff';e.currentTarget.style.borderColor=LB;}}}
            onMouseLeave={e=>{if(selectedProvider?.id!==p.id){e.currentTarget.style.background='#fafafa';e.currentTarget.style.borderColor='transparent';}}}>
            <h3 className="font-medium text-sm" style={{color:TH}}>{p.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full inline-block ${p.configured?'bg-green-400':'bg-gray-300'}`}></span>
              <span className="text-xs" style={{color:TM}}>{p.configured?'Configured':'Not Configured'}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4" style={{borderTop:`1.5px solid ${LB}`}}>
        <a href="/agents" className="flex items-center text-sm" style={{color:TM}} onMouseEnter={e=>{e.currentTarget.style.color=L;}} onMouseLeave={e=>{e.currentTarget.style.color=TM;}}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>Back to Agents
        </a>
      </div>
    </div>
  );
}

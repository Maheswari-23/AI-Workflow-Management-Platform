'use client';
import { useState } from 'react';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';

export default function ToolsSidebar({tools,selectedTool,onToolSelect,onToolCreate}){
  const [showForm,setShowForm]=useState(false);
  const [name,setName]=useState('');
  const handleCreate=(e)=>{e.preventDefault();if(!name.trim())return;onToolCreate({id:Date.now().toString(),name,type:'api',description:'',endpoint:'',status:'active'});setName('');setShowForm(false);};
  return(
    <div className="w-80 flex flex-col h-full" style={{background:'#fff',borderRight:`1.5px solid ${LB}`}}>
      <div className="p-5" style={{borderBottom:`1.5px solid ${LB}`}}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{color:TH}}>Tools</h2>
          <button onClick={()=>setShowForm(true)} className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold hover:scale-110 transition-transform" style={{background:L,boxShadow:`0 2px 8px rgba(181,123,238,0.4)`}}>+</button>
        </div>
      </div>
      {showForm&&(
        <div className="p-4" style={{background:'#fdf8ff',borderBottom:`1px solid ${LB}`}}>
          <form onSubmit={handleCreate}>
            <input type="text" placeholder="Tool name..." value={name} onChange={e=>setName(e.target.value)} className="w-full p-2 rounded-lg mb-2 text-sm" style={{border:`1.5px solid ${LB}`,background:'#fff',color:TH}} autoFocus/>
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1.5 text-white rounded-lg text-sm font-medium hover:opacity-85" style={{background:L}}>Create</button>
              <button type="button" onClick={()=>{setShowForm(false);setName('');}} className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{background:LL,color:L}}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-3">
        {tools.length===0?(
          <div className="p-6 text-center"><div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{background:LL}}><svg className="w-5 h-5" style={{color:L}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg></div><p className="text-xs" style={{color:TM}}>No tools yet. Click + to add.</p></div>
        ):tools.map(tool=>(
          <div key={tool.id} onClick={()=>onToolSelect(tool)} className="p-3 rounded-xl cursor-pointer mb-1.5 transition-all duration-150"
            style={selectedTool?.id===tool.id?{background:LL,border:`1.5px solid ${L}`}:{background:'#fafafa',border:'1.5px solid transparent'}}
            onMouseEnter={e=>{if(selectedTool?.id!==tool.id){e.currentTarget.style.background='#f9f5ff';e.currentTarget.style.borderColor=LB;}}}
            onMouseLeave={e=>{if(selectedTool?.id!==tool.id){e.currentTarget.style.background='#fafafa';e.currentTarget.style.borderColor='transparent';}}}>
            <h3 className="font-medium text-sm" style={{color:TH}}>{tool.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full uppercase inline-block mt-1" style={{background:LL,color:L}}>{tool.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

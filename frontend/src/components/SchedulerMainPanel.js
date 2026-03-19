'use client';
import { useState, useEffect } from 'react';
import DashboardContent from './DashboardContent';

const L='#b57bee',LL='#f3e8ff',LB='#e9d5ff',TH='#1e0a35',TM='#9b87ba';
const card={background:'#fff',border:`1.5px solid ${LB}`,borderRadius:'16px',padding:'24px'};
const inp={width:'100%',padding:'10px 14px',border:`1.5px solid ${LB}`,borderRadius:'10px',background:'#fff',color:TH,fontSize:'14px'};
const lbl={display:'block',fontSize:'13px',fontWeight:'600',marginBottom:'8px',color:'#4a3b66'};

const availableTasks=[
  {id:'task-1',name:'Daily SEO Report Generation'},
  {id:'task-2',name:'Scrape Competitor Pricing'},
  {id:'task-3',name:'Sync CRM Contacts'},
];

export default function SchedulerMainPanel({selectedSchedule,onSave}){
  const [formData,setFormData]=useState({name:'',taskId:'',triggerType:'cron',cronExpression:'0 0 * * *',status:'active'});
  const [isSaving,setIsSaving]=useState(false);
  useEffect(()=>{if(selectedSchedule)setFormData({name:selectedSchedule.name||'',taskId:selectedSchedule.taskId||'',triggerType:selectedSchedule.triggerType||'cron',cronExpression:selectedSchedule.cronExpression||'0 0 * * *',status:selectedSchedule.status||'active'});},[selectedSchedule]);
  const handleChange=(e)=>setFormData(p=>({...p,[e.target.name]:e.target.value}));
  const handleSave=async(e)=>{e.preventDefault();setIsSaving(true);await new Promise(r=>setTimeout(r,500));onSave({...selectedSchedule,...formData});setIsSaving(false);};
  if(!selectedSchedule)return<DashboardContent/>;
  return(
    <div className="flex-1 flex flex-col h-full overflow-y-auto" style={{background:'#fafafa'}}>
      <div className="p-6 flex justify-between items-center" style={{borderBottom:`1.5px solid ${LB}`,background:'#fff'}}>
        <div>
          <h1 className="text-2xl font-bold" style={{color:TH}}>Edit Schedule: {selectedSchedule.name}</h1>
          <p className="text-sm mt-1" style={{color:TM}}>Automate task execution via CRON or event triggers.</p>
        </div>
        <button onClick={()=>alert(`Triggered: ${selectedSchedule.name}`)} className="px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-85"
          style={{background:'#10b981',boxShadow:'0 4px 12px rgba(16,185,129,0.3)'}}>▶ Trigger Now</button>
      </div>
      <div className="p-6 max-w-2xl mx-auto w-full">
        <div style={card}>
          <h2 className="text-base font-bold mb-5" style={{color:TH}}>Configuration</h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div><label style={lbl}>Schedule Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} style={inp} required/></div>
            <div><label style={lbl}>Target Task</label><select name="taskId" value={formData.taskId} onChange={handleChange} style={inp} required><option value="" disabled>Select a Task...</option>{availableTasks.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div>
              <label style={lbl}>Trigger Type</label>
              <div className="flex gap-5">
                {[{v:'cron',l:'Cron Schedule'},{v:'event',l:'Event / Webhook'}].map(opt=>(
                  <label key={opt.v} className="flex items-center gap-2 text-sm cursor-pointer" style={{color:'#4a3b66'}}>
                    <input type="radio" name="triggerType" value={opt.v} checked={formData.triggerType===opt.v} onChange={handleChange} style={{accentColor:L}}/>{opt.l}
                  </label>
                ))}
              </div>
            </div>
            {formData.triggerType==='cron'&&(
              <div><label style={lbl}>Cron Expression</label><input type="text" name="cronExpression" value={formData.cronExpression} onChange={handleChange} placeholder="* * * * *" style={{...inp,fontFamily:'monospace'}}/><p className="text-xs mt-1" style={{color:TM}}>Min Hour Day Month Weekday</p></div>
            )}
            {formData.triggerType==='event'&&(
              <div><label style={lbl}>Webhook URL</label><input type="text" disabled value={`https://api.workflowplatform.com/v1/trigger/${selectedSchedule.id}`} style={{...inp,fontFamily:'monospace',fontSize:'12px',background:'#fafafa',color:TM}}/></div>
            )}
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{color:'#4a3b66'}}>
              <input type="checkbox" checked={formData.status==='active'} onChange={e=>setFormData(p=>({...p,status:e.target.checked?'active':'paused'}))} style={{accentColor:L}}/> Schedule Active
            </label>
            <div className="pt-3" style={{borderTop:`1.5px solid ${LB}`}}>
              <button type="submit" disabled={isSaving} className="w-full px-6 py-3 text-white font-semibold rounded-xl hover:opacity-85 disabled:opacity-50"
                style={{background:L,boxShadow:`0 4px 12px rgba(181,123,238,0.3)`}}>
                {isSaving?'Saving...':'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

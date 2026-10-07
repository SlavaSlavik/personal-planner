(function(root){
  'use strict';
  const COLORS=['#f4c6d7','#e99ab7','#d96a91','#c8b5d9','#f2b99f','#e3c9ae'];
  const REPLACED_COLORS={'#e8b9d6':'#f4c6d7','#d7c7ed':'#c8b5d9','#f4ceba':'#f2b99f','#e7d6bb':'#e3c9ae','#cfe3d7':'#e3c9ae'};
  const DATE=/^\d{4}-\d{2}-\d{2}$/;
  const id=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const date=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d,12)};
  const validDate=s=>typeof s==='string'&&DATE.test(s)&&key(date(s))===s&&Number(s.slice(0,4))>=1900&&Number(s.slice(0,4))<=9999;
  const addDays=(s,n)=>{const d=date(s);d.setDate(d.getDate()+n);return key(d)};
  const monday=s=>addDays(s,-((date(s).getDay()+6)%7));
  const utc=s=>{const [y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d)};
  const distance=(a,b)=>Math.round((utc(a)-utc(b))/86400000);
  const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  const color=v=>typeof v==='string'&&/^#[\da-f]{6}$/i.test(v)?REPLACED_COLORS[v.toLowerCase()]||v:COLORS[0];
  const task=t=>({...t,id:t.id||id(),text:t.text||'',done:!!t.done,priority:!!t.priority,displayPlanner:t.displayPlanner!==false,displayCalendar:t.displayCalendar!==false,color:color(t.color)});
  function normalize(value={}){
    const s=JSON.parse(JSON.stringify(value));
    for(const k of Object.keys(s))if(DATE.test(k)&&Array.isArray(s[k]))s[k]=s[k].map(task);
    s.weeks||={};s.months||={};s.series||=[];s.habits||=[];s.stickers||=[];s.preferences||={};s.version=7;
    for(const series of s.series){series.task=task(series.task);for(const item of Object.values(series.exceptions||{}))if(item?.color)item.color=color(item.color)}
    for(const sticker of s.stickers)if(sticker.color)sticker.color=color(sticker.color);
    for(const w of Object.values(s.weeks)){
      w.focus=Array.isArray(w.focus)?w.focus.map(String):['','',''];w.sideTasks=(w.sideTasks||[]).map(task);w.thoughts||='';w.result||={};
      for(const k of ['win','lesson','carry'])w.result[k]||='';
    }
    for(const m of Object.values(s.months)){
      m.focus||='';m.notes||='';m.spheres||={};
      for(const k of ['finance','blog','personal','health']){const old=m.spheres[k],items=Array.isArray(old)?old:old?.items||[];m.spheres[k]={goal:Array.isArray(old)?'':old?.goal||'',items:items.map(v=>task(typeof v==='string'?{text:v}:v))}}
    }return s;
  }
  function occurs(x,day){
    if(day<x.start||(x.rule.until&&day>x.rule.until))return false;
    const r=x.rule,n=r.interval||1;
    if(r.type==='daily')return distance(day,x.start)%n===0;
    if(r.type==='cycle')return distance(day,x.start)%(r.workDays+r.restDays)<r.workDays;
    if(r.type==='weekly')return distance(monday(day),monday(x.start))%(n*7)===0&&r.days.includes((date(day).getDay()+6)%7);
    if(r.type==='monthly'){const a=date(x.start),b=date(day),delta=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth(),last=new Date(b.getFullYear(),b.getMonth()+1,0).getDate();return delta%n===0&&b.getDate()===Math.min(a.getDate(),last)}
    return false;
  }
  function tasksFor(s,day){
    const out=(s[day]||[]).map(t=>({...t,day}));
    for(const x of s.series){if(!occurs(x,day)||x.exceptions?.[day]===null)continue;out.push({...x.task,...x.exceptions?.[day],id:`${x.id}@${day}`,seriesId:x.id,day})}return out;
  }
  function complete(s,item,value){if(item.seriesId){const x=s.series.find(x=>x.id===item.seriesId);x.exceptions||={};x.exceptions[item.day]={...x.exceptions[item.day],done:value}}else{const t=(s[item.day]||[]).find(t=>t.id===item.id);if(t)t.done=value}}
  function remove(s,item,scope='one'){if(item.seriesId){if(scope==='all')s.series=s.series.filter(x=>x.id!==item.seriesId);else{const x=s.series.find(x=>x.id===item.seriesId);x.exceptions||={};x.exceptions[item.day]=null}}else s[item.day]=(s[item.day]||[]).filter(t=>t.id!==item.id)}
  function put(s,day,values,rule=null,item=null,scope='one'){
    const t=task({...values,id:item?.seriesId?id():item?.id||id()});
    if(item?.seriesId&&scope==='all'){
      const x=s.series.find(x=>x.id===item.seriesId);
      if(rule){x.task={...t,done:false};x.rule=rule;if(day!==item.day)x.start=day}
      else{remove(s,item,'all');(s[day]||=[]).push(t)}return;
    }
    if(item)remove(s,item);if(rule)s.series.push({id:id(),start:day,task:{...t,done:false},rule,exceptions:{}});else(s[day]||=[]).push(t);
  }
  function validate(value){
    const s=value?.format==='personal-planner'?value.data:value;
    const fail=()=>{throw new Error('Файл не похож на резервную копию ежедневника.')};
    if(!object(s)||!Object.keys(s).length)fail();
    const text=v=>typeof v==='string'&&v.length<=100000,list=(v,f)=>Array.isArray(v)&&v.length<=50000&&v.every(f),opt=(v,f)=>v===undefined||f(v);
    const t=x=>object(x)&&text(x.text)&&opt(x.id,text)&&opt(x.color,v=>/^#[\da-f]{6}$/i.test(v))&&['done','priority','displayPlanner','displayCalendar'].every(k=>opt(x[k],v=>typeof v==='boolean'));
    const count=n=>Number.isInteger(n)&&n>=1&&n<=365;
    const rule=r=>object(r)&&['daily','weekly','monthly','cycle'].includes(r.type)&&count(r.interval)&&opt(r.until,v=>v===null||v===''||validDate(v))&&(r.type!=='weekly'||(list(r.days,v=>Number.isInteger(v)&&v>=0&&v<=6)&&r.days.length>0))&&(r.type!=='cycle'||(count(r.workDays)&&count(r.restDays)));
    for(const[k,v]of Object.entries(s)){
      if(DATE.test(k)){if(!validDate(k)||!list(v,t))fail();continue}
      if(k==='version'){if(!Number.isInteger(v))fail();continue}
      if(k==='preferences'){if(!object(v)||!opt(v.largeText,x=>typeof x==='boolean'))fail();continue}
      if(k==='weeks'){
        if(!object(v))fail();for(const[day,w]of Object.entries(v))if(!validDate(day)||!object(w)||!opt(w.focus,x=>list(x,text))||!opt(w.sideTasks,x=>list(x,t))||!opt(w.thoughts,text)||!opt(w.result,x=>object(x)&&Object.values(x).every(text)))fail();continue;
      }
      if(k==='months'){
        if(!object(v))fail();for(const[month,m]of Object.entries(v)){
          if(!/^\d{4}-\d{2}$/.test(month)||!validDate(`${month}-01`)||!object(m)||!opt(m.focus,text)||!opt(m.notes,text)||!opt(m.spheres,object))fail();
          for(const sphere of Object.values(m.spheres||{}))if(!(Array.isArray(sphere)?list(sphere,x=>text(x)||t(x)):object(sphere)&&opt(sphere.goal,text)&&opt(sphere.items,x=>list(x,t))))fail();
        }continue;
      }
      if(k==='series'){
        if(!list(v,x=>object(x)&&text(x.id)&&validDate(x.start)&&t(x.task)&&rule(x.rule)&&opt(x.exceptions,e=>object(e)&&Object.entries(e).every(([day,p])=>validDate(day)&&(p===null||object(p)&&Object.keys(p).every(k=>['done','priority','text','color','displayPlanner','displayCalendar'].includes(k))&&['done','priority','displayPlanner','displayCalendar'].every(k=>opt(p[k],z=>typeof z==='boolean'))&&opt(p.text,text)&&opt(p.color,z=>/^#[\da-f]{6}$/i.test(z)))))))fail();continue;
      }
      if(k==='habits'){if(!list(v,x=>object(x)&&text(x.id)&&text(x.title)&&text(x.note)&&['drop','run','book','leaf','moon','star'].includes(x.icon)&&Number.isInteger(x.target)&&x.target>=1&&x.target<=7&&object(x.marks)&&Object.entries(x.marks).every(([day,done])=>validDate(day)&&typeof done==='boolean')))fail();continue}
      if(k==='stickers'){if(!list(v,x=>object(x)&&text(x.id)&&text(x.title)&&text(x.body)&&['note','list'].includes(x.type)&&/^#[\da-f]{6}$/i.test(x.color)&&list(x.items,y=>object(y)&&text(y.id)&&text(y.text)&&typeof y.done==='boolean')))fail();continue}
      fail();
    }return normalize(s);
  }
  const api={COLORS,id,key,date,validDate,addDays,monday,distance,task,normalize,occurs,tasksFor,complete,remove,put,validate};
  if(typeof module!=='undefined')module.exports=api;else root.PlannerModel=api;
})(globalThis);

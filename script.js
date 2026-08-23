const DAYS=["ПН","ВТ","СР","ЧТ","ПТ","СБ","ВС"];
const MONTHS=["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];
const MONTHS_GEN=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const COLORS=["#F4C6D7","#E99AB7","#D96A91","#C8B5D9","#F2B99F","#E3C9AE"];
const KEY="personal-planner-v06", OLD_KEYS=["personal-planner-v04","personal-planner-v03","personal-planner-v02"];
let state={};
for(const k of [KEY,...OLD_KEYS]){const raw=localStorage.getItem(k);if(raw){try{state=JSON.parse(raw);break}catch{}}}
let section="month",monthOffset=0,weekOffset=0,view="primary",editing=null,dayModalKey=null,selectedColor=COLORS[0];
const $=id=>document.getElementById(id);
const calendarGrid=$("calendarGrid"),weekGrid=$("weekGrid"),focusPage=$("focusPage"),monthPage=$("monthPage"),weekPage=$("weekPage"),title=$("periodTitle"),modal=$("taskModal"),dayModal=$("dayModal"),input=$("taskInput"),dateInput=$("dateInput"),priority=$("priorityInput"),plannerInput=$("plannerInput"),calendarInput=$("calendarInput");

function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function uid(){return crypto.randomUUID?crypto.randomUUID():`id-${Date.now()}-${Math.random().toString(16).slice(2)}`}
function dateFromKey(k){const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d,12)}
function key(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function mondayFrom(d){const x=new Date(d);x.setHours(12,0,0,0);const n=(x.getDay()+6)%7;x.setDate(x.getDate()-n);return x}
function monday(o){const d=mondayFrom(new Date());d.setDate(d.getDate()+o*7);return d}
function monthDate(o){return new Date(new Date().getFullYear(),new Date().getMonth()+o,1,12)}
function monthKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`}
function tasks(k){return state[k]||(state[k]=[])}
function normalizeTask(t){if(!t.id)t.id=uid();if(t.displayPlanner===undefined)t.displayPlanner=true;if(t.displayCalendar===undefined)t.displayCalendar=true;if(!t.color)t.color=COLORS[0];if(t.done===undefined)t.done=false;if(t.priority===undefined)t.priority=false;return t}
function allTaskDates(){return Object.keys(state).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k))}
function normalizeState(){for(const k of allTaskDates())if(Array.isArray(state[k]))state[k].forEach(normalizeTask);if(!state.weeks)state.weeks={};if(!state.months)state.months={};save()}
normalizeState();

function weekData(){const k=key(monday(weekOffset));if(!state.weeks[k])state.weeks[k]={focus:["","",""],sideTasks:[],thoughts:"",result:{win:"",lesson:"",carry:""}};const w=state.weeks[k];if(!Array.isArray(w.focus))w.focus=["","",""];while(w.focus.length<3)w.focus.push("");w.focus=w.focus.slice(0,3);if(!Array.isArray(w.sideTasks))w.sideTasks=[];if(!w.result)w.result={win:"",lesson:"",carry:""};for(const k of ["win","lesson","carry"])if(w.result[k]===undefined)w.result[k]="";return w}
function toChecklist(value){if(Array.isArray(value))return value.map(x=>typeof x==="string"?{id:uid(),text:x,done:false}:({...x,id:x.id||uid(),text:x.text||"",done:!!x.done}));return []}
function monthData(){const d=monthDate(monthOffset),k=monthKey(d);if(!state.months[k])state.months[k]={focus:"",goals:[],plans:[],spheres:{finance:[],blog:[],personal:[],health:[]},notes:""};const m=state.months[k];m.goals=toChecklist(m.goals);m.plans=toChecklist(m.plans);if(!m.spheres)m.spheres={};for(const s of ["finance","blog","personal","health"]){m.spheres[s]=toChecklist(m.spheres[s]);}if(m.notes===undefined)m.notes="";return m}

function renderHeader(){
  if(section==="month"){
    const d=monthDate(monthOffset);title.textContent=`${MONTHS[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;$('todayBtn').style.display="";
    $('prevPeriod').onclick=()=>{monthOffset--;renderMonthLikeCurrent()};$('nextPeriod').onclick=()=>{monthOffset++;renderMonthLikeCurrent()};$('todayBtn').onclick=()=>{monthOffset=0;renderMonthLikeCurrent()};
  }else{
    const d=monday(weekOffset),e=new Date(d);e.setDate(e.getDate()+6);title.textContent=d.getMonth()===e.getMonth()?`${d.getDate()} — ${e.getDate()} ${MONTHS_GEN[e.getMonth()].toUpperCase()}`:`${d.getDate()} ${MONTHS_GEN[d.getMonth()].toUpperCase()} — ${e.getDate()} ${MONTHS_GEN[e.getMonth()].toUpperCase()}`;$('todayBtn').style.display="none";
    $('prevPeriod').onclick=()=>{weekOffset--;renderWeekLikeCurrent()};$('nextPeriod').onclick=()=>{weekOffset++;renderWeekLikeCurrent()};
  }
}
function renderMonthLikeCurrent(){renderHeader();if(view==="primary")renderMonth();else renderMonthFocus()}
function renderWeekLikeCurrent(){renderHeader();if(view==="primary")renderWeek();else renderFocus()}

function renderMonth(){
  const d=monthDate(monthOffset),first=mondayFrom(new Date(d.getFullYear(),d.getMonth(),1,12));calendarGrid.innerHTML="";
  for(let i=0;i<42;i++){
    const x=new Date(first);x.setDate(first.getDate()+i);const k=key(x),cell=document.createElement("div");cell.className="calendar-cell"+(x.getMonth()!==d.getMonth()?" outside":"")+(k===key(new Date())?" today":"");
    const visible=tasks(k).map(normalizeTask).filter(t=>t.displayCalendar);const max=window.innerWidth<=390?4:5;
    cell.innerHTML=`<span class="day-number">${x.getDate()}</span><div class="calendar-tasks"></div>`;const list=cell.querySelector(".calendar-tasks");
    visible.slice(0,max).forEach(t=>{const b=document.createElement("button");b.className="calendar-task";b.style.background=t.color;b.textContent=t.text;b.title=t.text;b.onclick=e=>{e.stopPropagation();openTask(k,t.id)};list.appendChild(b)});
    if(visible.length>max){const more=document.createElement("button");more.className="calendar-more";more.textContent=`+${visible.length-max}`;more.onclick=e=>{e.stopPropagation();openDay(k)};list.appendChild(more)}
    cell.onclick=()=>openDay(k);calendarGrid.appendChild(cell)
  }
  save();
}

function renderWeek(){
  weekGrid.innerHTML="";const d=monday(weekOffset),arr=[];for(let i=0;i<7;i++){const x=new Date(d);x.setDate(d.getDate()+i);arr.push({date:x,key:key(x),name:DAYS[i]})}
  arr.slice(0,5).forEach(x=>weekGrid.appendChild(card(x)));weekGrid.appendChild(card(arr[5],true));weekGrid.appendChild(card(arr[6],true));
}
function card(day,weekend=false){
  const c=document.createElement("article");c.className=weekend?"weekend-day":"day-card";c.innerHTML=`<div class="day-head"><h2>${day.name} <span>${day.date.getDate()}</span></h2><button class="more-day" aria-label="Открыть день">•••</button></div><div class="tasks"></div><button class="add-task">＋&nbsp; Добавить задачу</button>`;
  const box=c.querySelector(".tasks");tasks(day.key).map(normalizeTask).filter(t=>t.displayPlanner).forEach(t=>{
    const r=document.createElement("div");r.className="task-row"+(t.done?" completed":"");r.dataset.id=t.id;r.innerHTML=`<span class="drag-handle" aria-hidden="true">⋮⋮</span><input class="task-check" type="checkbox" ${t.done?"checked":""}>${t.priority?'<button class="priority-star" aria-label="Снять главную">★</button>':""}<button class="task-text"></button>`;
    r.querySelector(".task-text").textContent=t.text;r.querySelector(".task-check").onchange=e=>{t.done=e.target.checked;save();r.classList.toggle("completed",t.done)};r.querySelector(".task-text").onclick=e=>{e.stopPropagation();openTask(day.key,t.id)};r.querySelector(".priority-star")?.addEventListener("click",e=>{e.stopPropagation();t.priority=false;save();renderWeek()});enableDrag(r,box,day.key);box.appendChild(r)
  });
  c.querySelector(".add-task").onclick=e=>{e.stopPropagation();openTask(day.key)};c.querySelector(".more-day").onclick=e=>{e.stopPropagation();openDay(day.key)};c.onclick=()=>openDay(day.key);return c
}
function enableDrag(row,box,dayKey){let hold=null,dragging=false;row.addEventListener("pointerdown",e=>{if(e.target.closest("button,input"))return;hold=setTimeout(()=>{dragging=true;row.classList.add("dragging");try{row.setPointerCapture(e.pointerId)}catch{}},350)});row.addEventListener("pointermove",e=>{if(!dragging)return;const rows=[...box.querySelectorAll(".task-row:not(.dragging)")],target=rows.find(el=>e.clientY<el.getBoundingClientRect().top+el.offsetHeight/2);box.querySelectorAll(".drag-over").forEach(el=>el.classList.remove("drag-over"));if(target)target.classList.add("drag-over")});row.addEventListener("pointerup",finish);row.addEventListener("pointercancel",finish);function finish(e){clearTimeout(hold);if(!dragging)return;dragging=false;row.classList.remove("dragging");const rows=[...box.querySelectorAll(".task-row:not(.dragging)")],target=rows.find(el=>e.clientY<el.getBoundingClientRect().top+el.offsetHeight/2),arr=tasks(dayKey),from=arr.findIndex(t=>t.id===row.dataset.id);if(from<0)return;if(target){let to=arr.findIndex(t=>t.id===target.dataset.id);const item=arr.splice(from,1)[0];if(from<to)to--;arr.splice(to,0,item)}else arr.push(...arr.splice(from,1));save();renderWeek()}}

function openDay(dayKey){dayModalKey=dayKey;const d=dateFromKey(dayKey);$("dayModalTitle").textContent=`${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;renderDayList();dayModal.classList.remove("hidden")}
function renderDayList(){const list=$("dayTaskList");list.innerHTML="";const items=tasks(dayModalKey).map(normalizeTask);if(!items.length)list.innerHTML='<div class="day-add-empty">На этот день пока ничего не запланировано.</div>';items.forEach(t=>{const row=document.createElement("div");row.className="day-task";const modes=[t.displayPlanner?"Планер":"",t.displayCalendar?"Календарь":""].filter(Boolean).join(" + ")||"Скрыта";row.innerHTML=`<span class="day-task-color" style="background:${t.color}"></span><div class="day-task-main"><div class="day-task-name"></div><div class="day-task-meta">${modes}${t.done?" · выполнена":""}</div></div><button class="day-task-edit">Изменить</button>`;row.querySelector(".day-task-name").textContent=t.text;row.querySelector(".day-task-edit").onclick=()=>openTask(dayModalKey,t.id);list.appendChild(row)})}
function closeDay(){dayModal.classList.add("hidden");dayModalKey=null}

function openTask(day,id=null){editing={day,id};const t=id?tasks(day).find(x=>x.id===id):null;$("modalTitle").textContent=t?"Редактировать задачу":"Новая задача";dateInput.value=day;input.value=t?.text||"";plannerInput.checked=t?t.displayPlanner!==false:true;calendarInput.checked=t?t.displayCalendar!==false:true;priority.checked=!!t?.priority;selectedColor=t?.color||COLORS[0];renderPalette();$("deleteTask").classList.toggle("hidden",!t);modal.classList.remove("hidden");setTimeout(()=>input.focus(),0)}
function closeTask(){modal.classList.add("hidden");editing=null}
function renderPalette(){const p=$("colorPalette");p.innerHTML="";COLORS.forEach(c=>{const b=document.createElement("button");b.type="button";b.className="color-choice"+(c===selectedColor?" selected":"");b.style.background=c;b.setAttribute("aria-label","Цвет");b.onclick=()=>{selectedColor=c;renderPalette()};p.appendChild(b)})}
function refreshAfterTask(){closeTask();if(dayModalKey)renderDayList();if(section==="month"){renderHeader();view==="primary"?renderMonth():renderMonthFocus()}else{renderHeader();view==="primary"?renderWeek():renderFocus()}}

function renderFocus(){
  const w=weekData();focusPage.className="focus-page";
  focusPage.innerHTML=`
    <section class="focus-block"><div class="focus-title"><h2>Фокус недели</h2></div><div class="focus-list" id="focusList"></div><button class="focus-add" id="addFocus">＋ Добавить</button></section>
    <section class="focus-block"><div class="focus-title"><h2>Задачи</h2></div><div class="focus-list" id="sideList"></div><button class="focus-add-task" id="addSide">＋ Добавить задачу</button></section>
    <section class="focus-block"><div class="focus-title"><h2>Мысли</h2></div><textarea class="focus-note" id="thoughts"></textarea></section>
    <section class="focus-block"><div class="focus-title"><h2>Итог</h2></div><div class="result-list"><label class="result-field"><span>Победа</span><textarea id="win"></textarea></label><label class="result-field"><span>Урок недели</span><textarea id="lesson"></textarea></label><label class="result-field"><span>Перенос</span><textarea id="carry"></textarea></label></div></section>`;
  const list=$("focusList");w.focus.forEach((text,i)=>{const item=document.createElement("div");item.className="focus-item";item.innerHTML=`<span>${i+1}.</span><input type="text" maxlength="120"><button class="remove-focus" aria-label="Удалить">×</button>`;const field=item.querySelector("input");field.value=text;field.oninput=e=>{w.focus[i]=e.target.value;save()};item.querySelector(".remove-focus").onclick=()=>{w.focus.splice(i,1);while(w.focus.length<3)w.focus.push("");save();renderFocus()};list.appendChild(item)});
  $("addFocus").style.display=w.focus.filter(Boolean).length>=3?"none":"block";$("addFocus").onclick=()=>{const i=w.focus.findIndex(x=>!x);if(i>=0){const fields=list.querySelectorAll("input");fields[i]?.focus();return}w.focus.push("");save();renderFocus();setTimeout(()=>list.querySelector("input:last-of-type")?.focus(),0)};
  const side=$("sideList");w.sideTasks.forEach((t,i)=>{const row=document.createElement("div");row.className="side-task";row.innerHTML=`<input type="checkbox" ${t.done?"checked":""}><button></button><button class="remove-focus" aria-label="Удалить">×</button>`;row.querySelector("button").textContent=t.text;row.querySelector("input").onchange=e=>{t.done=e.target.checked;save()};row.querySelector("button").onclick=()=>{const text=prompt("Изменить задачу",t.text);if(text!==null&&text.trim()){t.text=text.trim();save();renderFocus()}};row.querySelector(".remove-focus").onclick=()=>{w.sideTasks.splice(i,1);save();renderFocus()};side.appendChild(row)});
  $("addSide").onclick=()=>{const row=document.createElement("div");row.className="side-task add-inline";row.innerHTML=`<input class="new-side-input" maxlength="120" placeholder="Новая задача"><button class="save-inline">Готово</button>`;side.appendChild(row);const el=row.querySelector(".new-side-input");el.focus();const finish=()=>{const text=el.value.trim();if(text)w.sideTasks.push({id:uid(),text,done:false});save();renderFocus()};row.querySelector(".save-inline").onclick=finish;el.onkeydown=e=>{if(e.key==="Enter")finish();if(e.key==="Escape")renderFocus()}};
  $("thoughts").value=w.thoughts;$("thoughts").oninput=()=>{w.thoughts=$("thoughts").value;save()};
  ["win","lesson","carry"].forEach(k=>{$(k).value=w.result[k];$(k).oninput=()=>{w.result[k]=$(k).value;save()}});
}

function renderMonthFocus(){
  const m=monthData();focusPage.className="month-focus-page";
  focusPage.innerHTML=`
    <section class="focus-block month-focus-hero"><div class="focus-title"><h2>ФОКУС МЕСЯЦА</h2></div><textarea class="focus-note" id="monthFocus" placeholder="На чём мой главный фокус в этом месяце?"></textarea></section>
    <div class="month-focus-columns">
      <section class="focus-block month-list-block"><div class="focus-title"><h2>ЦЕЛИ</h2></div><div class="month-list" id="monthGoals"></div><button class="block-add" id="addGoal">＋ Добавить цель</button></section>
      <section class="focus-block month-list-block"><div class="focus-title"><h2>ПЛАНЫ</h2></div><div class="month-list" id="monthPlans"></div><button class="block-add" id="addPlan">＋ Добавить план</button></section>
    </div>
    <section class="focus-block sphere-block"><div class="focus-title"><h2>СФЕРЫ ЖИЗНИ</h2></div><div class="sphere-grid">
      <div class="sphere-card finance"><div class="sphere-head"><div class="sphere-icon">▱</div><div class="sphere-name">ФИНАНСЫ</div></div><div class="sphere-list" id="sphere-finance"></div><button class="block-add" data-sphere="finance">＋ Добавить</button></div>
      <div class="sphere-card blog"><div class="sphere-head"><div class="sphere-icon">▷</div><div class="sphere-name">БЛОГ</div></div><div class="sphere-list" id="sphere-blog"></div><button class="block-add" data-sphere="blog">＋ Добавить</button></div>
      <div class="sphere-card personal"><div class="sphere-head"><div class="sphere-icon">♡</div><div class="sphere-name">ЛИЧНОЕ</div></div><div class="sphere-list" id="sphere-personal"></div><button class="block-add" data-sphere="personal">＋ Добавить</button></div>
      <div class="sphere-card health"><div class="sphere-head"><div class="sphere-icon">♢</div><div class="sphere-name">ЗДОРОВЬЕ</div></div><div class="sphere-list" id="sphere-health"></div><button class="block-add" data-sphere="health">＋ Добавить</button></div>
    </div></section>
    <section class="focus-block notes-block"><div class="focus-title"><h2>ЗАМЕТКИ</h2></div><textarea class="focus-note" id="monthNotes" placeholder="Любые мысли, идеи, важные заметки..."></textarea></section>`;
  $("monthFocus").value=m.focus||"";$("monthFocus").oninput=()=>{m.focus=$("monthFocus").value;save()};$("monthNotes").value=m.notes||"";$("monthNotes").oninput=()=>{m.notes=$("monthNotes").value;save()};
  renderMonthList("monthGoals",m.goals,"goal");renderMonthList("monthPlans",m.plans,"plan");
  $("addGoal").onclick=()=>addMonthItem(m.goals,"monthGoals");$("addPlan").onclick=()=>addMonthItem(m.plans,"monthPlans");
  for(const s of ["finance","blog","personal","health"]){renderSphere(s,m.spheres[s]);focusPage.querySelector(`[data-sphere="${s}"]`).onclick=()=>addSphereItem(s,m)}
}
function renderMonthList(id,arr){
  const box=$(id);box.innerHTML="";
  arr.forEach((item,i)=>{
    const row=document.createElement("div");row.className="check-item"+(item.done?" done":"");
    row.innerHTML=`<input type="checkbox" ${item.done?"checked":""}><input class="check-text-input" type="text" maxlength="120" placeholder="Добавить пункт"><button class="item-delete" aria-label="Удалить">×</button>`;
    const text=row.querySelector(".check-text-input");text.value=item.text||"";text.oninput=()=>{item.text=text.value;save()};text.onblur=()=>{if(!item.text.trim()&&arr.length>1){arr.splice(i,1);save();renderMonthFocus()}};
    row.querySelector("input[type=checkbox]").onchange=e=>{item.done=e.target.checked;save();row.classList.toggle("done",item.done)};
    row.querySelector(".item-delete").onclick=()=>{arr.splice(i,1);save();renderMonthFocus()};box.appendChild(row)
  });
}
function addMonthItem(arr,id){arr.push({id:uid(),text:"",done:false});save();renderMonthFocus();setTimeout(()=>{const box=$(id);const inputs=box?.querySelectorAll(".check-text-input");inputs?.[inputs.length-1]?.focus()},0)}
function renderSphere(s,mItems){
  const box=$("sphere-"+s);box.innerHTML="";
  mItems.forEach((item,i)=>{
    const row=document.createElement("div");row.className="check-item"+(item.done?" done":"");
    row.innerHTML=`<input type="checkbox" ${item.done?"checked":""}><input class="check-text-input" type="text" maxlength="100" placeholder="Добавить"><button class="item-delete" aria-label="Удалить">×</button>`;
    const text=row.querySelector(".check-text-input");text.value=item.text||"";text.oninput=()=>{item.text=text.value;save()};text.onblur=()=>{if(!item.text.trim()&&mItems.length>1){mItems.splice(i,1);save();renderMonthFocus()}};
    row.querySelector("input[type=checkbox]").onchange=e=>{item.done=e.target.checked;save();row.classList.toggle("done",item.done)};
    row.querySelector(".item-delete").onclick=()=>{mItems.splice(i,1);save();renderMonthFocus()};box.appendChild(row)
  })
}
function addSphereItem(s,m){m.spheres[s].push({id:uid(),text:"",done:false});save();renderMonthFocus();setTimeout(()=>{$("sphere-"+s).querySelector(".check-text-input:last-of-type")?.focus()},0)}

function setSection(next){section=next;view="primary";$("floatingAdd").classList.toggle("hidden",section!=="month");$("monthNav").classList.toggle("selected",section==="month");$("weekNav").classList.toggle("selected",section==="week");$("primaryTab").textContent=section==="month"?"Месяц":"Разворот";$("secondaryTab").textContent="Фокус";if(section==="month"){$("monthPage").classList.remove("hidden");$("weekPage").classList.add("hidden");$("focusPage").classList.add("hidden");renderMonth()}else{$("monthPage").classList.add("hidden");$("weekPage").classList.remove("hidden");$("focusPage").classList.add("hidden");renderWeek()}renderHeader()}
function setView(next){view=next;$("primaryTab").classList.toggle("active",view==="primary");$("secondaryTab").classList.toggle("active",view==="secondary");if(section==="month"){$("monthPage").classList.toggle("hidden",view!=="primary");$("weekPage").classList.add("hidden");$("focusPage").classList.toggle("hidden",view!=="secondary");if(view==="secondary")renderMonthFocus()}else{$("monthPage").classList.add("hidden");$("weekPage").classList.toggle("hidden",view!=="primary");$("focusPage").classList.toggle("hidden",view!=="secondary");if(view==="secondary")renderFocus()}}

function globalAdd(){const d=section==="month"?key(monthDate(monthOffset)):key(monday(weekOffset));openTask(d)}
function swipePeriod(dir){if(section==="month"){monthOffset+=dir;renderMonthLikeCurrent()}else{weekOffset+=dir;renderWeekLikeCurrent()}}
let touchStart=null;
$("contentSurface").addEventListener("touchstart",e=>{if(e.touches.length!==1)return;const t=e.touches[0];touchStart={x:t.clientX,y:t.clientY}} ,{passive:true});
$("contentSurface").addEventListener("touchend",e=>{if(!touchStart)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.25)return;swipePeriod(dx<0?1:-1)},{passive:true});

$("prevPeriod").onclick=()=>section==="month"?swipePeriod(-1):swipePeriod(-1);$("nextPeriod").onclick=()=>swipePeriod(1);$("primaryTab").onclick=()=>setView("primary");$("secondaryTab").onclick=()=>setView("secondary");$("monthNav").onclick=()=>setSection("month");$("weekNav").onclick=()=>setSection("week");$("globalAdd").onclick=globalAdd;$("floatingAdd").onclick=globalAdd;$("closeDayModal").onclick=closeDay;$("closeModal").onclick=closeTask;$("dayModal").onclick=e=>{if(e.target===dayModal)closeDay()};$("taskModal").onclick=e=>{if(e.target===modal)closeTask()};$("dayAddTask").onclick=()=>openTask(dayModalKey);$("saveTask").onclick=()=>{const text=input.value.trim();if(!text||!editing)return;const newDay=dateInput.value;if(!newDay)return;const planner=plannerInput.checked,cal=calendarInput.checked,target=tasks(newDay);if(editing.id){const old=tasks(editing.day),t=old.find(x=>x.id===editing.id);if(!t)return;t.text=text;t.displayPlanner=planner;t.displayCalendar=cal;t.color=selectedColor;if(editing.day!==newDay){state[editing.day]=old.filter(x=>x.id!==editing.id);target.push(t)}if(planner&&priority.checked)target.forEach(x=>{if(x.id!==editing.id)x.priority=false});t.priority=planner&&priority.checked}else{if(planner&&priority.checked)target.forEach(x=>{x.priority=false});target.push({id:uid(),text,done:false,priority:planner&&priority.checked,displayPlanner:planner,displayCalendar:cal,color:selectedColor})}save();refreshAfterTask()};$("deleteTask").onclick=()=>{if(!editing?.id)return;state[editing.day]=tasks(editing.day).filter(t=>t.id!==editing.id);save();refreshAfterTask()};input.onkeydown=e=>{if(e.key==="Enter")$("saveTask").click();if(e.key==="Escape")closeTask()};
$("menuBtn").onclick=()=>{};$("periodCaret").onclick=()=>{};$("moreBtn").onclick=()=>{};$("habitsNav").onclick=()=>{};$("blogNav").onclick=()=>{};
renderPalette();setSection("month");

const DAYS=["ПН","ВТ","СР","ЧТ","ПТ","СБ","ВС"],MONTHS=["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"],MONTHS_GEN=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],COLORS=["#F4C6D7","#E99AB7","#D96A91","#C8B5D9","#F2B99F","#E3C9AE"];
const KEY="personal-planner-v06",OLD_KEYS=["personal-planner-v04","personal-planner-v03","personal-planner-v02"];
let state={};for(const k of [KEY,...OLD_KEYS]){const raw=localStorage.getItem(k);if(raw){try{state=JSON.parse(raw);break}catch{}}}
let section="month",monthOffset=0,weekOffset=0,view="primary",editing=null,dayModalKey=null,selectedColor=COLORS[0];
const $=id=>document.getElementById(id);const calendarGrid=$("calendarGrid"),weekGrid=$("weekGrid"),focusPage=$("focusPage"),monthPage=$("monthPage"),weekPage=$("weekPage"),title=$("periodTitle"),modal=$("taskModal"),dayModal=$("dayModal"),input=$("taskInput"),dateInput=$("dateInput"),priority=$("priorityInput"),plannerInput=$("plannerInput"),calendarInput=$("calendarInput");
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function dateFromKey(k){const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d,12)}
function key(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),n=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${n}`}
function mondayFrom(d){const x=new Date(d);x.setHours(12,0,0,0);const n=(x.getDay()+6)%7;x.setDate(x.getDate()-n);return x}
function monday(o){const d=mondayFrom(new Date());d.setDate(d.getDate()+o*7);return d}
function monthDate(o){const d=new Date(new Date().getFullYear(),new Date().getMonth()+o,1,12);return d}
function tasks(k){return state[k]||(state[k]=[])}
function normalizeTask(t){if(t.displayPlanner===undefined)t.displayPlanner=true;if(t.displayCalendar===undefined)t.displayCalendar=true;if(!t.color)t.color=COLORS[0];if(t.done===undefined)t.done=false;if(t.priority===undefined)t.priority=false;if(!t.id)t.id=crypto.randomUUID();return t}
function allTaskDates(){return Object.keys(state).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k))}
function normalizeState(){for(const k of allTaskDates())state[k].forEach(normalizeTask);if(!state.weeks)state.weeks={};save()}
normalizeState();
function weekData(){const k=key(monday(weekOffset));if(!state.weeks[k])state.weeks[k]={focus:["","",""],sideTasks:[],thoughts:"",result:{win:"",lesson:"",carry:""}};const w=state.weeks[k];if(!Array.isArray(w.focus))w.focus=["","",""];while(w.focus.length<3)w.focus.push("");w.focus=w.focus.slice(0,3);if(!Array.isArray(w.sideTasks))w.sideTasks=[];if(!w.result)w.result={win:"",lesson:"",carry:""};for(const k of ["win","lesson","carry"])if(w.result[k]===undefined)w.result[k]="";return w}
function monthKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`}
function monthData(){const d=monthDate(monthOffset),k=monthKey(d);if(!state.months)state.months={};if(!state.months[k])state.months[k]={focus:"",goals:["","",""],plans:["","",""],spheres:{finance:"",blog:"",personal:"",health:""},notes:""};const m=state.months[k];if(!Array.isArray(m.goals))m.goals=["","",""];if(!Array.isArray(m.plans))m.plans=["","",""];while(m.goals.length<3)m.goals.push("");while(m.plans.length<3)m.plans.push("");m.goals=m.goals.slice(0,3);m.plans=m.plans.slice(0,3);if(!m.spheres)m.spheres={finance:"",blog:"",personal:"",health:""};return m}
function setSection(next){section=next;view="primary";$("floatingAdd").classList.toggle("hidden",section!=="month");$("monthNav").classList.toggle("selected",section==="month");$("weekNav").classList.toggle("selected",section==="week");if(section==="month"){monthPage.classList.remove("hidden");weekPage.classList.add("hidden");focusPage.classList.add("hidden");$("primaryTab").textContent="Месяц";$("secondaryTab").textContent="Фокус";$("viewSwitch").classList.remove("hidden");renderMonth()}else{monthPage.classList.add("hidden");weekPage.classList.remove("hidden");focusPage.classList.add("hidden");$("primaryTab").textContent="Разворот";$("secondaryTab").textContent="Фокус";$("viewSwitch").classList.remove("hidden");renderWeek()}}
function renderHeader(){if(section==="month"){const d=monthDate(monthOffset);title.textContent=`${MONTHS[d.getMonth()]} ${d.getFullYear()}`;$("todayBtn").style.display="";$("prevPeriod").onclick=()=>{monthOffset--;renderMonth()};$("nextPeriod").onclick=()=>{monthOffset++;renderMonth()};$("todayBtn").onclick=()=>{monthOffset=0;renderMonth()}}else{const d=monday(weekOffset),e=new Date(d);e.setDate(e.getDate()+6);title.textContent=d.getMonth()===e.getMonth()?`${d.getDate()} — ${e.getDate()} ${MONTHS_GEN[e.getMonth()]}`:`${d.getDate()} ${MONTHS_GEN[d.getMonth()]} — ${e.getDate()} ${MONTHS_GEN[e.getMonth()]}`;$("todayBtn").style.display="none";$("prevPeriod").onclick=()=>{weekOffset--;renderWeek()};$("nextPeriod").onclick=()=>{weekOffset++;renderWeek()}}
}
function renderMonth(){renderHeader();const d=monthDate(monthOffset);const first=mondayFrom(new Date(d.getFullYear(),d.getMonth(),1,12));calendarGrid.innerHTML="";for(let i=0;i<42;i++){const x=new Date(first);x.setDate(first.getDate()+i);const k=key(x);const cell=document.createElement("div");cell.className="calendar-cell"+(x.getMonth()!==d.getMonth()?" outside":"")+(k===key(new Date())?" today":"");const visible=tasks(k).map(normalizeTask).filter(t=>t.displayCalendar);const max=window.innerWidth<=390?4:5;const shown=visible.slice(0,max);cell.innerHTML=`<span class="day-number">${x.getDate()}</span><div class="calendar-tasks"></div>`;const list=cell.querySelector(".calendar-tasks");shown.forEach(t=>{const b=document.createElement("button");b.className="calendar-task";b.style.background=t.color;b.textContent=t.text;b.title=t.text;b.onclick=e=>{e.stopPropagation();openTask(k,t.id)};list.appendChild(b)});if(visible.length>max){const more=document.createElement("button");more.className="calendar-more";more.textContent=`+${visible.length-max}`;more.onclick=e=>{e.stopPropagation();openDay(k)};list.appendChild(more)}cell.onclick=()=>openDay(k);calendarGrid.appendChild(cell)}save()}
function renderWeek(){renderHeader();weekGrid.innerHTML="";const d=monday(weekOffset),arr=[];for(let i=0;i<7;i++){const x=new Date(d);x.setDate(d.getDate()+i);arr.push({date:x,key:key(x),name:DAYS[i]})}arr.slice(0,5).forEach(x=>weekGrid.appendChild(card(x)));weekGrid.appendChild(card(arr[5],true));weekGrid.appendChild(card(arr[6],true));if(view==="secondary")renderFocus()}
function card(day,weekend=false){const c=document.createElement("article");c.className=weekend?"weekend-day":"day-card";c.innerHTML=`<div class="day-head"><h2>${day.name} <span>${day.date.getDate()}</span></h2><button class="more-day" aria-label="Открыть день">•••</button></div><div class="tasks"></div><button class="add-task">＋&nbsp; Добавить задачу</button>`;const box=c.querySelector(".tasks");const visible=tasks(day.key).map(normalizeTask).filter(t=>t.displayPlanner);visible.forEach((t,index)=>{const r=document.createElement("div");r.className="task-row"+(t.done?" completed":"");r.dataset.id=t.id;r.innerHTML=`<span class="drag-handle" aria-hidden="true">⋮⋮</span><input class="task-check" type="checkbox" ${t.done?"checked":""}>${t.priority?'<button class="priority-star" aria-label="Снять главную">★</button>':""}<button class="task-text"></button>`;r.querySelector(".task-text").textContent=t.text;r.querySelector(".task-check").onchange=e=>{t.done=e.target.checked;save();r.classList.toggle("completed",t.done)};r.querySelector(".task-text").onclick=e=>{e.stopPropagation();openTask(day.key,t.id)};r.querySelector(".priority-star")?.addEventListener("click",e=>{e.stopPropagation();t.priority=false;save();renderWeek()});enableDrag(r,box,day.key);box.appendChild(r)});c.querySelector(".add-task").onclick=e=>{e.stopPropagation();openTask(day.key)};c.querySelector(".more-day").onclick=e=>{e.stopPropagation();openDay(day.key)};c.onclick=()=>openDay(day.key);return c}
function enableDrag(row,box,dayKey){let hold=null,dragging=false;row.addEventListener("pointerdown",e=>{if(e.target.closest("button,input"))return;hold=setTimeout(()=>{dragging=true;row.classList.add("dragging");try{row.setPointerCapture(e.pointerId)}catch{}},350)});row.addEventListener("pointermove",e=>{if(!dragging)return;const rows=[...box.querySelectorAll(".task-row:not(.dragging)")],target=rows.find(el=>e.clientY<el.getBoundingClientRect().top+el.offsetHeight/2);box.querySelectorAll(".drag-over").forEach(el=>el.classList.remove("drag-over"));if(target)target.classList.add("drag-over")});row.addEventListener("pointerup",finish);row.addEventListener("pointercancel",finish);function finish(e){clearTimeout(hold);if(!dragging)return;dragging=false;row.classList.remove("dragging");const rows=[...box.querySelectorAll(".task-row:not(.dragging)")],target=rows.find(el=>e.clientY<el.getBoundingClientRect().top+el.offsetHeight/2),arr=tasks(dayKey),from=arr.findIndex(t=>t.id===row.dataset.id);if(from<0)return;if(target){let to=arr.findIndex(t=>t.id===target.dataset.id);const item=arr.splice(from,1)[0];if(from<to)to--;arr.splice(to,0,item)}else arr.push(...arr.splice(from,1));save();renderWeek()}}
function openDay(dayKey){dayModalKey=dayKey;const d=dateFromKey(dayKey);$("dayModalTitle").textContent=`${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;renderDayList();dayModal.classList.remove("hidden")}
function renderDayList(){const list=$("dayTaskList");list.innerHTML="";const items=tasks(dayModalKey).map(normalizeTask);if(!items.length){list.innerHTML='<div class="day-add-empty">На этот день пока ничего не запланировано.</div>'}items.forEach(t=>{const row=document.createElement("div");row.className="day-task";const modes=[t.displayPlanner?"Планер":"",t.displayCalendar?"Календарь":""].filter(Boolean).join(" + ")||"Скрыта";row.innerHTML=`<span class="day-task-color" style="background:${t.color}"></span><div class="day-task-main"><div class="day-task-name"></div><div class="day-task-meta">${modes}${t.done&&t.displayPlanner?" · выполнена":""}</div></div><button class="day-task-edit">Изменить</button>`;row.querySelector(".day-task-name").textContent=t.text;row.querySelector(".day-task-edit").onclick=()=>openTask(dayModalKey,t.id);list.appendChild(row)})}
function openTask(day,id=null){editing={day,id};const t=id?tasks(day).find(x=>x.id===id):null;$("modalTitle").textContent=t?"Редактировать задачу":"Новая задача";dateInput.value=day;input.value=t?.text||"";plannerInput.checked=t?t.displayPlanner!==false:true;calendarInput.checked=t?t.displayCalendar!==false:true;priority.checked=!!t?.priority;selectedColor=t?.color||COLORS[0];renderPalette();$("deleteTask").classList.toggle("hidden",!t);modal.classList.remove("hidden");setTimeout(()=>input.focus(),0)}
function renderPalette(){const p=$("colorPalette");p.innerHTML="";COLORS.forEach(c=>{const b=document.createElement("button");b.type="button";b.className="color-choice"+(selectedColor===c?" selected":"");b.style.background=c;b.setAttribute("aria-label",c);b.onclick=()=>{selectedColor=c;renderPalette()};p.appendChild(b)})}
function closeTask(){modal.classList.add("hidden");editing=null}
function closeDay(){dayModal.classList.add("hidden");dayModalKey=null}
function renderFocus(){
  const w=weekData();
  focusPage.innerHTML=`
    <section class="focus-block">
      <div class="focus-title"><h2>Фокус недели</h2></div>
      <div class="focus-list" id="focusList"></div>
      <button class="focus-add" id="addFocus">＋ Добавить</button>
    </section>
    <section class="focus-block">
      <div class="focus-title"><h2>Задачи</h2></div>
      <div class="focus-list" id="sideList"></div>
      <button class="focus-add-task" id="addSide">＋ Добавить задачу</button>
    </section>
    <section class="focus-block">
      <div class="focus-title"><h2>Мысли</h2></div>
      <textarea class="focus-note" id="thoughts"></textarea>
    </section>
    <section class="focus-block">
      <div class="focus-title"><h2>Итог</h2></div>
      <div class="result-list">
        <label class="result-field"><span>Победа</span><textarea id="win"></textarea></label>
        <label class="result-field"><span>Урок недели</span><textarea id="lesson"></textarea></label>
        <label class="result-field"><span>Перенос</span><textarea id="carry"></textarea></label>
      </div>
    </section>`;

  const list=$("focusList");
  w.focus.forEach((text,i)=>{
    const item=document.createElement("div");
    item.className="focus-item";
    item.innerHTML=`<span>${i+1}.</span><input type="text" maxlength="120"><button class="remove-focus" aria-label="Удалить">×</button>`;
    const field=item.querySelector("input");
    field.value=text;
    field.addEventListener("input",e=>{w.focus[i]=e.target.value;save()});
    item.querySelector(".remove-focus").onclick=()=>{
      w.focus[i]="";
      save();
      renderFocus();
    };
    list.appendChild(item);
  });

  const add=$("addFocus");
  add.style.display="none";

  const side=$("sideList");
  w.sideTasks.forEach((t,i)=>{
    const row=document.createElement("div");
    row.className="side-task";
    row.innerHTML=`<input type="checkbox" ${t.done?"checked":""}><button></button><button class="remove-focus" aria-label="Удалить">×</button>`;
    const editBtn=row.querySelector("button");
    editBtn.textContent=t.text;
    row.querySelector("input").onchange=e=>{t.done=e.target.checked;save()};
    editBtn.onclick=()=>{
      const text=prompt("Изменить задачу",t.text);
      if(text!==null&&text.trim()){t.text=text.trim();save();renderFocus()}
    };
    row.querySelector(".remove-focus").onclick=()=>{w.sideTasks.splice(i,1);save();renderFocus()};
    side.appendChild(row);
  });

  $("addSide").onclick=()=>{
    const row=document.createElement("div");
    row.className="side-task add-inline";
    row.innerHTML=`<input class="new-side-input" maxlength="120" placeholder="Новая задача"><button class="save-inline">Готово</button>`;
    side.appendChild(row);
    const el=row.querySelector(".new-side-input");
    el.focus();
    const finish=()=>{
      const text=el.value.trim();
      if(text)w.sideTasks.push({id:crypto.randomUUID(),text,done:false});
      save();
      renderFocus();
    };
    row.querySelector(".save-inline").onclick=finish;
    el.onkeydown=e=>{if(e.key==="Enter")finish();if(e.key==="Escape")renderFocus()};
  };

  const thoughts=$("thoughts");
  thoughts.value=w.thoughts||"";
  thoughts.oninput=()=>{w.thoughts=thoughts.value;save()};

  ["win","lesson","carry"].forEach(k=>{
    const el=$(k);
    el.value=w.result[k]||"";
    el.oninput=()=>{w.result[k]=el.value;save()};
  });
}
function renderMonthFocus(){
  const m=monthData();
  focusPage.innerHTML=`
    <section class="focus-block month-focus-hero"><div class="focus-title"><h2>Фокус месяца</h2></div><textarea class="focus-note" id="monthFocus"></textarea></section>
    <section class="focus-block"><div class="focus-title"><h2>Цели</h2></div><div class="focus-list" id="monthGoals"></div></section>
    <section class="focus-block"><div class="focus-title"><h2>Планы</h2></div><div class="focus-list" id="monthPlans"></div></section>
    <section class="focus-block month-spheres"><div class="focus-title"><h2>Сферы</h2></div><div class="sphere-grid">
      <label><span>💰 Финансы</span><input id="sphereFinance" maxlength="120"></label>
      <label><span>📝 Блог</span><input id="sphereBlog" maxlength="120"></label>
      <label><span>♡ Личное</span><input id="spherePersonal" maxlength="120"></label>
      <label><span>♡ Здоровье</span><input id="sphereHealth" maxlength="120"></label>
    </div><div class="focus-title month-notes-title"><h2>Заметки</h2></div><textarea class="focus-note" id="monthNotes"></textarea></section>`;
  $("monthFocus").value=m.focus||"";$("monthFocus").oninput=()=>{m.focus=$("monthFocus").value;save()};
  [["monthGoals",m.goals],["monthPlans",m.plans]].forEach(([id,arr])=>{const box=$(id);arr.forEach((text,i)=>{const row=document.createElement("div");row.className="focus-item";row.innerHTML=`<span>${i+1}.</span><input type="text" maxlength="120">`;const el=row.querySelector("input");el.value=text;el.oninput=()=>{arr[i]=el.value;save()};box.appendChild(row)})});
  const map={sphereFinance:"finance",sphereBlog:"blog",spherePersonal:"personal",sphereHealth:"health"};Object.entries(map).forEach(([id,k])=>{const el=$(id);el.value=m.spheres[k]||"";el.oninput=()=>{m.spheres[k]=el.value;save()}});
  $("monthNotes").value=m.notes||"";$("monthNotes").oninput=()=>{m.notes=$("monthNotes").value;save()};
}

function setView(next){view=next;$("primaryTab").classList.toggle("active",view==="primary");$("secondaryTab").classList.toggle("active",view==="secondary");if(section==="month"){monthPage.classList.toggle("hidden",view!=="primary");focusPage.classList.toggle("hidden",view!=="secondary");weekPage.classList.add("hidden");if(view==="secondary")renderMonthFocus()}else{weekPage.classList.toggle("hidden",view!=="primary");focusPage.classList.toggle("hidden",view!=="secondary");monthPage.classList.add("hidden");if(view==="secondary")renderFocus()}}
function globalAdd(){const day=section==="week"?key(monday(weekOffset)):key(new Date());openTask(day)}
$("primaryTab").onclick=()=>setView("primary");$("secondaryTab").onclick=()=>setView("secondary");$("prevPeriod").onclick=()=>{};$("nextPeriod").onclick=()=>{};
$("monthNav").onclick=()=>{section="month";view="primary";$("monthNav").classList.add("selected");$("weekNav").classList.remove("selected");setSection("month")};$("weekNav").onclick=()=>{section="week";view="primary";$("weekNav").classList.add("selected");$("monthNav").classList.remove("selected");setSection("week")};$("globalAdd").onclick=globalAdd;
$("closeModal").onclick=closeTask;$("closeDayModal").onclick=closeDay;$("dayAddTask").onclick=()=>{const k=dayModalKey;closeDay();openTask(k)};modal.onclick=e=>{if(e.target===modal)closeTask()};dayModal.onclick=e=>{if(e.target===dayModal)closeDay()};input.onkeydown=e=>{if(e.key==="Enter")$("saveTask").click();if(e.key==="Escape")closeTask()};
$("saveTask").onclick=()=>{const text=input.value.trim();if(!text||!editing)return;const newDay=dateInput.value;if(!newDay)return;const target=tasks(newDay);const planner=plannerInput.checked,cal=calendarInput.checked;if(editing.id){const old=tasks(editing.day),t=old.find(x=>x.id===editing.id);if(!t)return;t.text=text;t.displayPlanner=planner;t.displayCalendar=cal;t.color=selectedColor;if(editing.day!==newDay){state[editing.day]=old.filter(x=>x.id!==editing.id);target.push(t)}if(planner&&priority.checked)target.forEach(x=>{if(x.id!==editing.id)x.priority=false});t.priority=planner&&priority.checked}else{if(planner&&priority.checked)target.forEach(x=>x.priority=false);target.push({id:crypto.randomUUID(),text,done:false,priority:planner&&priority.checked,displayPlanner:planner,displayCalendar:cal,color:selectedColor})}save();const k=editing.day;const moved=editing.id&&k!==newDay;closeTask();if(dayModalKey){if(moved&&dayModalKey===k)openDay(k);else renderDayList()}if(section==="month")renderMonth();else renderWeek()};
$("deleteTask").onclick=()=>{if(!editing?.id)return;state[editing.day]=tasks(editing.day).filter(t=>t.id!==editing.id);save();const k=editing.day;closeTask();if(dayModalKey===k)renderDayList();if(section==="month")renderMonth();else renderWeek()};
$("floatingAdd").onclick=()=>globalAdd();$("menuBtn").onclick=()=>alert("Настройки и дополнительные разделы будут добавлены позже.");$("moreBtn").onclick=()=>alert("Дополнительные действия будут добавлены позже.");$("periodCaret").onclick=()=>alert("Выбор периода будет добавлен позже.");$("habitsNav").onclick=()=>alert("Раздел «Привычки» подключим следующим этапом.");$("blogNav").onclick=()=>alert("Раздел «Блог» подключим следующим этапом.");
setSection("month");renderPalette();

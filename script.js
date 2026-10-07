'use strict';
const M=PlannerModel,$=id=>document.getElementById(id);
const DAYS=['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
const MONTHS=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const COLOR_NAMES=['Розовый','Насыщенный розовый','Малиновый','Лиловый','Персиковый','Бежевый'];
const KEY='personal-planner-v06',OLD_KEYS=['personal-planner-v04','personal-planner-v03','personal-planner-v02'];
const PATHS={
  plus:'M12 5v14M5 12h14',minus:'M5 12h14',close:'m6 6 12 12M18 6 6 18',
  menu:'M5 6h14M5 12h14M5 18h14',more:'M5 12h.01M12 12h.01M19 12h.01',
  chevronLeft:'m15 5-7 7 7 7',chevronRight:'m9 5 7 7-7 7',chevronDown:'m6 9 6 6 6-6',
  calendar:'M8 3v4M16 3v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1M8 14h2M14 14h2M8 18h2',
  planner:'M8 3h11v18H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM8 3v18M12 8h4M12 12h4M12 16h3',
  note:'M5 3h14v14l-4 4H5ZM15 21v-4h4M8 8h8M8 12h8',
  leaf:'M20 4C9 2 2 7 5 14s14 8 15-10ZM5 14c4-4 8-6 12-7M12 10l1 6',
  star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z',
  moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
  drop:'M12 3c-2 4-7 9-7 13a7 7 0 0 0 14 0c0-4-5-9-7-13Z',
  run:'M15 4a1.8 1.8 0 1 0 0 .1M8 8l4-1 3 5 4 1M12 8l-3 6 5 2-2 5M9 14l-3 5H3',
  book:'M7 3h12v17H7a3 3 0 0 1 0-6h12M4 17V6a3 3 0 0 1 3-3M8 6h7',
  settings:'M10 3h4l1 3 3 1 3 3v4l-3 1-1 3-3 3h-4l-1-3-3-1-3-3v-4l3-1 1-3ZM15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0',
  edit:'m4 16 12-12 4 4-12 12H4ZM13 7l4 4',
  trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
  download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',upload:'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',
  target:'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0M17 12a5 5 0 1 0-10 0 5 5 0 0 0 10 0M12 10v4',
  heart:'M12 21 3 12C-1 6 6 1 12 7c6-6 13-1 9 5Z',wallet:'M4 5h15v15H4ZM4 5V3h13v2M14 11h7v5h-7Z',
  repeat:'m17 2 4 4-4 4M3 10V6h18M7 22l-4-4 4-4M21 14v4H3',up:'m6 14 6-6 6 6'
};
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${PATHS[name]||PATHS.note}"/></svg>`;
function icons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon))}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const head=(title,id)=>`<div class="modal-head"><h2 id="${id}">${title}</h2><button type="button" class="icon-btn" data-close aria-label="Закрыть">${icon('close')}</button></div>`;
const field=(label,id,extra='',type='text')=>`<label class="field"><span>${label}</span><input id="${id}" type="${type}" ${extra}></label>`;
const dateAttrs='min="1900-01-01" max="9999-12-31"';
$('dialogs').innerHTML=`
<dialog id="dayModal" aria-labelledby="dayModalTitle">${head('День','dayModalTitle')}<div class="day-task-list" id="dayTaskList"></div><button class="outline-btn full" id="dayAddTask">Добавить задачу</button></dialog>
<dialog id="taskModal" aria-labelledby="modalTitle"><form id="taskForm">${head('Новая задача','modalTitle')}
${field('Задача','taskInput','maxlength="120" required placeholder="Например, работа"')}${field('Дата','dateInput',`${dateAttrs} required`,'date')}
<label class="field hidden" id="scopeField"><span>Изменить</span><select id="scopeInput"><option value="one">Только эту задачу</option><option value="all">Всю серию</option></select></label>
<fieldset><legend>Отображать</legend><div class="checks"><label><input id="plannerInput" type="checkbox" checked> Планер недели</label><label><input id="calendarInput" type="checkbox" checked> Календарь месяца</label></div></fieldset>
<div id="repeatFields"><label class="field"><span>Повторять</span><select id="repeatInput"><option value="none">Не повторять</option><option value="daily">Каждые X дней</option><option value="cycle">Рабочие / выходные дни</option><option value="weekly">По дням недели</option><option value="monthly">Каждый месяц</option></select></label>
<div id="repeatOptions" class="hidden">${field('Интервал','intervalInput','min="1" max="365" step="1" value="1"','number')}<div id="cycleFields" class="cycle-fields hidden">${field('Рабочих дней подряд','workDaysInput','min="1" max="365" step="1" value="2"','number')}${field('Выходных дней подряд','restDaysInput','min="1" max="365" step="1" value="2"','number')}</div><p class="field-hint hidden" id="cycleHint"></p><fieldset id="repeatDaysField" class="hidden"><legend>Дни недели</legend><div class="weekday-picker" id="repeatDays">${DAYS.map((d,i)=>`<label><input type="checkbox" value="${i}" aria-label="${d}">${d}</label>`).join('')}</div></fieldset><p class="field-hint hidden" id="monthlyHint">Если такого числа нет, задача появится в последний день месяца.</p>${field('Повторять до <span class="optional">(необязательно)</span>','untilInput',dateAttrs,'date')}</div></div>
<fieldset><legend>Цвет</legend><div class="color-palette" id="colorPalette"></div></fieldset><label class="checks priority-option"><input id="priorityInput" type="checkbox"> Главная задача дня</label>
<p class="form-error hidden" id="taskError" role="alert"></p><div class="modal-actions"><button type="button" class="delete-btn hidden" id="deleteTask">Удалить</button><button class="save-btn" type="submit" id="saveTask">Сохранить</button></div></form></dialog>
<dialog id="habitModal" aria-labelledby="habitTitle"><form id="habitForm">${head('Новая привычка','habitTitle')}${field('Название','habitName','maxlength="80" required placeholder="Например, тренировка"')}<label class="field"><span>Цель или заметка</span><textarea id="habitNote" rows="2" maxlength="240"></textarea></label><div class="habit-stepper"><span>Раз в неделю</span><div><button type="button" class="icon-btn" id="habitMinus" aria-label="Меньше повторений">${icon('minus')}</button><output id="habitTarget">3</output><button type="button" class="icon-btn" id="habitPlus" aria-label="Больше повторений">${icon('plus')}</button></div></div><fieldset><legend>Иконка</legend><div class="habit-icons" id="habitIcons"></div></fieldset><div class="modal-actions"><button type="button" class="delete-btn hidden" id="deleteHabit">Удалить</button><button class="save-btn" type="submit">Сохранить</button></div></form></dialog>
<dialog id="stickerModal" aria-labelledby="stickerTitle"><form id="stickerForm">${head('Новый стикер','stickerTitle')}${field('Заголовок','stickerName','maxlength="120" required placeholder="Идеи, желания, покупки…"')}<label class="field"><span>Вид</span><select id="stickerType"><option value="note">Заметка</option><option value="list">Список</option></select></label><label class="field"><span id="stickerBodyLabel">Текст</span><textarea id="stickerBody" rows="8" maxlength="20000"></textarea></label><fieldset><legend>Цвет стикера</legend><div class="color-palette" id="stickerColors"></div></fieldset><div class="modal-actions"><button type="button" class="delete-btn hidden" id="deleteSticker">Удалить</button><button class="save-btn" type="submit">Сохранить</button></div></form></dialog>
<dialog id="periodModal" aria-labelledby="periodModalTitle"><form id="periodForm">${head('Перейти к дате','periodModalTitle')}${field('Дата','periodInput',`${dateAttrs} required`,'date')}<button class="save-btn full" type="submit">Перейти</button></form></dialog>
<dialog id="settingsModal" aria-labelledby="settingsTitle">${head('Настройки','settingsTitle')}<label class="settings-row"><span>Ещё крупнее текст</span><input id="largeText" type="checkbox"></label><div class="backup-actions"><button class="outline-btn" id="exportData">${icon('download')} Сохранить копию</button><button class="outline-btn" id="importData">${icon('upload')} Загрузить копию</button></div><p class="field-hint">Данные хранятся в этом браузере. Перед сменой устройства или очисткой браузера сохраните копию.</p><p class="form-error hidden" id="importError" role="alert"></p><input id="importFile" type="file" accept=".json,application/json" hidden></dialog>
<dialog id="confirmModal" aria-labelledby="confirmTitle"><h2 id="confirmTitle">Удалить?</h2><p id="confirmText"></p><div class="modal-actions"><button class="outline-btn" id="cancelConfirm">Отмена</button><button class="delete-btn" id="acceptConfirm">Удалить</button></div></dialog>`;
icons();
let state=M.normalize(),lastRaw=null,storageBlocked=false,loadProblem='',section='month',view='primary';
let anchor=M.key(new Date()),monthAnchor=anchor,weekAnchor=M.monday(anchor),editing=null,dayKey=null;
let selectedColor=M.COLORS[0],editingHabit=null,habitTarget=3,habitIcon='star',editingSticker=null,stickerColor=M.COLORS[0],search='';
try{
  lastRaw=localStorage.getItem(KEY);
  for(const k of [KEY,...OLD_KEYS]){
    const raw=localStorage.getItem(k);if(!raw)continue;
    try{state=M.validate(JSON.parse(raw));if(k===KEY&&state.version===7&&JSON.parse(raw).version!==7)localStorage.setItem(`${KEY}-before-v07`,raw);break}
    catch{storageBlocked=true;loadProblem='Не удалось прочитать сохранённые данные. Они не перезаписаны. Загрузите резервную копию в настройках.';break}
  }
}catch{loadProblem='Браузер не разрешает хранить данные. Записи доступны до закрытия страницы; сохраните копию в настройках.'}
function status(message,action=null){$('status').textContent=message;$('status').classList.remove('hidden');if(action){const b=document.createElement('button');b.textContent='Обновить';b.onclick=action;$('status').append(' ',b)}}
function save(){
  if(storageBlocked){status(loadProblem||'Данные изменены в другой вкладке. Обновите страницу перед продолжением.',()=>location.reload());return false}
  try{
    if(localStorage.getItem(KEY)!==lastRaw){storageBlocked=true;status('Данные изменены в другой вкладке. Обновите страницу перед продолжением.',()=>location.reload());return false}
    const raw=JSON.stringify(state);localStorage.setItem(KEY,raw);lastRaw=raw;return true;
  }catch{status('Не удалось сохранить записи в браузере. Сохраните копию в настройках.');return false}
}
function applyPreferences(){document.documentElement.style.setProperty('--base',state.preferences.largeText?'15px':'14px');document.documentElement.classList.toggle('large-text',!!state.preferences.largeText);$('largeText').checked=!!state.preferences.largeText}
function transact(fn){const before=state;state=M.normalize(state);fn();if(save())return true;state=before;return false}
function openDialog(id,focusId){const d=$(id);if(!d.open)d.showModal();if(focusId)$(focusId).focus()}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
let confirmation=null;
function confirmAction(title,text,action,label='Удалить'){$('confirmTitle').textContent=title;$('confirmText').textContent=text;$('acceptConfirm').textContent=label;confirmation=action;openDialog('confirmModal')}
$('cancelConfirm').onclick=()=>$('confirmModal').close();
$('acceptConfirm').onclick=()=>{const fn=confirmation;confirmation=null;$('confirmModal').close();fn?.()};
function period(){return section==='month'?monthAnchor:weekAnchor}
function shortDate(day){return M.date(day).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}
function weekLabel(start){const end=M.addDays(start,6),a=M.date(start),b=M.date(end);if(a.getFullYear()!==b.getFullYear())return `${shortDate(start)} ${a.getFullYear()} — ${shortDate(end)} ${b.getFullYear()}`;return `${a.getMonth()===b.getMonth()?a.getDate():shortDate(start)} — ${shortDate(end)} ${b.getFullYear()}`}
function renderHeader(){
  const d=M.date(period());
  $('periodTitle').textContent=section==='stickers'?'Стикеры':section==='habits'?'Привычки':section==='month'?`${MONTHS[d.getMonth()]} ${d.getFullYear()}`:weekLabel(weekAnchor).replace(/\s\d{4}$/,'');
  $('periodCaret').disabled=section==='stickers';$('periodCaret').querySelector('[data-icon]').classList.toggle('hidden',section==='stickers');$('todayBtn').classList.toggle('hidden',section==='stickers'||section==='week');$('prevPeriod').classList.toggle('hidden',section==='stickers');$('nextPeriod').classList.toggle('hidden',section==='stickers');$('periodBar').classList.toggle('hidden',section==='stickers');
  $('viewSwitch').classList.toggle('hidden',section==='habits');let label=$('habitPeriodLabel');
  if(!label){label=document.createElement('div');label.id='habitPeriodLabel';label.className='period-label';$('periodBar').append(label)}
  label.classList.toggle('hidden',section!=='habits');label.textContent=weekLabel(weekAnchor);
  $('primaryTab').textContent=section==='month'?'Месяц':'Разворот';
  for(const[v,id]of [['primary','primaryTab'],['secondary','secondaryTab']]){$(id).classList.toggle('active',view===v);$(id).setAttribute('aria-pressed',String(view===v))}
  for(const s of ['month','week','habits','stickers']){$(`${s}Nav`).classList.toggle('selected',section===s);if(section===s)$(`${s}Nav`).setAttribute('aria-current','page');else $(`${s}Nav`).removeAttribute('aria-current')}
  $('globalAdd').setAttribute('aria-label',section==='habits'?'Добавить привычку':section==='stickers'?'Добавить стикер':'Добавить задачу');
}
function render(){
  renderHeader();
  const active=section==='month'?(view==='primary'?'monthPage':'focusPage'):section==='week'?(view==='primary'?'weekPage':'focusPage'):`${section}Page`;
  for(const id of ['monthPage','weekPage','focusPage','habitsPage','stickersPage'])$(id).classList.toggle('hidden',active!==id);
  if(active==='monthPage')renderMonth();else if(active==='weekPage')renderWeek();else if(active==='focusPage')section==='month'?renderMonthFocus():renderWeekFocus();else if(active==='habitsPage')renderHabits();else renderStickers();
}
function setSection(s){section=s;view='primary';render();window.scrollTo(0,0)}
function shift(n){
  if(section==='month'){const d=M.date(monthAnchor);d.setDate(1);d.setMonth(d.getMonth()+n);const next=M.key(d);if(M.validDate(next))monthAnchor=next}
  else{const next=M.addDays(weekAnchor,n*7);if(M.validDate(next)&&M.validDate(M.addDays(next,6)))weekAnchor=next}
  render();window.scrollTo(0,0);
}
function ordered(items){return [...items].sort((a,b)=>Number(b.priority)-Number(a.priority))}
function renderMonth(){
  const d=M.date(monthAnchor),start=M.monday(`${monthAnchor.slice(0,7)}-01`),grid=$('calendarGrid');grid.replaceChildren();
  for(let i=0;i<42;i++){
    const day=M.addDays(start,i),x=M.date(day),cell=document.createElement('div');cell.className='calendar-cell'+(x.getMonth()!==d.getMonth()?' outside':'')+(day===M.key(new Date())?' today':'');
    const num=document.createElement('button');num.className='day-number';num.textContent=x.getDate();num.setAttribute('aria-label',`Открыть ${shortDate(day)} ${x.getFullYear()}`);num.onclick=()=>openDay(day);
    const list=document.createElement('div');list.className='calendar-tasks';const items=ordered(M.tasksFor(state,day).filter(t=>t.displayCalendar));
    const dayHead=document.createElement('div');dayHead.className='calendar-day-head';dayHead.append(num);cell.append(dayHead);
    items.forEach(t=>{const b=document.createElement('button');b.className='calendar-task'+(t.done?' completed':'');b.style.background=t.color;b.textContent=t.text;b.title=t.text;b.setAttribute('aria-label',`${t.text}, ${shortDate(day)}${t.done?', выполнена':''}`);b.onclick=()=>openTask(day,t);list.append(b)});
    const more=document.createElement('button');more.className='calendar-more hidden';more.onclick=()=>openDay(day);dayHead.append(more);
    cell.append(list);cell.onclick=e=>{if(!e.target.closest('button'))openDay(day)};grid.append(cell);
  }
  fitTaskLists();
}
function renderWeek(){
  const grid=$('weekGrid');grid.replaceChildren();
  for(let i=0;i<7;i++){
    const day=M.addDays(weekAnchor,i),c=document.createElement('article');c.className='day-card'+(day===M.key(new Date())?' today':'');
    c.innerHTML=`<div class="day-head"><h2>${DAYS[i]} <span>${M.date(day).getDate()}</span></h2><button class="icon-btn" aria-label="Открыть ${shortDate(day)}">${icon('more')}</button></div><div class="tasks"></div><div class="day-footer"><button class="add-task">＋ Добавить задачу</button></div>`;
    const items=ordered(M.tasksFor(state,day).filter(t=>t.displayPlanner));if(!items.length)c.querySelector('.tasks').innerHTML='<p class="empty-line">Нет задач</p>';
    items.forEach(t=>{
      const r=document.createElement('div');r.className='task-row'+(t.done?' completed':'');
      r.innerHTML=`<input type="checkbox" ${t.done?'checked':''}><button class="task-text"></button>${t.priority?`<span class="priority-star" title="Главная задача">${icon('star')}</span>`:''}${t.seriesId?`<span title="Повторяемая задача">${icon('repeat')}</span>`:''}`;
      const check=r.querySelector('input');check.setAttribute('aria-label',`Выполнено: ${t.text}`);check.onchange=()=>{M.complete(state,t,check.checked);save();r.classList.toggle('completed',check.checked)};
      r.querySelector('.task-text').textContent=t.text;r.querySelector('.task-text').title=t.text;r.querySelector('.task-text').onclick=()=>openTask(day,t);c.querySelector('.tasks').append(r);
      if(!t.seriesId&&items.filter(x=>!x.seriesId).length>1)enableReorder(r,t,c.querySelector('.tasks'));
    });
    const more=document.createElement('button');more.className='week-more hidden';more.onclick=()=>openDay(day);c.querySelector('.day-footer').append(more);
    c.querySelector('.day-head button').onclick=()=>openDay(day);c.querySelector('.add-task').onclick=()=>openTask(day);grid.append(c);
  }
  fitTaskLists();
}
function fitTaskLists(){
  document.querySelectorAll('.calendar-tasks,.day-card .tasks').forEach(list=>{
    const rows=[...list.children].filter(el=>el.matches('.calendar-task,.task-row')),more=list.parentElement.querySelector('.calendar-more,.week-more');if(!rows.length||!more||!list.clientHeight)return;
    const style=getComputedStyle(list),height=parseFloat(style.getPropertyValue('--task-row-height')),gap=parseFloat(style.rowGap)||0,capacity=Math.max(0,Math.floor((list.clientHeight+gap)/(height+gap)));
    const count=Math.min(rows.length,capacity);
    rows.forEach((el,i)=>el.classList.toggle('hidden',i>=count));more.classList.toggle('hidden',rows.length<=capacity);more.textContent=`+${rows.length-count}`;more.setAttribute('aria-label',`Открыть ещё ${rows.length-count} задач`);
  });
}
new ResizeObserver(fitTaskLists).observe($('contentSurface'));
function enableReorder(row,item,box){
  row.dataset.taskId=item.id;
  const handle=document.createElement('button');handle.className='reorder-control';handle.innerHTML=icon('up');handle.setAttribute('aria-label',`Поднять задачу: ${item.text}`);row.prepend(handle);
  let timer=null,dragging=false,suppressClick=false;
  const move=target=>{const arr=state[item.day]||[],from=arr.findIndex(x=>x.id===item.id);if(from<0)return;const task=arr.splice(from,1)[0];let to=target?arr.findIndex(x=>x.id===target):arr.length;if(to<0)to=arr.length;arr.splice(to,0,task);save();renderWeek()};
  handle.onclick=()=>{if(suppressClick){suppressClick=false;return}const arr=state[item.day]||[],i=arr.findIndex(x=>x.id===item.id);if(i>0)move(arr[i-1].id)};
  handle.addEventListener('pointerdown',e=>{timer=setTimeout(()=>{dragging=true;row.classList.add('dragging');handle.setPointerCapture(e.pointerId)},250)});
  handle.addEventListener('pointermove',e=>{if(!dragging)return;for(const el of box.querySelectorAll('.task-row'))el.classList.remove('drag-over');const target=[...box.querySelectorAll('.task-row[data-task-id]')].find(el=>el!==row&&e.clientY<el.getBoundingClientRect().top+el.offsetHeight/2);target?.classList.add('drag-over')});
  handle.addEventListener('pointerup',e=>{clearTimeout(timer);if(!dragging)return;dragging=false;suppressClick=true;row.classList.remove('dragging');const target=[...box.querySelectorAll('.task-row[data-task-id]')].find(el=>el!==row&&e.clientY<el.getBoundingClientRect().top+el.offsetHeight/2);move(target?.dataset.taskId)});
  handle.addEventListener('pointercancel',()=>{clearTimeout(timer);dragging=false;row.classList.remove('dragging');box.querySelectorAll('.drag-over').forEach(el=>el.classList.remove('drag-over'))});
}
function openDay(day){dayKey=day;$('dayModalTitle').textContent=shortDate(day);renderDay();openDialog('dayModal')}
function renderDay(){
  const box=$('dayTaskList');box.replaceChildren();const items=ordered(M.tasksFor(state,dayKey));
  if(!items.length)box.innerHTML='<p class="empty-line">На этот день пока нет задач.</p>';
  for(const t of items){
    const row=document.createElement('div');row.className='day-task'+(t.done?' completed':'');
    row.innerHTML=`<input type="checkbox" ${t.done?'checked':''}><div class="day-task-main"><div class="day-task-name"></div><div class="day-task-meta"></div></div><button class="day-task-edit">Изменить</button>`;
    row.querySelector('.day-task-name').textContent=t.text;row.querySelector('.day-task-meta').textContent=[t.displayPlanner?'Планер':'',t.displayCalendar?'Календарь':'',t.seriesId?'Повторение':''].filter(Boolean).join(' · ');
    const check=row.querySelector('input');check.setAttribute('aria-label',`Выполнено: ${t.text}`);check.onchange=()=>{M.complete(state,t,check.checked);save();row.classList.toggle('completed',check.checked);render()};row.querySelector('button').onclick=()=>openTask(dayKey,t);box.append(row);
  }
}
function palette(boxId,value,set){const p=$(boxId);p.replaceChildren();M.COLORS.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className='color-choice'+(c.toLowerCase()===value.toLowerCase()?' selected':'');b.style.background=c;b.setAttribute('aria-label',COLOR_NAMES[i]);b.setAttribute('aria-pressed',String(c.toLowerCase()===value.toLowerCase()));b.onclick=()=>{set(c);palette(boxId,c,set)};p.append(b)})}
function showRepeat(){
  const single=!!editing?.seriesId&&$('scopeInput').value==='one';$('repeatFields').classList.toggle('hidden',single);
  const type=$('repeatInput').value;$('repeatOptions').classList.toggle('hidden',type==='none');$('repeatDaysField').classList.toggle('hidden',type!=='weekly');$('monthlyHint').classList.toggle('hidden',type!=='monthly');
  const cycle=type==='cycle';$('cycleFields').classList.toggle('hidden',!cycle);$('cycleHint').classList.toggle('hidden',!cycle);
  $('intervalInput').closest('label').classList.toggle('hidden',cycle);
  $('intervalInput').closest('label').querySelector('span').textContent={daily:'Повторять каждые (дней)',weekly:'Интервал в неделях',monthly:'Интервал в месяцах'}[type]||'Интервал';
  $('intervalInput').required=type!=='none'&&!single&&!cycle;
  for(const id of ['workDaysInput','restDaysInput'])$(id).required=cycle&&!single;
  $('dateInput').closest('label').querySelector('span').textContent=cycle&&!editing?'Первый рабочий день':'Дата';
  $('repeatInput').disabled=single;
  $('repeatOptions').querySelectorAll('input').forEach(el=>el.disabled=type==='none'||single||(el.closest('#repeatDays')&&type!=='weekly')||(el.id==='intervalInput'&&cycle)||(el.closest('#cycleFields')&&!cycle));
  updateCycleHint();
}
function updateCycleHint(){
  const series=editing?.seriesId?state.series.find(x=>x.id===editing.seriesId):null,day=$('dateInput').value;
  const start=series&&day===editing.day?series.start:day;
  const work=Number($('workDaysInput').value),rest=Number($('restDaysInput').value);
  $('cycleHint').textContent=M.validDate(start)&&work>=1&&rest>=1?`Начало цикла: ${shortDate(start)} ${M.date(start).getFullYear()}. ${work} рабочих / ${rest} выходных.`:'';
}
function openTask(day,item=null){
  editing=item;$('taskForm').reset();$('modalTitle').textContent=item?'Изменить задачу':'Новая задача';$('taskInput').value=item?.text||'';$('dateInput').value=day;$('plannerInput').checked=item?.displayPlanner!==false;$('calendarInput').checked=item?.displayCalendar!==false;$('priorityInput').checked=!!item?.priority;
  $('scopeField').classList.toggle('hidden',!item?.seriesId);$('scopeInput').value='one';$('deleteTask').classList.toggle('hidden',!item);$('taskError').classList.add('hidden');
  const rule=item?.seriesId?state.series.find(x=>x.id===item.seriesId).rule:null;
  $('repeatInput').value=rule?.type||'none';$('intervalInput').value=rule?.interval||1;$('untilInput').value=rule?.until||'';
  $('workDaysInput').value=rule?.workDays||2;$('restDaysInput').value=rule?.restDays||2;
  const days=rule?.days||[(M.date(day).getDay()+6)%7];$('repeatDays').querySelectorAll('input').forEach(c=>c.checked=days.includes(Number(c.value)));
  selectedColor=item?.color||M.COLORS[0];palette('colorPalette',selectedColor,c=>selectedColor=c);showRepeat();openDialog('taskModal','taskInput');
}
function taskError(text){$('taskError').textContent=text;$('taskError').classList.remove('hidden')}
$('repeatInput').onchange=showRepeat;$('scopeInput').onchange=showRepeat;
for(const id of ['workDaysInput','restDaysInput','dateInput'])$(id).addEventListener('input',updateCycleHint);
$('taskForm').onsubmit=e=>{
  e.preventDefault();const text=$('taskInput').value.trim(),day=$('dateInput').value;if(!text){taskError('Введите название задачи.');return}if(!M.validDate(day)){taskError('Выберите корректную дату.');return}
  if(!$('plannerInput').checked&&!$('calendarInput').checked){taskError('Выберите планер, календарь или оба вида.');return}
  let rule=null;const scope=$('scopeInput').value,type=$('repeatInput').value;
  if(type!=='none'&&(!editing?.seriesId||scope==='all')){
    const interval=type==='cycle'?1:Number($('intervalInput').value),until=$('untilInput').value,days=[...$('repeatDays').querySelectorAll('input:checked')].map(x=>Number(x.value));
    const workDays=Number($('workDaysInput').value),restDays=Number($('restDaysInput').value);
    if(!Number.isInteger(interval)||interval<1||interval>365){taskError('Интервал должен быть от 1 до 365.');return}
    if(type==='cycle'&&![workDays,restDays].every(n=>Number.isInteger(n)&&n>=1&&n<=365)){taskError('Число рабочих и выходных дней должно быть от 1 до 365.');return}
    if(type==='weekly'&&!days.length){taskError('Выберите хотя бы один день недели.');return}
    const series=editing?.seriesId?state.series.find(x=>x.id===editing.seriesId):null;
    const start=series&&day===editing.day?series.start:day;
    if(until&&(!M.validDate(until)||until<start)){taskError('Дата окончания должна быть не раньше начала серии.');return}
    rule={type,interval,until:until||null,...(type==='weekly'?{days}:{}),...(type==='cycle'?{workDays,restDays}:{})};
  }
  const values={text,done:editing?.done||false,priority:$('priorityInput').checked,displayPlanner:$('plannerInput').checked,displayCalendar:$('calendarInput').checked,color:selectedColor};
  if(!transact(()=>M.put(state,day,values,rule,editing,scope)))return;
  $('taskModal').close();render();if($('dayModal').open)renderDay();
};
$('deleteTask').onclick=()=>{const item=editing,scope=$('scopeInput').value;confirmAction(scope==='all'&&item.seriesId?'Удалить всю серию?':'Удалить задачу?',item.text,()=>{if(transact(()=>M.remove(state,item,scope))){$('taskModal').close();render();if($('dayModal').open)renderDay()}})};
$('dayAddTask').onclick=()=>openTask(dayKey);
function weekData(){return state.weeks[weekAnchor]||=( {focus:['','',''],sideTasks:[],thoughts:'',result:{win:'',lesson:'',carry:''}} )}
function monthData(){const k=monthAnchor.slice(0,7);if(!state.months[k])state.months[k]=M.normalize({months:{[k]:{}}}).months[k];return state.months[k]}
function noteBlock(title,id){return `<section class="focus-block"><div class="focus-title"><h2>${title}</h2>${icon('note')}</div><textarea class="focus-note" id="${id}" aria-label="${title}"></textarea></section>`}
function bindText(id,data,k){$(id).value=data[k]||'';$(id).oninput=()=>{data[k]=$(id).value;save()}}
function checklist(box,items,onRender,label){
  box.replaceChildren();
  items.forEach((item,i)=>{
    const row=document.createElement('div');row.className='editable-row'+(item.done?' done':'');row.style.setProperty('--row-tint',M.COLORS[i%M.COLORS.length]+'70');
    row.innerHTML=`<input type="checkbox" ${item.done?'checked':''}><input type="text" maxlength="120" placeholder="Новый пункт"><button class="icon-btn" aria-label="Удалить пункт">${icon('close')}</button>`;
    const text=row.querySelector('[type=text]');text.value=item.text;text.setAttribute('aria-label',label);text.oninput=()=>{item.text=text.value;save();row.querySelector('[type=checkbox]').setAttribute('aria-label',`Выполнено: ${item.text||'новый пункт'}`)};
    const check=row.querySelector('[type=checkbox]');check.setAttribute('aria-label',`Выполнено: ${item.text||'новый пункт'}`);check.onchange=()=>{item.done=check.checked;save();row.classList.toggle('done',check.checked)};
    row.querySelector('button').onclick=()=>{const remove=()=>{items.splice(items.indexOf(item),1);save();onRender()};if(item.text.trim())confirmAction('Удалить пункт?',item.text,remove);else remove()};
    text.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();items.splice(items.indexOf(item)+1,0,M.task({text:''}));save();onRender();box.querySelectorAll('[type=text]')[i+1]?.focus()}};
    box.append(row);
  });
}
function appendItem(items,render,boxId){items.push(M.task({text:''}));save();render();const inputs=$(boxId).querySelectorAll('[type=text]');inputs[inputs.length-1]?.focus()}
function renderWeekFocus(){
  const w=weekData(),p=$('focusPage');p.className='focus-page week-focus-layout';
  p.innerHTML=`<section class="focus-block"><div class="focus-title"><h2>Фокус недели</h2>${icon('target')}</div><div class="focus-list" id="focusList"></div></section><section class="focus-block"><div class="focus-title"><h2>Задачи недели</h2>${icon('planner')}</div><div class="focus-list" id="sideList"></div><button class="block-add" id="addSide">Добавить задачу</button></section>${noteBlock('Мысли недели','thoughts')}<section class="focus-block"><div class="focus-title"><h2>Итоги недели</h2></div><div class="result-grid">${['Победа','Урок недели','Перенести дальше'].map((label,i)=>`<label class="field"><span>${label}</span><textarea class="focus-note" id="${['win','lesson','carry'][i]}"></textarea></label>`).join('')}</div></section>`;
  Array.from({length:3},(_,i)=>w.focus[i]||'').forEach((text,i)=>{
    const row=document.createElement('div');row.className='editable-row';row.innerHTML=`<input type="text" maxlength="120" aria-label="Фокус ${i+1}" placeholder="Главное на неделю"><button class="icon-btn" aria-label="Удалить фокус">${icon('close')}</button>`;
    row.querySelector('input').value=text;row.querySelector('input').oninput=e=>{w.focus[i]=e.target.value;save()};row.querySelector('button').setAttribute('aria-label',`Очистить фокус ${i+1}`);row.querySelector('button').onclick=()=>{const remove=()=>{w.focus[i]='';save();renderWeekFocus()};text.trim()?confirmAction('Очистить фокус?',text,remove):remove()};$('focusList').append(row);
  });
  checklist($('sideList'),w.sideTasks,renderWeekFocus,'Задача недели');$('addSide').onclick=()=>appendItem(w.sideTasks,renderWeekFocus,'sideList');bindText('thoughts',w,'thoughts');for(const k of ['win','lesson','carry'])bindText(k,w.result,k);
}
function renderMonthFocus(){
  const m=monthData(),p=$('focusPage');p.className='focus-page month-focus-layout';
  const spheres=[['finance','Финансы','wallet','#fff0e9'],['blog','Блог','note','#f3edfb'],['personal','Личное','heart','#fdebf2'],['health','Здоровье','leaf','#fff2e7']];
  p.innerHTML=`${noteBlock('Фокус месяца','monthFocus')}<section><div class="focus-title"><h2>Сферы жизни</h2></div><div class="month-sphere-grid">${spheres.map(([k,name,ico,color])=>`<section class="month-sphere" style="--sphere-bg:${color}"><div class="sphere-head">${icon(ico)}<h2>${name}</h2></div><label class="sphere-goal"><span>Цель</span><input id="goal-${k}" maxlength="120" placeholder="Главная цель"></label><div class="sphere-list" id="sphere-${k}"></div><button class="block-add" id="add-${k}">Добавить пункт</button></section>`).join('')}</div></section>${noteBlock('Заметки месяца','monthNotes')}`;
  bindText('monthFocus',m,'focus');bindText('monthNotes',m,'notes');
  for(const[k]of spheres){bindText(`goal-${k}`,m.spheres[k],'goal');checklist($(`sphere-${k}`),m.spheres[k].items,renderMonthFocus,'Пункт сферы');$(`add-${k}`).onclick=()=>appendItem(m.spheres[k].items,renderMonthFocus,`sphere-${k}`)}
}
function empty(box,title,ico,label,action){box.innerHTML=`<div class="empty-state">${icon(ico)}<h2>${title}</h2><button class="save-btn">${label}</button></div>`;box.querySelector('button').onclick=action}
function renderHabits(){
  const p=$('habitsPage');if(!state.habits.length){empty(p,'Новая неделя, новые привычки','leaf','Добавить привычку',()=>openHabit());return}
  p.innerHTML=`<div class="habits-table"><div class="habit-grid habits-heading"><span>Привычка</span>${DAYS.map(d=>`<span>${d}</span>`).join('')}</div><div id="habitRows"></div></div>`;
  for(const h of state.habits){
    const row=document.createElement('div');row.className='habit-grid habit-row';const desc=document.createElement('div');desc.className='habit-description';desc.textContent=[h.note,`${h.target} раз в неделю`].filter(Boolean).join(' · ');row.append(desc);
    const name=document.createElement('button');name.className='habit-name';name.innerHTML=`${icon(h.icon)}<span></span>`;name.querySelector('span').textContent=h.title;name.setAttribute('aria-label',`Изменить привычку: ${h.title}`);name.onclick=()=>openHabit(h);row.append(name);
    for(let i=0;i<7;i++){
      const day=M.addDays(weekAnchor,i),b=document.createElement('button');b.className='habit-mark'+(day===M.key(new Date())?' today':'');b.setAttribute('aria-label',`${h.title}, ${shortDate(day)}`);b.setAttribute('aria-pressed',String(!!h.marks[day]));b.innerHTML='<span></span>';
      b.onclick=()=>{h.marks[day]=!h.marks[day];save();b.setAttribute('aria-pressed',String(h.marks[day]))};row.append(b);
    }$('habitRows').append(row);
  }
}
const HABIT_NAMES={drop:'Вода',run:'Тренировка',book:'Книга',leaf:'Медитация',moon:'Сон',star:'Звезда'};
function renderHabitOptions(){
  $('habitTarget').value=habitTarget;$('habitTarget').textContent=habitTarget;$('habitMinus').disabled=habitTarget===1;$('habitPlus').disabled=habitTarget===7;
  $('habitIcons').replaceChildren();for(const[name,label]of Object.entries(HABIT_NAMES)){const b=document.createElement('button');b.type='button';b.className=name===habitIcon?'selected':'';b.innerHTML=icon(name);b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(name===habitIcon));b.onclick=()=>{habitIcon=name;renderHabitOptions()};$('habitIcons').append(b)}
}
function openHabit(h=null){editingHabit=h;$('habitForm').reset();$('habitName').setCustomValidity('');$('habitTitle').textContent=h?'Изменить привычку':'Новая привычка';$('habitName').value=h?.title||'';$('habitNote').value=h?.note||'';habitTarget=h?.target||3;habitIcon=h?.icon||'star';$('deleteHabit').classList.toggle('hidden',!h);renderHabitOptions();openDialog('habitModal','habitName')}
$('habitMinus').onclick=()=>{habitTarget=Math.max(1,habitTarget-1);renderHabitOptions()};$('habitPlus').onclick=()=>{habitTarget=Math.min(7,habitTarget+1);renderHabitOptions()};
$('habitForm').onsubmit=e=>{e.preventDefault();const title=$('habitName').value.trim();if(!title){$('habitName').setCustomValidity('Введите название.');$('habitName').reportValidity();return}const values={title,note:$('habitNote').value.trim(),target:habitTarget,icon:habitIcon};if(transact(()=>{if(editingHabit)Object.assign(state.habits.find(x=>x.id===editingHabit.id),values);else state.habits.push({id:M.id(),...values,marks:{}})})){$('habitModal').close();renderHabits()}};
$('habitName').oninput=()=>$('habitName').setCustomValidity('');
$('deleteHabit').onclick=()=>{const h=editingHabit;confirmAction('Удалить привычку?',`${h.title}. Все её отметки тоже будут удалены.`,()=>{if(transact(()=>state.habits=state.habits.filter(x=>x.id!==h.id))){$('habitModal').close();renderHabits()}})};
function renderStickers(){
  const p=$('stickersPage');if(!state.stickers.length){empty(p,'Место для идей и списков','note','Добавить стикер',()=>openSticker());return}
  p.innerHTML='<div class="stickers-toolbar"><input class="search-field" id="stickerSearch" type="search" aria-label="Найти стикер" placeholder="Найти стикер"><button class="icon-btn" id="newSticker" aria-label="Добавить стикер">'+icon('plus')+'</button></div><div class="sticker-grid" id="stickerGrid"></div>';
  $('stickerSearch').value=search;$('stickerSearch').oninput=e=>{search=e.target.value;renderStickerCards()};$('newSticker').onclick=()=>openSticker();renderStickerCards();
}
function renderStickerCards(){
  const grid=$('stickerGrid');grid.replaceChildren();const q=search.toLocaleLowerCase('ru');const items=state.stickers.filter(s=>[s.title,s.body,...s.items.map(x=>x.text)].join(' ').toLocaleLowerCase('ru').includes(q));
  if(!items.length){grid.innerHTML='<p class="empty-line">Ничего не найдено.</p>';return}
  for(const s of items){
    const c=document.createElement('article');c.className='sticker';c.style.setProperty('--sticker-color',s.color);c.innerHTML=`<div class="sticker-head"><h2></h2><button class="icon-btn" aria-label="Изменить стикер">${icon('edit')}</button></div>`;c.querySelector('h2').textContent=s.title;c.querySelector('button').onclick=()=>openSticker(s);
    if(s.type==='note'){const body=document.createElement('p');body.className='sticker-body';body.textContent=s.body;c.append(body)}
    else{const list=document.createElement('ul');list.className='sticker-list';for(const item of s.items){const li=document.createElement('li');li.innerHTML=`<label><input type="checkbox" ${item.done?'checked':''}><span></span></label>`;const text=li.querySelector('span');text.textContent=item.text;text.classList.toggle('done',item.done);li.querySelector('input').onchange=e=>{item.done=e.target.checked;save();text.classList.toggle('done',item.done)};list.append(li)}c.append(list)}
    grid.append(c);
  }
}
function stickerBodyLabel(){$('stickerBodyLabel').textContent=$('stickerType').value==='list'?'Пункты — каждый с новой строки':'Текст'}
function openSticker(s=null){editingSticker=s;$('stickerForm').reset();$('stickerName').setCustomValidity('');$('stickerTitle').textContent=s?'Изменить стикер':'Новый стикер';$('stickerName').value=s?.title||'';$('stickerType').value=s?.type||'note';$('stickerBody').value=s?.type==='list'?s.items.map(x=>x.text).join('\n'):s?.body||'';stickerColor=s?.color||M.COLORS[state.stickers.length%M.COLORS.length];palette('stickerColors',stickerColor,c=>stickerColor=c);$('deleteSticker').classList.toggle('hidden',!s);stickerBodyLabel();openDialog('stickerModal','stickerName')}
$('stickerType').onchange=stickerBodyLabel;
$('stickerForm').onsubmit=e=>{
  e.preventDefault();const title=$('stickerName').value.trim();if(!title){$('stickerName').setCustomValidity('Введите заголовок.');$('stickerName').reportValidity();return}
  const type=$('stickerType').value,body=$('stickerBody').value;let items=editingSticker?.items||[];
  if(type==='list'){const pool=[...items];items=body.split('\n').map(x=>x.trim()).filter(Boolean).map(text=>{const i=pool.findIndex(x=>x.text===text);return i>=0?pool.splice(i,1)[0]:{id:M.id(),text,done:false}})}
  const values={title,type,body,color:stickerColor,items};
  if(transact(()=>{if(editingSticker)Object.assign(state.stickers.find(x=>x.id===editingSticker.id),values);else state.stickers.unshift({id:M.id(),...values})})){$('stickerModal').close();search='';renderStickers()}
};
$('stickerName').oninput=()=>$('stickerName').setCustomValidity('');
$('deleteSticker').onclick=()=>{const s=editingSticker;confirmAction('Удалить стикер?',s.title,()=>{if(transact(()=>state.stickers=state.stickers.filter(x=>x.id!==s.id))){$('stickerModal').close();renderStickers()}})};
const exportNames={};
function filename(ext){const d=new Date(),pad=n=>String(n).padStart(2,'0'),base=`Ежедневник_${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}_${pad(d.getHours())}-${pad(d.getMinutes())}`;exportNames[base]=(exportNames[base]||0)+1;return `${base}${exportNames[base]>1?'_'+pad(exportNames[base]):''}.${ext}`}
function download(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
$('exportData').onclick=()=>download({format:'personal-planner',version:7,exportedAt:new Date().toISOString(),data:state},filename('json'));
$('importData').onclick=()=>{$('importFile').value='';$('importFile').click()};
$('importFile').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;const error=$('importError');error.classList.add('hidden');
  try{
    if(file.size>20*1024*1024)throw new Error('Резервная копия должна быть не больше 20 МБ.');
    const raw=await file.text(),next=M.validate(JSON.parse(raw.replace(/^\uFEFF/,'')));
    confirmAction('Загрузить резервную копию?','Текущие записи будут заменены. Перед заменой сохранится копия текущих данных.',()=>{
      try{const old=localStorage.getItem(KEY);if(old)localStorage.setItem(`${KEY}-before-import`,old);localStorage.setItem(KEY,JSON.stringify(next));state=next;lastRaw=JSON.stringify(next);storageBlocked=false;loadProblem='';$('status').classList.add('hidden');$('settingsModal').close();applyPreferences();render()}
      catch{error.textContent='Не удалось загрузить копию: браузер не разрешает сохранение. Текущие данные сохранены.';error.classList.remove('hidden')}
    },'Загрузить');
  }catch(err){error.textContent=err instanceof SyntaxError?'Файл содержит некорректный JSON.':err.message;error.classList.remove('hidden')}
};
$('largeText').onchange=()=>{state.preferences.largeText=$('largeText').checked;save();applyPreferences()};
$('menuBtn').onclick=()=>{
  let b=$('restoreBackup');if(!b){b=document.createElement('button');b.id='restoreBackup';b.className='outline-btn';b.textContent='Восстановить предыдущую копию';$('settingsModal').querySelector('.backup-actions').append(b)}
  let raw=null;try{raw=localStorage.getItem(`${KEY}-before-import`)||localStorage.getItem(`${KEY}-before-v07`)}catch{}
  b.classList.toggle('hidden',!raw);b.onclick=()=>{
    try{const next=M.validate(JSON.parse(raw));confirmAction('Восстановить предыдущую копию?','Текущие записи будут заменены. Сначала сохраните копию, если они нужны.',()=>{try{const text=JSON.stringify(next);localStorage.setItem(KEY,text);state=next;lastRaw=text;storageBlocked=false;loadProblem='';$('status').classList.add('hidden');$('settingsModal').close();applyPreferences();render()}catch{status('Не удалось восстановить записи: браузер не разрешает сохранение.')}},'Восстановить')}
    catch{const error=$('importError');error.textContent='Предыдущая копия повреждена. Исходные данные сохранены.';error.classList.remove('hidden')}
  };openDialog('settingsModal');
};
$('periodCaret').onclick=()=>{$('periodInput').value=period();openDialog('periodModal','periodInput')};
$('periodForm').onsubmit=e=>{e.preventDefault();const day=$('periodInput').value;if(!M.validDate(day))return;if(section==='month')monthAnchor=day;else weekAnchor=M.monday(day);$('periodModal').close();render();window.scrollTo(0,0)};
$('todayBtn').onclick=()=>{monthAnchor=M.key(new Date());weekAnchor=M.monday(monthAnchor);render();window.scrollTo(0,0)};
$('prevPeriod').onclick=()=>shift(-1);$('nextPeriod').onclick=()=>shift(1);
$('primaryTab').onclick=()=>{view='primary';render()};$('secondaryTab').onclick=()=>{view='secondary';render()};
for(const s of ['month','week','habits','stickers'])$(`${s}Nav`).onclick=()=>setSection(s);
$('globalAdd').onclick=()=>{if(section==='habits')openHabit();else if(section==='stickers')openSticker();else{const today=M.key(new Date());const day=section==='month'?(monthAnchor.slice(0,7)===today.slice(0,7)?today:`${monthAnchor.slice(0,7)}-01`):(M.monday(today)===weekAnchor?today:weekAnchor);openTask(day)}};
let touchStart=null;
$('contentSurface').addEventListener('touchstart',e=>{if(e.touches.length!==1||e.target.closest('button,input,textarea,select,.habits-table'))return;const t=e.touches[0];touchStart={x:t.clientX,y:t.clientY}},{passive:true});
$('contentSurface').addEventListener('touchend',e=>{if(!touchStart)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;touchStart=null;if(section!=='stickers'&&Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)*1.5)shift(dx<0?1:-1)},{passive:true});
window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue!==lastRaw){storageBlocked=true;status('Данные изменены в другой вкладке. Обновите страницу перед продолжением.',()=>location.reload())}});
applyPreferences();render();if(loadProblem)status(loadProblem);

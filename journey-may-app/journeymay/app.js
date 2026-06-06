// ---- STORAGE ----
function save(key, val){ try{ localStorage.setItem('jm_'+key, JSON.stringify(val)); }catch(e){} }
function load(key, def){ try{ const v=localStorage.getItem('jm_'+key); return v!==null?JSON.parse(v):def; }catch(e){ return def; } }

// ---- CLOCK & DATE ----
function tick(){const d=new Date();document.getElementById('clock').textContent=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');}
tick();setInterval(tick,10000);
const now=new Date();
document.getElementById('hday').textContent=now.getDate();
const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
document.getElementById('hmonth').textContent=months[now.getMonth()]+' '+now.getFullYear();
document.getElementById('modal-ev-date').value=now.toISOString().split('T')[0];

// ---- NAV ----
function showSection(id,btn){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  document.getElementById('sec-'+id).classList.add('active');
  btn.classList.add('active');
  if(id==='rotina'){renderCal();renderWeek();}
}

// ---- PWA INSTALL ----
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();deferredPrompt=e;
  document.getElementById('install-banner').classList.remove('hidden');
});
window.addEventListener('appinstalled',()=>{
  document.getElementById('install-banner').classList.add('hidden');
});
function installApp(){
  if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.userChoice.then(()=>{deferredPrompt=null;document.getElementById('install-banner').classList.add('hidden');});}
}

// ---- SERVICE WORKER ----
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}

// ---- NOTAS ----
let notas=load('notas',[]);
function renderNotas(){
  const ul=document.getElementById('lista-notas');ul.innerHTML='';
  if(!notas.length){ul.innerHTML='<li class="empty"><div class="empty-icon">📝</div>nenhuma nota ainda</li>';return;}
  notas.forEach((n,i)=>{
    const li=document.createElement('li');li.className='note-item';
    li.innerHTML=`<div class="note-body"><div class="note-title">${n.titulo}</div>${n.corpo?`<div class="note-content">${n.corpo}</div>`:''}<span class="note-tag tag-${n.cat}">${n.cat}</span></div><button class="btn-del" onclick="removeNota(${i})">✕</button>`;
    ul.appendChild(li);
  });
}
function addNota(){
  const t=document.getElementById('n-titulo').value.trim();
  const c=document.getElementById('n-corpo').value.trim();
  const cat=document.getElementById('n-cat').value;
  if(!t)return;
  notas.unshift({titulo:t,corpo:c,cat});
  save('notas',notas);renderNotas();
  document.getElementById('n-titulo').value='';document.getElementById('n-corpo').value='';
}
function removeNota(i){notas.splice(i,1);save('notas',notas);renderNotas();}
renderNotas();

// ---- EVENTS ----
let events=load('events',[]);

// ---- MODAL ----
let modalTipo='rose';
function openModal(){document.getElementById('modal-overlay').classList.remove('hidden');document.getElementById('modal-ev-title').focus();}
function closeModal(){document.getElementById('modal-overlay').classList.add('hidden');}
function handleOverlayClick(e){if(e.target===document.getElementById('modal-overlay'))closeModal();}
function toggleAllDay(cb){document.getElementById('modal-time-fields').style.display=cb.checked?'none':'';}
function selectTipo(tipo){
  modalTipo=tipo;
  document.getElementById('modal-ev-tipo').value=tipo;
  document.getElementById('opt-pessoal').classList.toggle('selected',tipo==='rose');
  document.getElementById('opt-trabalho').classList.toggle('selected',tipo==='green');
}
function saveModalEvent(){
  const nome=document.getElementById('modal-ev-title').value.trim();
  const data=document.getElementById('modal-ev-date').value;
  const hora=document.getElementById('modal-ev-start').value;
  const horaFim=document.getElementById('modal-ev-end').value;
  const allDay=document.getElementById('modal-allday').checked;
  if(!nome||!data)return;
  events.push({nome,data,hora:allDay?'':hora,horaFim:allDay?'':horaFim,tipo:modalTipo,allDay,id:Date.now()});
  save('events',events);renderCal();renderEventList();renderWeek();
  closeModal();
  document.getElementById('modal-ev-title').value='';
  document.getElementById('modal-ev-desc').value='';
  document.getElementById('modal-allday').checked=false;
  document.getElementById('modal-time-fields').style.display='';
  document.getElementById('modal-ev-date').value=now.toISOString().split('T')[0];
  document.getElementById('modal-ev-start').value='09:00';
  document.getElementById('modal-ev-end').value='10:00';
  selectTipo('rose');
}

// ---- MENSAL ----
let calYear=now.getFullYear(),calMonth=now.getMonth();
function switchCal(mode){
  document.getElementById('cal-mensal').style.display=mode==='mensal'?'block':'none';
  document.getElementById('cal-semanal').style.display=mode==='semanal'?'block':'none';
  document.getElementById('btn-mensal').classList.toggle('active',mode==='mensal');
  document.getElementById('btn-semanal').classList.toggle('active',mode==='semanal');
  if(mode==='mensal')renderCal();else renderWeek();
}
function changeMonth(d){calMonth+=d;if(calMonth>11){calMonth=0;calYear++;}if(calMonth<0){calMonth=11;calYear--;}renderCal();}
function renderCal(){
  document.getElementById('cal-title').textContent=months[calMonth]+' '+calYear;
  const grid=document.getElementById('cal-grid');grid.innerHTML='';
  const first=new Date(calYear,calMonth,1).getDay();
  const days=new Date(calYear,calMonth+1,0).getDate();
  for(let i=0;i<first;i++){const d=document.createElement('div');d.className='cal-day empty';grid.appendChild(d);}
  for(let d=1;d<=days;d++){
    const mm=String(calMonth+1).padStart(2,'0');
    const ymKey=`${calYear}-${mm}-${String(d).padStart(2,'0')}`;
    const isToday=d===now.getDate()&&calMonth===now.getMonth()&&calYear===now.getFullYear();
    const cell=document.createElement('div');cell.className='cal-day'+(isToday?' today':'');
    const numEl=document.createElement('div');numEl.className='cal-num';numEl.textContent=d;cell.appendChild(numEl);
    if(events.some(e=>e.data===ymKey)){const dot=document.createElement('div');dot.className='cal-dot';cell.appendChild(dot);}
    grid.appendChild(cell);
  }
  renderEventList();
}
function renderEventList(){
  const ul=document.getElementById('lista-eventos');ul.innerHTML='';
  if(!events.length){ul.innerHTML='<li class="empty"><div class="empty-icon">🌸</div>nenhum compromisso ainda</li>';return;}
  const sorted=[...events].sort((a,b)=>a.data.localeCompare(b.data));
  sorted.forEach(ev=>{
    const realIdx=events.findIndex(e=>e.id===ev.id);
    const li=document.createElement('li');li.className='event-item';
    const dParts=ev.data.split('-');
    const dFmt=`${dParts[2]}/${dParts[1]}`;
    const timeStr=ev.allDay?'dia inteiro':(ev.hora+(ev.horaFim?' – '+ev.horaFim:''));
    li.innerHTML=`<div class="event-color" style="background:${ev.tipo==='green'?'var(--green)':'var(--rose)'}"></div>
      <div class="event-body"><div class="event-name">${ev.nome}</div><div class="event-date">${dFmt}${timeStr?' · '+timeStr:''}</div></div>
      <button class="btn-del" onclick="removeEvent(${realIdx})">✕</button>`;
    ul.appendChild(li);
  });
}
function removeEvent(i){events.splice(i,1);save('events',events);renderCal();renderEventList();renderWeek();}

// ---- SEMANAL VERTICAL ----
const HOUR_START=7,HOUR_END=22,CELL_H=54;
let weekOffset=0;
function getWeekStart(off){const d=new Date(now);d.setDate(d.getDate()-d.getDay()+off*7);d.setHours(0,0,0,0);return d;}
function changeWeek(d){weekOffset+=d;renderWeek();}
function parseHora(h){if(!h)return null;const p=h.split(':');return parseInt(p[0])+parseInt(p[1]||0)/60;}
function renderWeek(){
  const ws=getWeekStart(weekOffset);
  const we=new Date(ws);we.setDate(we.getDate()+6);
  const fmt=d=>String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0');
  document.getElementById('week-title').textContent=fmt(ws)+' – '+fmt(we);
  const table=document.getElementById('week-table');table.innerHTML='';
  const dnames=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const hours=[];for(let h=HOUR_START;h<HOUR_END;h++)hours.push(h);
  const timeCol=document.createElement('div');timeCol.className='time-col';
  const tch=document.createElement('div');tch.className='time-col-header';timeCol.appendChild(tch);
  hours.forEach(h=>{const s=document.createElement('div');s.className='time-slot-label';s.textContent=h+'h';timeCol.appendChild(s);});
  table.appendChild(timeCol);
  const dayColsWrap=document.createElement('div');dayColsWrap.className='day-cols';
  for(let i=0;i<7;i++){
    const day=new Date(ws);day.setDate(day.getDate()+i);
    const isToday=day.toDateString()===now.toDateString();
    const mm=String(day.getMonth()+1).padStart(2,'0');
    const ymKey=`${day.getFullYear()}-${mm}-${String(day.getDate()).padStart(2,'0')}`;
    const col=document.createElement('div');col.className='day-col';
    const hdr=document.createElement('div');hdr.className='day-col-header';
    const dn=document.createElement('div');dn.className='dch-name';dn.textContent=dnames[i];
    const num=document.createElement('div');num.className='dch-num'+(isToday?' today':'');num.textContent=day.getDate();
    hdr.appendChild(dn);hdr.appendChild(num);col.appendChild(hdr);
    const cells=document.createElement('div');cells.className='day-cells';
    cells.style.height=((HOUR_END-HOUR_START)*CELL_H)+'px';cells.style.position='relative';
    hours.forEach(()=>{const c=document.createElement('div');c.className='time-cell';cells.appendChild(c);});
    if(isToday){
      const curH=now.getHours()+now.getMinutes()/60;
      if(curH>=HOUR_START&&curH<HOUR_END){const line=document.createElement('div');line.className='time-now-line';line.style.top=((curH-HOUR_START)*CELL_H)+'px';cells.appendChild(line);}
    }
    events.filter(e=>e.data===ymKey&&!e.allDay&&e.hora).forEach(ev=>{
      const startH=parseHora(ev.hora);
      if(startH===null||startH<HOUR_START||startH>=HOUR_END)return;
      const endH=ev.horaFim?parseHora(ev.horaFim):startH+1;
      const top=(startH-HOUR_START)*CELL_H;
      const height=Math.max((endH-startH)*CELL_H,22);
      const evIdx=events.findIndex(e=>e.id===ev.id);
      const block=document.createElement('div');block.className='ev-block '+ev.tipo;
      block.style.top=top+'px';block.style.height=height+'px';
      block.innerHTML=`<div class="ev-block-name">${ev.nome}</div><div class="ev-block-time">${ev.hora}${ev.horaFim?' – '+ev.horaFim:''}</div>`;
      block.onclick=()=>removeEvent(evIdx);
      cells.appendChild(block);
    });
    col.appendChild(cells);dayColsWrap.appendChild(col);
  }
  table.appendChild(dayColsWrap);
  const scrollEl=table.closest('.week-scroll');
  if(scrollEl){const curH=now.getHours()+now.getMinutes()/60;scrollEl.scrollTop=(Math.max(curH-1,HOUR_START)-HOUR_START)*CELL_H+46;}
}

// ---- METAS ----
let metas=load('metas',[]);
function renderMetas(){
  const ul=document.getElementById('lista-metas');ul.innerHTML='';
  if(!metas.length){ul.innerHTML='<li class="empty"><div class="empty-icon">🎯</div>nenhuma meta ainda</li>';return;}
  metas.forEach((m,i)=>{
    const li=document.createElement('li');li.className='meta-item';
    li.innerHTML=`<div class="meta-top"><span class="meta-name">${m.nome}</span><div class="meta-right"><span class="meta-pct">${m.pct}%</span><button class="btn-del" onclick="removeMeta(${i})">✕</button></div></div><div class="meta-detail">${m.atual} de ${m.total}</div><div class="bar"><div class="bar-fill" style="width:${m.pct}%"></div></div>`;
    ul.appendChild(li);
  });
}
function addMeta(){
  const nome=document.getElementById('m-nome').value.trim();
  const atual=parseFloat(document.getElementById('m-atual').value)||0;
  const total=parseFloat(document.getElementById('m-total').value)||100;
  if(!nome)return;
  const pct=Math.min(100,Math.round(atual/total*100));
  metas.push({nome,atual,total,pct});
  save('metas',metas);renderMetas();
  document.getElementById('m-nome').value='';document.getElementById('m-atual').value='';document.getElementById('m-total').value='';
}
function removeMeta(i){metas.splice(i,1);save('metas',metas);renderMetas();}
renderMetas();

// ---- FINANCEIRO ----
let lancamentos=load('lancamentos',[]);
function renderFin(){
  const rec=lancamentos.filter(l=>l.tipo==='rec').reduce((a,l)=>a+l.val,0);
  const exp=lancamentos.filter(l=>l.tipo==='exp').reduce((a,l)=>a+l.val,0);
  const sal=rec-exp;
  document.getElementById('tot-rec').textContent='R$'+rec.toFixed(2);
  document.getElementById('tot-exp').textContent='R$'+exp.toFixed(2);
  const se=document.getElementById('tot-sal');se.textContent='R$'+Math.abs(sal).toFixed(2);
  se.style.color=sal>=0?'var(--green)':'var(--red)';
  const ul=document.getElementById('lista-fin');
  if(!lancamentos.length){ul.innerHTML='<li class="empty"><div class="empty-icon">🌷</div>nenhum lançamento ainda</li>';return;}
  ul.innerHTML=lancamentos.map(l=>`<li class="fin-item">
    <div class="fin-icon ${l.tipo}">${l.tipo==='rec'?'💚':'🌹'}</div>
    <div class="fin-body"><div class="fin-desc-t">${l.desc}</div><div class="fin-tipo-t">${l.tipo==='rec'?'receita':'despesa'}</div></div>
    <span class="fin-val ${l.tipo}">${l.tipo==='rec'?'+':'-'}R$${l.val.toFixed(2)}</span>
    <button class="btn-del" onclick="removeLan(${l.id})">✕</button>
  </li>`).join('');
}
function addFin(){
  const desc=document.getElementById('f-desc').value.trim();
  const val=parseFloat(document.getElementById('f-val').value)||0;
  const tipo=document.getElementById('f-tipo').value;
  if(!desc||!val)return;
  lancamentos.unshift({desc,val,tipo,id:Date.now()});
  save('lancamentos',lancamentos);renderFin();
  document.getElementById('f-desc').value='';document.getElementById('f-val').value='';
}
function removeLan(id){lancamentos=lancamentos.filter(l=>l.id!==id);save('lancamentos',lancamentos);renderFin();}
renderFin();

// Init calendar
renderCal();renderWeek();

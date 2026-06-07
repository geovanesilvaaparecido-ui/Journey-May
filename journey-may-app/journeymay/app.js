// ---- STORAGE ----
function save(key,val){try{localStorage.setItem('jm_'+key,JSON.stringify(val));}catch(e){}}
function load(key,def){try{const v=localStorage.getItem('jm_'+key);return v!==null?JSON.parse(v):def;}catch(e){return def;}}

// ---- UTILS ----
const now=new Date();
const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function fmtBRL(v){return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmtShortDate(d){return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});}

document.getElementById('hw-date').textContent=now.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

// ---- NAVIGATION ----
const FAB_MAP={notas:'fab-notas',agenda:'fab-agenda',metas:'fab-metas',financeiro:'fab-financeiro'};

function showSection(id){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const sec=document.getElementById('sec-'+id);
  if(sec)sec.classList.add('active');
  const nav=document.getElementById('nav-'+id);
  if(nav)nav.classList.add('active');
  Object.values(FAB_MAP).forEach(fid=>{const f=document.getElementById(fid);if(f)f.classList.add('hidden');});
  if(FAB_MAP[id]){const f=document.getElementById(FAB_MAP[id]);if(f)f.classList.remove('hidden');}
  if(id==='home')renderHome();
  if(id==='agenda')renderCal();
  if(id==='metas')renderMetas();
  if(id==='financeiro')renderFin();
}

// ---- MODALS ----
function openModal(id){document.getElementById(id).classList.remove('hidden');}
function closeModal(id){document.getElementById(id).classList.add('hidden');}
function handleModalClick(e,id){if(e.target===document.getElementById(id))closeModal(id);}

// ---- PWA INSTALL ----
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;document.getElementById('install-banner').classList.remove('hidden');});
window.addEventListener('appinstalled',()=>document.getElementById('install-banner').classList.add('hidden'));
function installApp(){if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.userChoice.then(()=>{deferredPrompt=null;document.getElementById('install-banner').classList.add('hidden');});}}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

// ---- NOTAS ----
const NOTE_COLORS=['#FFF5F7','#FFF0F5','#FFF8FA','#FDEEF4'];
let notas=load('notas',[]);

function renderNotas(){
  const container=document.getElementById('lista-notas');
  const q=(document.getElementById('nota-search').value||'').toLowerCase().trim();
  let list=notas;
  if(q)list=notas.filter(n=>n.titulo.toLowerCase().includes(q)||(n.corpo||'').toLowerCase().includes(q));
  if(!list.length){
    container.innerHTML=`<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-txt">${q?'Nenhuma nota encontrada':'Nenhuma nota ainda'}</div></div>`;
    return;
  }
  container.innerHTML='';
  list.forEach(n=>{
    const div=document.createElement('div');
    div.className='note-card';
    div.style.background=n.cor||NOTE_COLORS[0];
    div.innerHTML=`<div class="note-card-title">${esc(n.titulo)}</div>${n.corpo?`<div class="note-card-body">${esc(n.corpo)}</div>`:''}<div class="note-card-footer"><span class="note-card-date">${n.data||''}</span><button class="note-card-del" onclick="removeNota('${n.id}')">✕</button></div>`;
    container.appendChild(div);
  });
}

function addNota(){
  const t=document.getElementById('n-titulo').value.trim();
  const c=document.getElementById('n-corpo').value.trim();
  if(!t)return;
  const cor=NOTE_COLORS[notas.length%NOTE_COLORS.length];
  notas.unshift({id:Date.now().toString(),titulo:t,corpo:c,cor,data:fmtShortDate(now)});
  save('notas',notas);renderNotas();renderHomeNotas();
  closeModal('modal-nota');
  document.getElementById('n-titulo').value='';
  document.getElementById('n-corpo').value='';
}

function removeNota(id){
  notas=notas.filter(n=>n.id!==id);
  save('notas',notas);renderNotas();renderHomeNotas();
}

renderNotas();

// ---- EVENTS ----
let events=load('events',[]);

// Migrate old format (date string → day/month/year)
events=events.map(ev=>{
  if(ev.data&&ev.day===undefined){
    const d=new Date(ev.data+'T00:00:00');
    return{...ev,day:d.getDate(),month:d.getMonth(),year:d.getFullYear(),categoria:ev.categoria||'pessoal',done:ev.done||false};
  }
  return ev;
});
save('events',events);

const CAT_COLORS={pessoal:'#F2A0B8',saude:'#E8648A',trabalho:'#C45070',social:'#FABDD0'};
let calYear=now.getFullYear(),calMonth=now.getMonth(),selectedDay=now.getDate();

function changeMonth(dir){
  calMonth+=dir;
  if(calMonth>11){calMonth=0;calYear++;}
  if(calMonth<0){calMonth=11;calYear--;}
  const maxD=new Date(calYear,calMonth+1,0).getDate();
  selectedDay=Math.min(selectedDay,maxD);
  renderCal();
}

function renderCal(){
  document.getElementById('cal-title').textContent=months[calMonth]+' '+calYear;
  const grid=document.getElementById('cal-grid');grid.innerHTML='';
  const first=new Date(calYear,calMonth,1).getDay();
  const days=new Date(calYear,calMonth+1,0).getDate();
  for(let i=0;i<first;i++){const d=document.createElement('div');d.className='cal-day empty';grid.appendChild(d);}
  for(let d=1;d<=days;d++){
    const isToday=d===now.getDate()&&calMonth===now.getMonth()&&calYear===now.getFullYear();
    const isSel=d===selectedDay;
    const hasEv=events.some(e=>e.day===d&&e.month===calMonth&&e.year===calYear);
    const cell=document.createElement('div');
    cell.className='cal-day'+(isToday?' today':'')+(isSel&&!isToday?' selected':'');
    const num=document.createElement('div');num.className='cal-num';num.textContent=d;cell.appendChild(num);
    if(hasEv){const dot=document.createElement('div');dot.className='cal-dot';cell.appendChild(dot);}
    cell.onclick=()=>{selectedDay=d;renderCal();};
    grid.appendChild(cell);
  }
  renderEventList();
}

function renderEventList(){
  const container=document.getElementById('lista-eventos');
  const label=document.getElementById('ev-day-label');
  const dayEvs=events.filter(e=>e.day===selectedDay&&e.month===calMonth&&e.year===calYear);
  label.textContent=`${selectedDay} de ${months[calMonth]} — ${dayEvs.length} evento${dayEvs.length!==1?'s':''}`;
  if(!dayEvs.length){container.innerHTML='<div class="empty-state"><div class="empty-icon">🌸</div><div class="empty-txt">Nenhum evento neste dia</div></div>';return;}
  container.innerHTML='';
  dayEvs.forEach(ev=>{
    const div=document.createElement('div');
    div.className='event-card'+(ev.done?' done':'');
    div.innerHTML=`<div class="event-check${ev.done?' checked':''}" onclick="toggleEvent('${ev.id}')">${ev.done?'✓':''}</div><div class="event-body"><div class="event-name">${esc(ev.nome)}</div><div class="event-time">${ev.hora||'Sem horário'}</div></div><span class="event-badge badge-${ev.categoria||'pessoal'}">${ev.categoria||'pessoal'}</span><button class="event-del" onclick="removeEvent('${ev.id}')">✕</button>`;
    container.appendChild(div);
  });
}

function addEvento(){
  const nome=document.getElementById('ev-nome').value.trim();
  const hora=document.getElementById('ev-hora').value;
  const categoria=document.getElementById('ev-cat').value;
  if(!nome)return;
  events.push({id:Date.now().toString(),nome,hora,categoria,done:false,day:selectedDay,month:calMonth,year:calYear});
  save('events',events);renderCal();renderHomeAgenda();
  closeModal('modal-evento');
  document.getElementById('ev-nome').value='';
}

function toggleEvent(id){
  const ev=events.find(e=>e.id===id);
  if(ev){ev.done=!ev.done;save('events',events);renderEventList();renderHomeAgenda();}
}

function removeEvent(id){
  events=events.filter(e=>e.id!==id);
  save('events',events);renderCal();renderHomeAgenda();
}

renderCal();

// ---- METAS ----
let metas=load('metas',[]);

// Migrate old format
metas=metas.map(m=>({id:m.id||Date.now().toString(),nome:m.nome,atual:m.atual||0,total:m.total||100,unidade:m.unidade||'',categoria:m.categoria||'pessoal',prioridade:m.prioridade||'media',prazo:m.prazo||'',subtarefas:m.subtarefas||[]}));

const CAT_EMOJI_META={saude:'💪',estudo:'📚',financeiro:'💰',pessoal:'🌸',trabalho:'💼'};

function calcMB(){
  if(!metas.length)return{pct:0,done:0,total:0};
  const done=metas.filter(m=>m.atual>=m.total).length;
  const pct=Math.round(metas.reduce((acc,m)=>acc+Math.min(100,Math.round(m.atual/m.total*100)),0)/metas.length);
  return{pct,done,total:metas.length};
}

function updateMB(){
  const{pct,done,total}=calcMB();
  document.getElementById('mb-fill-circle').style.strokeDashoffset=213.6*(1-pct/100);
  document.getElementById('mb-pct-text').textContent=pct+'%';
  document.getElementById('mb-sub-text').textContent=`${done} de ${total} meta${total!==1?'s':''} concluída${total!==1?'s':''}`;
}

function daysLeft(prazo){
  if(!prazo)return null;
  const diff=Math.ceil((new Date(prazo+'T00:00:00')-new Date())/86400000);
  return diff;
}

function renderMetas(){
  const container=document.getElementById('lista-metas');
  updateMB();
  if(!metas.length){container.innerHTML='<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-txt">Nenhuma meta ainda</div></div>';return;}
  container.innerHTML='';
  metas.forEach((m,idx)=>{
    const pct=m.total>0?Math.min(100,Math.round(m.atual/m.total*100)):0;
    const circ=125.7;
    const offset=(circ*(1-pct/100)).toFixed(1);
    const isDone=m.atual>=m.total;
    const dr=daysLeft(m.prazo);
    let daysStr='';
    if(dr!==null)daysStr=dr>0?`· ${dr} dia${dr!==1?'s':''} restante${dr!==1?'s':''}`:(dr===0?'· vence hoje':'· venceu');
    const stHtml=(m.subtarefas||[]).map((st,si)=>`<div class="subtask-item"><input type="checkbox" class="subtask-check" ${st.done?'checked':''} onchange="toggleSubtask(${idx},${si})"><span class="subtask-label${st.done?' done-txt':''}">${esc(st.nome)}</span></div>`).join('');
    const div=document.createElement('div');
    div.className='meta-card';
    div.innerHTML=`
      <div class="meta-card-top">
        <div class="meta-circle-wrap">
          <svg class="meta-svg" viewBox="0 0 52 52">
            <circle class="meta-track" cx="26" cy="26" r="20"/>
            <circle class="meta-fill" cx="26" cy="26" r="20" style="stroke-dasharray:${circ};stroke-dashoffset:${offset}"/>
          </svg>
          <div class="meta-circle-pct">${pct}%</div>
        </div>
        <div class="meta-info">
          <div class="meta-name">${esc(m.nome)}</div>
          <div class="meta-badges">
            <span class="meta-badge-prio prio-${m.prioridade||'media'}">${m.prioridade||'média'}</span>
            <span class="meta-badge-cat">${CAT_EMOJI_META[m.categoria]||'🌸'} ${m.categoria||''}</span>
          </div>
        </div>
        <button class="meta-del" onclick="removeMeta(${idx})">✕</button>
      </div>
      <div class="meta-progress-text">${m.atual} de ${m.total} ${esc(m.unidade)} ${daysStr}</div>
      <div class="meta-ctrl">
        <button class="meta-ctrl-btn" onclick="stepMeta(${idx},-1)">−</button>
        <button class="meta-ctrl-btn" onclick="stepMeta(${idx},1)">+</button>
      </div>
      ${isDone?'<div class="meta-celebrate">✨ Meta concluída! Parabéns, May!</div>':''}
      <button class="meta-subtasks-toggle" onclick="toggleStPanel(this)">▸ subtarefas (${(m.subtarefas||[]).length})</button>
      <div class="meta-subtasks-wrap">
        ${stHtml}
        <div class="subtask-add-row">
          <input type="text" class="subtask-add-input" placeholder="Nova subtarefa..." id="st-inp-${idx}">
          <button class="subtask-add-btn" onclick="addSubtask(${idx})">+</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function stepMeta(idx,step){
  metas[idx].atual=Math.max(0,Math.min(metas[idx].total,(metas[idx].atual||0)+step));
  save('metas',metas);renderMetas();renderHomeMetas();
}

function addMeta(){
  const nome=document.getElementById('m-nome').value.trim();
  const total=parseFloat(document.getElementById('m-total').value)||100;
  const unidade=document.getElementById('m-unidade').value.trim();
  const categoria=document.getElementById('m-cat').value;
  const prioridade=document.getElementById('m-prio').value;
  const prazo=document.getElementById('m-prazo').value;
  if(!nome)return;
  metas.push({id:Date.now().toString(),nome,atual:0,total,unidade,categoria,prioridade,prazo,subtarefas:[]});
  save('metas',metas);renderMetas();renderHomeMetas();
  closeModal('modal-meta');
  ['m-nome','m-total','m-unidade','m-prazo'].forEach(id=>{document.getElementById(id).value='';});
}

function removeMeta(idx){metas.splice(idx,1);save('metas',metas);renderMetas();renderHomeMetas();}

function toggleStPanel(btn){
  const wrap=btn.nextElementSibling;
  wrap.classList.toggle('open');
  btn.textContent=(wrap.classList.contains('open')?'▾':'▸')+btn.textContent.slice(1);
}

function toggleSubtask(mi,si){
  metas[mi].subtarefas[si].done=!metas[mi].subtarefas[si].done;
  save('metas',metas);renderMetas();
}

function addSubtask(mi){
  const inp=document.getElementById('st-inp-'+mi);
  const nome=inp.value.trim();
  if(!nome)return;
  if(!metas[mi].subtarefas)metas[mi].subtarefas=[];
  metas[mi].subtarefas.push({nome,done:false});
  save('metas',metas);renderMetas();
}

renderMetas();

// ---- FINANCEIRO ----
let lancamentos=load('lancamentos',[]);
let finTipo='rec',finFilter='todos';

const CAT_REC=['salario','freelance','outros'];
const CAT_EXP=['alimentacao','transporte','lazer','saude','compras','outros'];
const CAT_EMOJI_FIN={alimentacao:'🍽️',transporte:'🚌',lazer:'🎀',saude:'💊',compras:'🛍️',salario:'💼',freelance:'✨',outros:'💸'};

function setFinTipo(tipo){
  finTipo=tipo;
  document.getElementById('fin-btn-rec').classList.toggle('active',tipo==='rec');
  document.getElementById('fin-btn-exp').classList.toggle('active',tipo==='exp');
  const cats=tipo==='rec'?CAT_REC:CAT_EXP;
  document.getElementById('f-cat').innerHTML=cats.map(c=>`<option value="${c}">${CAT_EMOJI_FIN[c]||'💸'} ${c}</option>`).join('');
}

function openFinModal(){setFinTipo('rec');openModal('modal-fin');}

function setFinFilter(filter,btn){
  finFilter=filter;
  document.querySelectorAll('.fin-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderFin();
}

function renderFin(){
  const rec=lancamentos.filter(l=>l.tipo==='rec').reduce((a,l)=>a+l.val,0);
  const exp=lancamentos.filter(l=>l.tipo==='exp').reduce((a,l)=>a+l.val,0);
  const sal=rec-exp;
  const salEl=document.getElementById('fin-saldo');
  salEl.textContent=fmtBRL(sal);
  salEl.style.opacity=sal<0?'0.85':'1';
  document.getElementById('fin-rec').textContent=fmtBRL(rec);
  document.getElementById('fin-exp').textContent=fmtBRL(exp);
  let list=lancamentos;
  if(finFilter!=='todos')list=lancamentos.filter(l=>l.tipo===finFilter);
  const container=document.getElementById('lista-fin');
  if(!list.length){container.innerHTML='<div class="empty-state"><div class="empty-icon">🌷</div><div class="empty-txt">Nenhum lançamento ainda</div></div>';return;}
  container.innerHTML='';
  list.forEach(l=>{
    const div=document.createElement('div');
    div.className='fin-item';
    div.innerHTML=`<div class="fin-emoji">${CAT_EMOJI_FIN[l.categoria]||'💸'}</div><div class="fin-body"><div class="fin-desc">${esc(l.desc)}</div><div class="fin-cat-date">${esc(l.categoria||'')}${l.data?' · '+l.data:''}</div></div><span class="fin-val ${l.tipo}">${l.tipo==='rec'?'+':'-'}${fmtBRL(l.val)}</span><button class="fin-del" onclick="removeLan('${l.id}')">✕</button>`;
    container.appendChild(div);
  });
}

function addFin(){
  const desc=document.getElementById('f-desc').value.trim();
  const val=parseFloat(document.getElementById('f-val').value)||0;
  const categoria=document.getElementById('f-cat').value;
  if(!desc||!val)return;
  lancamentos.unshift({id:Date.now().toString(),desc,val,tipo:finTipo,categoria,data:fmtShortDate(now)});
  save('lancamentos',lancamentos);renderFin();renderHomeFin();
  closeModal('modal-fin');
  document.getElementById('f-desc').value='';document.getElementById('f-val').value='';
}

function removeLan(id){
  lancamentos=lancamentos.filter(l=>l.id!==id);
  save('lancamentos',lancamentos);renderFin();renderHomeFin();
}

setFinTipo('rec');
renderFin();

// ---- HOME PREVIEW ----
function renderHomeNotas(){
  const c=document.getElementById('home-notas-preview');
  if(!notas.length){c.innerHTML='<div class="hc-empty">Nenhuma nota ainda</div>';return;}
  c.innerHTML=notas.slice(0,2).map(n=>`<div class="home-note-item"><div class="home-note-title">${esc(n.titulo)}</div>${n.corpo?`<div class="home-note-preview">${esc(n.corpo)}</div>`:''}</div>`).join('');
}

function renderHomeAgenda(){
  const c=document.getElementById('home-agenda-preview');
  const evs=events.filter(e=>e.day===now.getDate()&&e.month===now.getMonth()&&e.year===now.getFullYear());
  if(!evs.length){c.innerHTML='<div class="hc-empty">Nenhum evento hoje</div>';return;}
  c.innerHTML=evs.map(ev=>`<div class="home-ev-item"><div class="home-ev-dot" style="background:${CAT_COLORS[ev.categoria]||'#E8648A'}"></div><div class="home-ev-name">${esc(ev.nome)}${ev.hora?' · '+ev.hora:''}</div></div>`).join('');
}

function renderHomeMetas(){
  const c=document.getElementById('home-metas-preview');
  if(!metas.length){c.innerHTML='<div class="hc-empty">Nenhuma meta ainda</div>';return;}
  c.innerHTML=metas.slice(0,3).map(m=>{
    const pct=m.total>0?Math.min(100,Math.round(m.atual/m.total*100)):0;
    return`<div class="home-meta-item"><div class="home-meta-row"><span class="home-meta-name">${esc(m.nome)}</span><span class="home-meta-pct">${pct}%</span></div><div class="home-bar"><div class="home-bar-fill" style="width:${pct}%"></div></div></div>`;
  }).join('');
}

function renderHomeFin(){
  const c=document.getElementById('home-fin-preview');
  const rec=lancamentos.filter(l=>l.tipo==='rec').reduce((a,l)=>a+l.val,0);
  const exp=lancamentos.filter(l=>l.tipo==='exp').reduce((a,l)=>a+l.val,0);
  const sal=rec-exp;
  c.innerHTML=`<div class="home-fin-row"><span class="home-fin-label">Saldo</span><span class="home-fin-val" style="color:${sal>=0?'var(--green)':'var(--red)'}">${fmtBRL(sal)}</span></div><div class="home-fin-row"><span class="home-fin-label">Receitas</span><span class="home-fin-val" style="color:var(--green)">${fmtBRL(rec)}</span></div><div class="home-fin-row"><span class="home-fin-label">Despesas</span><span class="home-fin-val" style="color:var(--red)">${fmtBRL(exp)}</span></div>`;
}

function renderHome(){renderHomeNotas();renderHomeAgenda();renderHomeMetas();renderHomeFin();}

// ---- INIT ----
renderHome();

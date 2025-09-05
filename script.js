// ----- Utilities -----
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];
const storageKey = 'taskmate:v1';

/** @type {Array<{id:string, text:string, done:boolean, fav:boolean, created:number}>} */
let tasks = [];

function uid(){ return Math.random().toString(36).slice(2,9) }

function save(){ localStorage.setItem(storageKey, JSON.stringify(tasks)) }
function load(){ tasks = JSON.parse(localStorage.getItem(storageKey) || '[]') }

function fmtDate(ts){
  const d = new Date(ts); return d.toLocaleString(undefined, { dateStyle:'medium', timeStyle:'short' })
}

// ----- Rendering -----
const listEl = $('#list');
const favListEl = $('#favList');

function render(filter='all', search=''){
  const query = search.trim().toLowerCase();
  const data = tasks.filter(t => {
    if (query && !t.text.toLowerCase().includes(query)) return false;
    if (filter==='active' && t.done) return false;
    if (filter==='done' && !t.done) return false;
    if (filter==='fav' && !t.fav) return false;
    return true;
  });
  draw(listEl, data);
  const favs = tasks.filter(t => t.fav);
  draw(favListEl, favs);
  $('#favEmpty').hidden = favs.length !== 0;
}

function draw(container, data){
  container.innerHTML = '';
  if (!data.length){
    const div = document.createElement('div');
    div.className = 'empty';
    div.textContent = 'Nothing Here, Add Some.';
    container.appendChild(div);
    return;
  }
  const tpl = $('#itemTemplate');
  data.forEach(task => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = task.id;
    const cb = $('.checkbox', node);
    const title = $('.title', node);
    const meta = $('.meta', node);
    const favBtn = $('.fav-btn', node);
    const delBtn = $('.del-btn', node);

    cb.checked = task.done;
    if (task.done) node.classList.add('done');
    title.textContent = task.text;
    meta.textContent = `Created: ${fmtDate(task.created)}`;
    if (task.fav) favBtn.classList.add('fav');

    // Events
    cb.addEventListener('change', () => {
      task.done = cb.checked; node.classList.toggle('done', task.done); save(); render(currentFilter(), $('#search').value);
    });
    favBtn.addEventListener('click', () => {
      task.fav = !task.fav; favBtn.classList.toggle('fav', task.fav); save(); render(currentFilter(), $('#search').value);
    });
    delBtn.addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id); save(); render(currentFilter(), $('#search').value);
    });
    title.addEventListener('input', () => {
      task.text = title.textContent.trim(); save();
    });
    title.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); title.blur(); }});

    // Drag & drop ordering
    node.addEventListener('dragstart', e=>{
      e.dataTransfer.setData('text/plain', task.id);
    });
    node.addEventListener('dragover', e=>{ e.preventDefault(); node.style.outline = '2px dashed rgba(124,158,255,.5)';});
    node.addEventListener('dragleave', ()=>{ node.style.outline='none' });
    node.addEventListener('drop', e=>{
      e.preventDefault(); node.style.outline='none';
      const fromId = e.dataTransfer.getData('text/plain');
      if (fromId === task.id) return;
      const fromIndex = tasks.findIndex(t=>t.id===fromId);
      const toIndex = tasks.findIndex(t=>t.id===task.id);
      const [moved] = tasks.splice(fromIndex,1);
      tasks.splice(toIndex,0,moved);
      save(); render(currentFilter(), $('#search').value);
    });

    container.appendChild(node);
  });
}

// ----- Controls -----
function currentFilter(){
  const active = $('.chip.active');
  return active ? active.dataset.filter : 'all';
}

function addTask(text){
  const t = text.trim();
  if(!t) return;
  tasks.unshift({ id: uid(), text: t, done:false, fav:false, created: Date.now() });
  save();
  $('#newTask').value = '';
  render(currentFilter(), $('#search').value);
}

// Buttons & inputs
$('#addBtn').addEventListener('click', ()=> addTask($('#newTask').value));
$('#newTask').addEventListener('keydown', e=>{ if(e.key==='Enter'){ addTask(e.target.value) }});
$('#clearDone').addEventListener('click', ()=>{ tasks = tasks.filter(t=>!t.done); save(); render(currentFilter(), $('#search').value); });

// Search
$('#search').addEventListener('input', e=> render(currentFilter(), e.target.value));
window.addEventListener('keydown', e=>{
  if (e.ctrlKey && e.key === '/') { e.preventDefault(); $('#search').focus(); }
});

// Filters
$$('.chip').forEach(ch => ch.addEventListener('click', ()=>{
  $$('.chip').forEach(x=>x.classList.remove('active'));
  ch.classList.add('active');
  render(ch.dataset.filter, $('#search').value);
}));

// Tabs
$$('.tab-btn').forEach(btn=> btn.addEventListener('click', ()=>{
  $$('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const tab = btn.dataset.tab;
  $('#tab-tasks').hidden = tab !== 'tasks';
  $('#tab-favs').hidden = tab !== 'favs';
  $('#tab-settings').hidden = tab !== 'settings';
}));

// Theme toggle
const themeToggle = $('#themeToggle');
const themeKey = 'taskmate:theme';
function applyTheme(){
  const v = localStorage.getItem(themeKey) || 'dark';
  document.documentElement.classList.toggle('light', v==='light');
  themeToggle.checked = v==='light';
}
themeToggle.addEventListener('change', ()=>{
  localStorage.setItem(themeKey, themeToggle.checked ? 'light' : 'dark');
  applyTheme();
});

// Export / Import / Reset
$('#exportBtn').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(tasks, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'taskmate-tasks.json'; a.click();
  URL.revokeObjectURL(url);
});
$('#importFile').addEventListener('change', (e)=>{
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{ const data = JSON.parse(reader.result);
      if(Array.isArray(data)){
        // naive validation
        tasks = data.map(x=>({ id: x.id||uid(), text: String(x.text||''), done: !!x.done, fav: !!x.fav, created: Number(x.created)||Date.now() }));
        save(); render(currentFilter(), $('#search').value);
      }
    }catch(err){ alert('Invalid File.') }
  };
  reader.readAsText(file);
  e.target.value = '';
});
$('#resetBtn').addEventListener('click', ()=>{
  if(confirm('Delete All Tasks??')){ tasks = []; save(); render(currentFilter(), $('#search').value); }
});

// Boot
load();
applyTheme();
render();
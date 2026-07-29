const STORAGE_KEY = "skyblockDailyTracker.v1";
const defaultTasks = [
  { id: "daily-commissions", name: "Daily Commissions", category: "Mining", type: "group", subtasks: [{id:"commission-1",name:"Commission 1"},{id:"commission-2",name:"Commission 2"},{id:"commission-3",name:"Commission 3"},{id:"commission-4",name:"Commission 4"}], archived:false },
  { id: "greenhouse", name: "Greenhouse", category: "Farming", type: "group", subtasks: [{id:"greenhouse-crops",name:"Collect crops"},{id:"greenhouse-visitors",name:"Check visitors"},{id:"greenhouse-upgrades",name:"Check upgrades"}], archived:false },
  { id: "experimentation-table", name: "Experimentation Table", category: "Enchanting", type: "single", subtasks: [], archived:false },
  { id: "daily-heavy-pearls", name: "Heavy Pearls", category: "Crimson Isle", type: "single", subtasks: [], archived:false },
  { id: "daily-rift", name: "Rift Visit", category: "Rift", type: "single", subtasks: [], archived:false }
];

let state = loadState();
let activeCategory = null;

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed?.tasks && parsed?.days) return parsed;
  } catch (_) {}
  return { version:1, tasks:defaultTasks, days:{}, createdAt:new Date().toISOString() };
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function localDateKey(date = new Date()) { return [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-"); }
function dayData(key=localDateKey()) { state.days[key] ||= {}; return state.days[key]; }
function slugify(s) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "task"; }
function uniqueId(base) { let id=base, n=2; while(state.tasks.some(t=>t.id===id)) id=`${base}-${n++}`; return id; }
function escapeHtml(s="") { return s.replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
function showToast(message) { const t=document.querySelector("#toast"); t.textContent=message; t.classList.add("show"); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>t.classList.remove("show"),1800); }

function categories() { return [...new Set(state.tasks.filter(t=>!t.archived).map(t=>t.category))].sort(); }
function taskUnits(task) { return task.type === "group" ? task.subtasks.length : 1; }
function completedUnits(task, data=dayData()) {
  const value=data[task.id];
  if(task.type==="group") return task.subtasks.filter(s=>value?.[s.id]).length;
  return value ? 1 : 0;
}
function isComplete(task,data=dayData()) { return completedUnits(task,data)===taskUnits(task) && taskUnits(task)>0; }

function renderAll() {
  document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric"}).format(new Date());
  renderTabs(); renderToday(); renderManage(); renderHistory();
}
function renderTabs() {
  const cats=categories();
  if(!activeCategory || !cats.includes(activeCategory)) activeCategory=cats[0] || null;
  document.querySelector("#categoryTabs").innerHTML=cats.map(c=>`<button class="${c===activeCategory?"active":""}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");
}
function renderToday() {
  const tasks=state.tasks.filter(t=>!t.archived && t.category===activeCategory);
  const data=dayData();
  document.querySelector("#taskList").innerHTML=tasks.length?tasks.map(taskCard).join(""):`<div class="empty">No tasks in this category yet.</div>`;
  const all=state.tasks.filter(t=>!t.archived), total=all.reduce((n,t)=>n+taskUnits(t),0), done=all.reduce((n,t)=>n+completedUnits(t,data),0);
  document.querySelector("#progressText").textContent=`${done} / ${total}`;
  document.querySelector("#progressBar").style.width=`${total ? done/total*100 : 0}%`;
  saveState();
}
function taskCard(task,data=dayData(),readonly=false) {
  const done=completedUnits(task,data), total=taskUnits(task);
  const rows=task.type==="group" ? task.subtasks.map(s=>checkRow(task.id,s.id,s.name,!!data[task.id]?.[s.id],readonly)).join("") : checkRow(task.id,"single",task.name,!!data[task.id],readonly,true);
  return `<article class="task-card ${done===total&&total?"complete":""}"><div class="task-top"><div><div class="task-title">${escapeHtml(task.name)}</div><div class="task-category">${escapeHtml(task.category)}</div></div><span class="badge">${done} / ${total}</span></div><div>${rows}</div></article>`;
}
function checkRow(taskId,subId,label,checked,readonly,hideLabel=false) {
  return `<label class="check-row"><input type="checkbox" data-task="${taskId}" data-subtask="${subId}" ${checked?"checked":""} ${readonly?"disabled":""}><span>${hideLabel?"Complete":escapeHtml(label)}</span></label>`;
}
function renderManage() {
  document.querySelector("#manageList").innerHTML=state.tasks.length?state.tasks.map(t=>`<article class="manage-card ${t.archived?"archived":""}"><div><div class="task-title">${escapeHtml(t.name)}</div><div class="task-category">${escapeHtml(t.category)} · ${t.type==="group"?`${t.subtasks.length} checkboxes`:"Single checkbox"}${t.archived?" · Archived":""}</div></div><div class="manage-actions"><button class="secondary-button" data-edit="${t.id}">Edit</button><button class="${t.archived?"secondary-button":"danger-secondary"}" data-archive="${t.id}">${t.archived?"Restore":"Archive"}</button></div></article>`).join(""):`<div class="empty">No tasks yet.</div>`;
}
function renderHistory() {
  const input=document.querySelector("#historyDate");
  if(!input.value) input.value=Object.keys(state.days).sort().reverse()[0] || localDateKey();
  const key=input.value, data=state.days[key] || {};
  const visible=state.tasks.filter(t=>data[t.id]!==undefined || !t.archived);
  const total=visible.reduce((n,t)=>n+taskUnits(t),0), done=visible.reduce((n,t)=>n+completedUnits(t,data),0);
  document.querySelector("#historySummary").innerHTML=`<span class="muted">${escapeHtml(key)}</span><h2>${done} of ${total} completed</h2><p class="muted">${total?Math.round(done/total*100):0}% completion</p>`;
  document.querySelector("#historyList").innerHTML=visible.length?visible.map(t=>taskCard(t,data,true)).join(""):`<div class="empty">No history for this date.</div>`;
}

function setCheckbox(taskId,subId,checked) {
  const task=state.tasks.find(t=>t.id===taskId), data=dayData(); if(!task) return;
  if(task.type==="group") { data[task.id] ||= {}; data[task.id][subId]=checked; }
  else data[task.id]=checked;
  saveState(); renderToday(); renderHistory();
}
function openTaskDialog(task=null) {
  document.querySelector("#dialogTitle").textContent=task?"Edit task":"Add task";
  document.querySelector("#taskId").value=task?.id||"";
  document.querySelector("#taskName").value=task?.name||"";
  document.querySelector("#taskCategory").value=task?.category||activeCategory||"Miscellaneous";
  document.querySelector("#taskType").value=task?.type||"single";
  document.querySelector("#taskSubtasks").value=task?.subtasks.map(s=>s.name).join("\n")||"";
  toggleSubtasks(); document.querySelector("#taskDialog").showModal();
}
function toggleSubtasks(){ document.querySelector("#subtasksField").classList.toggle("hidden",document.querySelector("#taskType").value!=="group"); }
function saveTaskFromForm() {
  const existingId=document.querySelector("#taskId").value, name=document.querySelector("#taskName").value.trim(), category=document.querySelector("#taskCategory").value.trim(), type=document.querySelector("#taskType").value;
  if(!name||!category) return;
  const lines=document.querySelector("#taskSubtasks").value.split("\n").map(x=>x.trim()).filter(Boolean);
  if(type==="group"&&!lines.length){ showToast("Add at least one checklist item"); return false; }
  const existing=state.tasks.find(t=>t.id===existingId);
  if(existing){ existing.name=name; existing.category=category; existing.type=type; existing.subtasks=type==="group"?lines.map((line,i)=>existing.subtasks[i]?.name===line?existing.subtasks[i]:{id:uniqueSubId(existing,line,i),name:line}):[]; }
  else { const id=uniqueId(slugify(name)); state.tasks.push({id,name,category,type,subtasks:type==="group"?lines.map((line,i)=>({id:`${slugify(line)}-${i+1}`,name:line})):[],archived:false}); }
  activeCategory=category; saveState(); renderAll(); showToast(existing?"Task updated":"Task added"); return true;
}
function uniqueSubId(task,line,i){ const base=slugify(line)||`item-${i+1}`; let id=base,n=2; const ids=new Set(task.subtasks.map(s=>s.id)); while(ids.has(id)) id=`${base}-${n++}`; return id; }
function exportBackup(){ const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`skyblock-tracker-backup-${localDateKey()}.json`; a.click(); URL.revokeObjectURL(a.href); showToast("Backup exported"); }
function importBackup(file){ const r=new FileReader(); r.onload=()=>{ try{ const parsed=JSON.parse(r.result); if(!parsed.tasks||!parsed.days) throw new Error(); state=parsed; saveState(); activeCategory=null; renderAll(); showToast("Backup imported"); }catch(_){ alert("That file is not a valid Skyblock Tracker backup."); } }; r.readAsText(file); }

addEventListener("click",e=>{
  const nav=e.target.closest("[data-view]"); if(nav){ document.querySelectorAll(".nav-button,.view").forEach(x=>x.classList.remove("active")); nav.classList.add("active"); document.querySelector(`#${nav.dataset.view}View`).classList.add("active"); }
  const tab=e.target.closest("[data-category]"); if(tab){ activeCategory=tab.dataset.category; renderTabs(); renderToday(); }
  if(e.target.matches("input[type=checkbox][data-task]")) setCheckbox(e.target.dataset.task,e.target.dataset.subtask,e.target.checked);
  const edit=e.target.closest("[data-edit]"); if(edit) openTaskDialog(state.tasks.find(t=>t.id===edit.dataset.edit));
  const archive=e.target.closest("[data-archive]"); if(archive){ const t=state.tasks.find(t=>t.id===archive.dataset.archive); t.archived=!t.archived; saveState(); renderAll(); showToast(t.archived?"Task archived":"Task restored"); }
});
document.querySelector("#settingsButton").onclick=()=>document.querySelector('[data-view="manage"]').click();
document.querySelector("#addTaskButton").onclick=()=>openTaskDialog();
document.querySelector("#closeDialog").onclick=document.querySelector("#cancelDialog").onclick=()=>document.querySelector("#taskDialog").close();
document.querySelector("#taskType").onchange=toggleSubtasks;
document.querySelector("#taskForm").onsubmit=e=>{ if(!saveTaskFromForm()) e.preventDefault(); };
document.querySelector("#historyDate").onchange=renderHistory;
document.querySelector("#resetTodayButton").onclick=()=>{ if(confirm("Reset every checkbox for today? Your earlier days will not change.")){ state.days[localDateKey()]={}; saveState(); renderAll(); showToast("Today reset"); } };
document.querySelector("#exportButton").onclick=exportBackup;
document.querySelector("#importButton").onclick=()=>document.querySelector("#importFile").click();
document.querySelector("#importFile").onchange=e=>e.target.files[0]&&importBackup(e.target.files[0]);

if("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
renderAll();
